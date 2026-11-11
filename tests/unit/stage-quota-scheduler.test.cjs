const {it}=require('node:test');
const assert=require('node:assert/strict');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {planThemeWeek}=require('../../.phase3-test-dist/domain/theme-planning.js');
const {planNight}=require('../../.phase3-test-dist/domain/night-planning.js');
const req=(id,stage,themes,location='Hall')=>({id,stage,text:id,stream:'Camping',tags:themes,theme_tags:themes,prerequisites:[],locations:{preferred:location}});
const options=(requirements,extra={})=>({requirements,records:{},scouts:[],themes:['Camp'],target:2,eligible:()=>true,useLocations:true,allowedLocations:['Hall'],...extra});
it('fills the target independently for all three stages with theme matching ahead of progress scores',()=>{
 const requirements=[1,2,3].flatMap(stage=>[req(stage+'a',stage,['Camp']),req(stage+'b',stage,['Camp']),req(stage+'unrelated',stage,['Other'])]);
 const plan=planNight(options(requirements));
 assert.equal(plan.requirementIds.length,6);assert.deepEqual(plan.stageShortfalls,{'1':0,'2':0,'3':0});assert.deepEqual(plan.suggestedRequirementIds,[]);assert.ok(plan.requirementIds.every(id=>!id.includes('unrelated')));
});
it('fills shortages from themes on primary choices and flags every fallback addition',()=>{
 const requirements=[req('primary-1',1,['Camp','Cooking']),req('primary-2',2,['Camp']),req('primary-3',3,['Camp']),req('fill-1',1,['Cooking']),req('fill-2',2,['Cooking']),req('fill-3',3,['Cooking']),req('unrelated',3,['Sailing'])];
 const plan=planNight(options(requirements));
 assert.equal(plan.requirementIds.length,6);assert.deepEqual(new Set(plan.suggestedRequirementIds),new Set(['fill-1','fill-2','fill-3']));
 for(const id of plan.suggestedRequirementIds)assert.deepEqual(plan.suggestionThemes[id],['Cooking']);assert.ok(!plan.requirementIds.includes('unrelated'));
});
it('collects related themes across stages before attempting fallback and never silently exceeds quotas',()=>{
 const requirements=[req('fill-1',1,['Cooking']),req('primary-3',3,['Camp','Cooking']),req('extra-3',3,['Camp'])];
 const plan=planNight(options(requirements,{target:1}));assert.deepEqual(new Set(plan.requirementIds),new Set(['primary-3','fill-1']));assert.deepEqual(plan.suggestedRequirementIds,['fill-1']);assert.equal(plan.stageShortfalls['2'],1);
});
it('rejects location-incompatible fallback requirements and reports a shortfall instead',()=>{
 const requirements=[req('primary',1,['Camp','Cooking']),req('wrong-location',2,['Cooking'],'Lake'),req('unrelated',2,['Other'])];
 const plan=planNight(options(requirements,{target:1}));assert.deepEqual(plan.requirementIds,['primary']);assert.equal(plan.stageShortfalls['2'],1);assert.equal(plan.location,'Hall');
});
it('keeps a common venue for the whole night even when several locations are permitted',()=>{
 const requirements=[req('hall',1,['Camp','Cooking']),req('lake',2,['Camp','Cooking'],'Lake')];
 const plan=planNight(options(requirements,{target:1,allowedLocations:['Hall','Lake']}));assert.deepEqual(plan.requirementIds,['hall']);assert.equal(plan.location,'Hall');assert.equal(plan.stageShortfalls['2'],1);
});
it('respects an explicitly assigned week location even when general location grouping is off',()=>{
 const requirements=[req('hall',1,['Camp']),req('lake',2,['Camp'],'Lake')];
 const plan=planNight(options(requirements,{target:1,useLocations:false,location:'Lake'}));assert.deepEqual(plan.requirementIds,['lake']);assert.equal(plan.location,'Lake');
});
it('theme-week regeneration uses the same stage quotas, suggestions and evidence-safe preview semantics',()=>{
 const requirements=[req('primary',1,['Camp','Cooking']),req('fill',2,['Cooking'])],records={'Scout::historic':{completed:true,source:'workbook'},'Scout B::primary':{completed:true}};
 const studio={requirementsPerStage:1,schedule:[{requirementIds:[],location:'Hall',activity:{filename:'old.md'}}],useLocations:true,allowedLocations:['Hall']};
 const before=JSON.stringify({records,studio});const week=planThemeWeek(requirements,records,studio,['Scout','Scout B'],0,'Camp');
 assert.deepEqual(week.requirementIds,['primary','fill']);assert.deepEqual(week.suggestedRequirementIds,['fill']);assert.equal(week.requirementsPerStage,1);assert.equal(week.capacity,3);assert.equal(JSON.stringify({records,studio}),before);
});
it('does not repeatedly schedule a one-off skill to hide a later-week shortage',()=>{
 const requirements=[{...req('repeat',1,['Camp']),required_occurrences:2},req('once',2,['Camp'])];
 const weeks=generateSchedule(requirements,{}, {weeks:3,requirementsPerStage:1,preferredThemes:['Camp']},[],false);
 assert.equal(weeks.filter(w=>w.requirementIds.includes('repeat')).length,2);assert.equal(weeks.filter(w=>w.requirementIds.includes('once')).length,1);assert.deepEqual(weeks[2].requirementIds,[]);assert.equal(weeks[2].stageShortfalls['1'],1);
});
