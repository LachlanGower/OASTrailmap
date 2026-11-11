const {it}=require('node:test');
const assert=require('node:assert/strict');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {projectSchedule}=require('../../.phase3-test-dist/domain/scout-projection.js');
const req=(id,stage,extra={})=>({id,text:id,stage,stream:'Camping',tags:['Camp'],theme_tags:['Camp'],prerequisites:[],locations:{preferred:'Hall'},...extra});
it('Stage 2 and 3 remain blocked by any missing Stage 1 statement, even in another stream',()=>{
 const requirements=[req('camp-one',1),req('walk-one',1,{stream:'Bushwalking'}),req('two',2),req('three',3)];
 const records={'Scout::camp-one':{completed:true}},parts=projectSchedule(requirements,records,[{requirementIds:['two','three']}],['Scout']);
 assert.deepEqual(parts[0].requirementScouts.two,[]);assert.deepEqual(parts[0].requirementScouts.three,[]);assert.equal(parts[0].lowerStageRemaining['2'].Scout,1);
});
it('Stage 3 requires all Stage 2 statements even when its own prerequisite list is empty',()=>{
 const requirements=[req('one',1),req('two-a',2),req('two-b',2),req('three',3)],records={'Scout::one':{completed:true},'Scout::two-a':{completed:true}};
 const part=projectSchedule(requirements,records,[{requirementIds:['three']}],['Scout'])[0];assert.deepEqual(part.requirementScouts.three,[]);assert.equal(part.lowerStageRemaining['3'].Scout,1);
});
it('repeats statements until their counts are met and advances only in subsequent weeks',()=>{
 const requirements=[req('one',1,{required_occurrences:3}),req('two',2,{required_occurrences:2}),req('three',3)],records={};
 const weeks=generateSchedule(requirements,records,{weeks:7,requirementsPerStage:1,preferredThemes:['Camp']},['Scout'],false);
 const parts=projectSchedule(requirements,records,weeks,['Scout']);assert.deepEqual(parts.map(p=>p.scoutStages.Scout),[1,1,1,2,2,3,undefined]);
 assert.equal(weeks.filter(w=>w.requirementIds.includes('one')).length,3);assert.equal(weeks.filter(w=>w.requirementIds.includes('two')).length,2);assert.deepEqual(records,{});
 assert.deepEqual(parts[3].conditionalScouts.two,['Scout']);assert.deepEqual(parts[5].conditionalScouts.three,['Scout']);
});
it('existing repeat evidence reduces the remaining sessions without bypassing the stage gate',()=>{
 const requirements=[req('one',1,{required_occurrences:3}),req('two',2),req('three',3)],records={'Scout::one':{completed:false,occurrences:2}};
 const weeks=generateSchedule(requirements,records,{weeks:3,requirementsPerStage:1,preferredThemes:['Camp']},['Scout'],false);
 assert.deepEqual(projectSchedule(requirements,records,weeks,['Scout']).map(p=>p.scoutStages.Scout),[1,2,3]);assert.equal(records['Scout::one'].occurrences,2);
});
it('a linked activity that misses an earlier-stage statement cannot advance the Scout',()=>{
 const requirements=[req('one',1),req('other-one',1),req('two',2),req('three',3)],activities=[{id:'partial',covers:['other-one'],location:'Hall'}];
 const weeks=[{requirementIds:['one','other-one'],stageActivityIds:{'1':'partial'}},{requirementIds:['two','three']}];
 const parts=projectSchedule(requirements,{},weeks,['Scout'],{activities});assert.deepEqual(parts[1].requirementScouts.two,[]);assert.deepEqual(parts[1].requirementScouts.three,[]);assert.equal(parts[1].lowerStageRemaining['2'].Scout,1);
});
it('theme selection cannot hide incomplete earlier-stage work and allow a higher-stage assignment',()=>{
 const requirements=[req('one',1,{tags:['Navigation'],theme_tags:['Navigation']}),req('two',2),req('three',3)];
 const weeks=generateSchedule(requirements,{}, {weeks:2,requirementsPerStage:1,preferredThemes:['Camp']},['Scout'],false);assert.ok(weeks.every(w=>w.requirementIds.length===0));
});
it('authoritative imported lower-stage completions allow an advanced cohort in Week 1',()=>{
 const requirements=[req('one',1,{required_occurrences:5}),req('two',2,{required_occurrences:3}),req('three',3)],records={'Scout::one':{completed:true,source:'workbook'},'Scout::two':{completed:true,source:'workbook'}};
 const week=generateSchedule(requirements,records,{weeks:1,preferredThemes:['Camp']},['Scout'],false)[0];assert.deepEqual(week.requirementIds,['three']);assert.deepEqual(week.scoutAssignments.three,['Scout']);
});
