const {it}=require('node:test');
const assert=require('node:assert/strict');
const {ScoutProjection,projectSchedule}=require('../../.phase3-test-dist/domain/scout-projection.js');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {planNight}=require('../../.phase3-test-dist/domain/night-planning.js');
const {planThemeWeek}=require('../../.phase3-test-dist/domain/theme-planning.js');
const {swapScheduleWeeks}=require('../../.phase3-test-dist/domain/week-actions.js');
const req=(id,stage,theme,prerequisites=[],extra={})=>({id,text:id,stage,stream:'Camping',tags:[theme],theme_tags:[theme],prerequisites,locations:{preferred:'Hall'},...extra});
const chain=[req('foundation',1,'Camp'),req('intermediate',2,'Navigation',['foundation']),req('advanced',3,'Camp',['intermediate'])];
const records={'Advanced Scout::foundation':{completed:true,source:'workbook'},'Advanced Scout::intermediate':{completed:true,source:'workbook'},'Beginner::__roster__':{completed:false}};
const scouts=['Beginner','Advanced Scout'];

it('runs Stage 1 and Stage 3 together in Week 1 with different assigned Scouts',()=>{
 const weeks=generateSchedule(chain,records,{weeks:4,requirementsPerStage:1,preferredThemes:['Camp','Navigation'],useLocations:true,allowedLocations:['Hall']},scouts,false);
 assert.deepEqual(weeks[0].scoutAssignments.foundation,['Beginner']);assert.deepEqual(weeks[0].scoutAssignments.advanced,['Advanced Scout']);
 const participation=projectSchedule(chain,records,weeks,scouts);assert.deepEqual(participation[0].stageScouts['1'],['Beginner']);assert.deepEqual(participation[0].stageScouts['3'],['Advanced Scout']);
});
it('advances each Scout across later weeks and reoffers one-off skills to newly ready Scouts',()=>{
 const before=JSON.stringify(records);const weeks=generateSchedule(chain,records,{weeks:4,requirementsPerStage:1,preferredThemes:['Camp','Navigation']},scouts,false);
 assert.deepEqual(weeks[1].scoutAssignments.intermediate,['Beginner']);assert.deepEqual(weeks[2].scoutAssignments.advanced,['Beginner']);
 assert.equal(weeks.filter(w=>w.requirementIds.includes('advanced')).length,2);assert.deepEqual(weeks[3].requirementIds,[]);assert.equal(JSON.stringify(records),before);
 assert.deepEqual(projectSchedule(chain,records,weeks,scouts)[2].conditionalScouts.advanced,['Beginner']);
});
it('blocks higher-stage statements until every Stage 1 statement is finished across streams',()=>{
 const requirements=[req('unrelated-stage1',1,'Other'),req('stage3-ready',3,'Camp',[],{stream:'Bushwalking'})];
 const weeks=generateSchedule(requirements,{}, {weeks:1,requirementsPerStage:1,preferredThemes:['Camp']},['Scout'],false);
 assert.deepEqual(weeks[0].requirementIds,[]);assert.equal(weeks[0].scoutAssignments['stage3-ready'],undefined);
});
it('a lower-stage activity cannot unlock another stage activity for the same Scout that night',()=>{
 const requirements=[req('repeat',1,'Camp',[],{required_occurrences:2}),req('child',2,'Camp',['repeat'])];
 const evidence={'A::repeat':{completed:false,occurrences:1}},scope=['A','B'];
 const plan=planNight({requirements,records:evidence,scouts:scope,themes:['Camp'],target:1,eligible:()=>true,sessionId:'night-1'});
 assert.deepEqual(plan.scoutAssignments.repeat,['A','B']);assert.equal(plan.scoutAssignments.child,undefined);assert.equal(evidence['A::repeat'].occurrences,1);
});
it('does not borrow another Scouts prerequisite completion',()=>{
 const requirements=[req('parent',1,'Other'),req('child',2,'Camp',['parent'])];
 const evidence={'A::parent':{completed:true},'A::child':{completed:true}};
 const weeks=generateSchedule(requirements,evidence,{weeks:1,preferredThemes:['Camp']},['A','B'],false);
 assert.deepEqual(weeks[0].requirementIds,[]);
});
it('imported completion remains authoritative and already-complete skills get no assignment',()=>{
 const r=req('repeat',3,'Camp',[],{required_occurrences:5}),evidence={'A::repeat':{completed:true,source:'workbook',date:'2026-01-01'}};
 const plan=generateSchedule([r],evidence,{weeks:1,preferredThemes:['Camp']},['A','B'],false);
 assert.deepEqual(plan[0].scoutAssignments.repeat,['B']);assert.equal(new ScoutProjection([r],evidence,['A']).count('A','repeat'),5);
});
it('does not count an already reviewed week twice when projecting remaining repeat evidence',()=>{
 const r=req('repeat',1,'Camp',[],{required_occurrences:2}),evidence={'A::repeat':{completed:false,occurrences:1,sessionEvidence:['week-1']}};
 const weeks=generateSchedule([r],evidence,{weeks:3,preferredThemes:['Camp']},['A'],false);
 assert.deepEqual(weeks[0].requirementIds,[]);assert.deepEqual(weeks[1].scoutAssignments.repeat,['A']);assert.deepEqual(weeks[2].requirementIds,[]);
});
it('future locked weeks cannot unlock earlier weeks, and all locked metadata stays untouched',()=>{
 const requirements=[req('parent',1,'Other'),req('child',2,'Camp',['parent'])];
 const locked={id:'future',locked:true,requirementIds:['parent'],location:'Hall',activity:{filename:'retain.md'},scoutAssignments:{parent:['Old scope']},custom:{keep:true}};
 const state={weeks:3,requirementsPerStage:1,preferredThemes:['Camp'],schedule:[{requirementIds:[]},locked]};
 const before=JSON.stringify(state),result=generateSchedule(requirements,{},state,['Scout'],true);
 assert.deepEqual(result[0].requirementIds,[]);assert.deepEqual(result[1],locked);assert.deepEqual(result[2].scoutAssignments.child,['Scout']);assert.equal(JSON.stringify(state),before);
});
it('swapping weeks recalculates assignments chronologically and flags now-blocked plans',()=>{
 const requirements=[req('parent',1,'Camp'),req('child',2,'Camp',['parent'])],weeks=[{id:'first',requirementIds:['parent']},{id:'second',requirementIds:['child']}];
 assert.deepEqual(projectSchedule(requirements,{},weeks,['Scout'])[1].requirementScouts.child,['Scout']);
 const swapped=swapScheduleWeeks(weeks,0,1),result=projectSchedule(requirements,{},swapped,['Scout']);
 assert.deepEqual(result[0].requirementScouts.child,[]);assert.ok(result[0].warnings.some(w=>w.includes('No selected Scouts')));assert.deepEqual(result[1].requirementScouts.parent,['Scout']);
});
it('scope and actual-progress changes re-evaluate old assignments without rewriting the schedule',()=>{
 const weeks=[{id:'one',requirementIds:['foundation','advanced'],locked:true,scoutAssignments:{foundation:['Outdated name']}}],before=JSON.stringify(weeks);
 const initial=projectSchedule(chain,records,weeks,['Beginner']);assert.deepEqual(initial[0].requirementScouts.foundation,['Beginner']);assert.deepEqual(initial[0].requirementScouts.advanced,[]);
 const advanced=projectSchedule(chain,records,weeks,['Advanced Scout']);assert.deepEqual(advanced[0].requirementScouts.foundation,[]);assert.deepEqual(advanced[0].requirementScouts.advanced,['Advanced Scout']);assert.equal(JSON.stringify(weeks),before);
});
it('location-incompatible saved weeks earn no projected credit or participants',()=>{
 const requirements=[req('parent',1,'Camp'),req('child',2,'Camp',['parent'])],weeks=[{requirementIds:['parent'],location:'Lake'},{requirementIds:['child'],location:'Hall'}];
 const result=projectSchedule(requirements,{},weeks,['Scout']);assert.deepEqual(result[0].requirementScouts.parent,[]);assert.deepEqual(result[1].requirementScouts.child,[]);assert.ok(result[0].warnings[0].includes('Location'));
});
it('single-week theme changes replay each Scout through earlier weeks only',()=>{
 const weeks=[{id:'one',requirementIds:['foundation']},{id:'two',requirementIds:[],location:'Hall'},{id:'three',locked:true,requirementIds:['advanced']}];
 const studio={requirementsPerStage:1,schedule:weeks};const before=JSON.stringify({records,weeks});
 const plan=planThemeWeek(chain,records,studio,scouts,1,'Navigation');assert.deepEqual(plan.scoutAssignments.intermediate,['Beginner']);assert.equal(JSON.stringify({records,weeks}),before);
});
it('curriculum mode stays available without assigning or granting imaginary Scouts',()=>{
 const weeks=generateSchedule(chain,records,{weeks:1,strategy:'curriculum',preferredThemes:['Camp']},scouts,false);
 assert.deepEqual(weeks[0].assignmentScope,[]);assert.ok(Object.values(weeks[0].scoutAssignments).every(names=>names.length===0));assert.ok(weeks[0].requirementIds.length>0);
});
