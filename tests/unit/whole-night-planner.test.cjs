const {it}=require('node:test');
const assert=require('node:assert/strict');
const {planNight}=require('../../.phase3-test-dist/domain/night-planning.js');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {ScoutProjection,projectSchedule}=require('../../.phase3-test-dist/domain/scout-projection.js');
const req=(id,stage,venue='Hall',themes=['Camp'])=>({id,text:id,stage,stream:'Camping',tags:themes,theme_tags:themes,prerequisites:[],locations:{preferred:venue}});
function thirty(){
 const names=Array.from({length:30},(_,i)=>'Synthetic '+i);
 const requirements=[req('one-hall',1),req('one-lake',1,'Lake'),req('two',2,'Lake'),req('three',3,'Lake')],records={};
 for(let i=15;i<30;i++)for(const id of ['one-hall','one-lake'])records[names[i]+'::'+id]={completed:true};
 for(let i=25;i<30;i++)records[names[i]+'::two']={completed:true};
 return {names,requirements,records};
}
it('avoids the early Hall choice and serves all 30 Scouts across three simultaneous stages',()=>{
 const {names,requirements,records}=thirty(),before=JSON.stringify(records);
 const weeks=generateSchedule(requirements,records,{weeks:1,requirementsPerStage:1,preferredThemes:['Camp'],useLocations:true,allowedLocations:['Hall','Lake']},names,false);
 const week=weeks[0],part=projectSchedule(requirements,records,weeks,names)[0];
 assert.equal(week.location,'Lake');assert.deepEqual(week.requirementIds,['one-lake','two','three']);assert.deepEqual(Object.values(part.stageScouts).map(a=>a.length),[15,10,5]);assert.deepEqual(part.unassignedScouts,[]);assert.equal(JSON.stringify(records),before);
});
it('fixed or forbidden locations are hard constraints, with names retained for every unresolved group',()=>{
 const {names,requirements,records}=thirty(),options={requirements,records,scouts:names,themes:['Camp'],target:1,eligible:()=>true,useLocations:true,allowedLocations:['Hall','Lake'],location:'Hall'};
 const plan=planNight(options);assert.equal(plan.location,'Hall');assert.equal(plan.planningMetrics.assignedScouts,15);assert.equal(plan.unassignedScouts.length,15);assert.deepEqual(plan.stageCohortCounts,{'1':15,'2':10,'3':5});
 for(const scout of plan.unassignedScouts)assert.ok(plan.unassignedReasons[scout].includes('Needs Stage'));
 const restricted=planNight({...options,location:undefined,allowedLocations:['Hall']});assert.equal(restricted.location,'Hall');assert.equal(restricted.unassignedScouts.length,15);
});
it('looks ahead to related themes before choosing the primary anchor statement',()=>{
 const requirements=[req('plain',1,'Hall',['Camp']),req('bridge',1,'Hall',['Camp','Cooking']),req('higher',2,'Hall',['Cooking'])];
 const records={'Advanced::plain':{completed:true},'Advanced::bridge':{completed:true}};
 const plan=planNight({requirements,records,scouts:['Beginner','Advanced'],themes:['Camp'],target:1,eligible:()=>true,useLocations:true,allowedLocations:['Hall']});
 assert.deepEqual(new Set(plan.requirementIds),new Set(['bridge','higher']));assert.deepEqual(plan.suggestedRequirementIds,['higher']);assert.deepEqual(plan.suggestionThemes.higher,['Cooking']);assert.equal(plan.unassignedScouts.length,0);
});
it('compares alternative requirement sets rather than committing to the largest first match',()=>{
 const requirements=[req('a',1),req('b',1),req('c',1)],names=Array.from({length:12},(_,i)=>'Scout '+(i+1));
 const needed={a:new Set([1,2,3,4,5,6,7,8]),b:new Set([1,2,3,4,5,6,9,10]),c:new Set([7,8,11,12])},records={};
 for(let i=1;i<=12;i++)for(const r of requirements)if(!needed[r.id].has(i))records['Scout '+i+'::'+r.id]={completed:true};
 const plan=planNight({requirements,records,scouts:names,themes:['Camp'],target:2,eligible:()=>true});
 assert.deepEqual(new Set(plan.requirementIds),new Set(['b','c']));assert.equal(plan.planningMetrics.assignedScouts,12);assert.deepEqual(plan.unassignedScouts,[]);
});
it('uses theme fit to constrain candidates while giving the whole cohort useful work',()=>{
 const requirements=[req('narrow',1,'Hall',['Camp','Cooking']),req('broad',1,'Hall',['Camp']),req('unrelated',1,'Hall',['Sailing'])],records={};
 const names=Array.from({length:15},(_,i)=>'Scout '+i);for(let i=5;i<15;i++)records[names[i]+'::narrow']={completed:true};
 const plan=planNight({requirements,records,scouts:names,themes:['Camp','Cooking'],target:1,eligible:()=>true});
 assert.deepEqual(plan.requirementIds,['broad']);assert.equal(plan.planningMetrics.assignedScouts,15);assert.ok(!plan.requirementIds.includes('unrelated'));
});
it('compares selected themes for whole-night participation instead of stopping at the first available theme',()=>{
 const requirements=[req('early',1,'Hall',['Early']),req('one',1),req('two',2),req('three',3)];
 const records={'B::early':{completed:true},'B::one':{completed:true},'C::early':{completed:true},'C::one':{completed:true},'C::two':{completed:true}};
 const week=generateSchedule(requirements,records,{weeks:1,requirementsPerStage:1,preferredThemes:['Early','Camp']},['A','B','C'],false)[0];
 assert.equal(week.theme,'Camp');assert.equal(week.planningMetrics.assignedScouts,3);assert.equal(week.planningMetrics.activeStages,3);
});
it('groups Scouts from projected progress even if the chosen theme has no work for their stage',()=>{
 const requirements=[req('one',1,'Hall',['Other']),req('two',2)],records={};
 const projection=new ScoutProjection(requirements,records,['Beginner']);assert.deepEqual(projection.weeklyCohorts('week-1'),{Beginner:1});
 const weeks=generateSchedule(requirements,records,{weeks:1,preferredThemes:['Camp']},['Beginner'],false),part=projectSchedule(requirements,records,weeks,['Beginner'])[0];
 assert.deepEqual(part.stageCohorts['1'],['Beginner']);assert.deepEqual(part.unassignedScouts,['Beginner']);assert.ok(part.unassignedReasons.Beginner.includes('Stage 1'));assert.equal(part.scoutStages.Beginner,undefined);
});
it('reports no further work for completed Scouts rather than calling them an unresolved gap',()=>{
 const requirements=[req('one',1)],records={'Done::one':{completed:true}};
 const part=projectSchedule(requirements,records,[{requirementIds:[]}],['Done'])[0];assert.deepEqual(part.completedScouts,['Done']);assert.deepEqual(part.unassignedScouts,[]);
});
it('search branches cannot leak projected credit into the parent or another candidate plan',()=>{
 const requirements=[req('one',1),req('two',2)],records={},original=new ScoutProjection(requirements,records,['Scout']);
 const first=original.copy(),second=original.copy();first.grant(requirements[0],['Scout'],'night');
 assert.equal(first.complete('Scout','one'),true);assert.equal(original.complete('Scout','one'),false);assert.equal(second.complete('Scout','one'),false);
 assert.deepEqual(original.weeklyCohorts('next'),{Scout:1});assert.deepEqual(first.weeklyCohorts('next'),{Scout:2});
});
it('regeneration preserves locked night payloads and progress notifications include every week',()=>{
 const {names,requirements,records}=thirty(),locked={id:'locked',locked:true,requirementIds:['one-hall'],location:'Hall',activity:{filename:'keep.md'},custom:{keep:true}},progress=[];
 const weeks=generateSchedule(requirements,records,{weeks:2,requirementsPerStage:1,preferredThemes:['Camp'],schedule:[locked],useLocations:true,allowedLocations:['Hall','Lake']},names,true,[],(week,total)=>progress.push([week,total]));
 assert.deepEqual(weeks[0],locked);assert.deepEqual(progress,[[1,2],[2,2]]);
});
