const {it}=require('node:test');
const assert=require('node:assert/strict');
const {coverageRows,coverageCsv}=require('../../.phase3-test-dist/domain/coverage-tracker.js');
const {planThemeWeek}=require('../../.phase3-test-dist/domain/theme-planning.js');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {planningLocations,locationOptions}=require('../../.phase3-test-dist/domain/planning-locations.js');
const reqs=[
 {id:'a',text:'Foundations',stream:'Camping',stage:1,tags:['Camp'],prerequisites:[],required_occurrences:2},
 {id:'b',text:'Advanced camp',stream:'Camping',stage:2,tags:['Camp'],prerequisites:['a']},
 {id:'c',text:'Navigation',stream:'Bushwalking',stage:1,tags:['Walk'],prerequisites:[]},
 {id:'d',text:'First aid',stream:'Bushcraft',stage:1,tags:['Health'],prerequisites:[]}
];
it('tracker separates partial evidence, linked activities, distinct plans and selected-Scout completion',()=>{
 const weeks=[{requirementIds:['a','a','b']},{requirementIds:['a']}],activities=[{id:'aid',title:'First aid',covers:['d']}];
 const records={'Scout A::a':{completed:false,sessionEvidence:['night-1']},'Scout A::b':{completed:true},'Scout B::b':{completed:false}};
 const rows=coverageRows(reqs,activities,weeks,records,['Scout A','Scout B']);
 assert.equal(rows[0].planned,2);assert.equal(rows[0].needed,2);assert.equal(rows[0].evidence,1);assert.equal(rows[0].status,'planned');assert.deepEqual(rows[0].weeks,[1,2]);
 assert.equal(rows[1].scoutsDone,1);assert.equal(rows[1].status,'planned');assert.equal(rows[2].status,'unaddressed');assert.equal(rows[3].status,'partial');
 assert.equal(coverageRows(reqs,activities,weeks,records,['Scout A'])[1].status,'complete');
 assert.equal(coverageRows(reqs,[],[],{},[])[0].status,'unaddressed');
 const csv=coverageCsv(rows);assert.ok(csv.startsWith('"Requirement ID","Requirement"'));assert.ok(csv.includes('"a","Foundations"'));assert.equal(csv.split('\r\n').length,5);
});
it('theme planning replaces only the proposed week and invalidates attachments without changing source/evidence',()=>{
 const records={'Scout A::a':{completed:true,source:'workbook'},'Scout A::c':{completed:true},'Scout A::d':{completed:true}};
 const studio={weeks:2,capacity:2,strategy:'progress',schedule:[{id:'week-1',requirementIds:['c'],locked:true,activity:{filename:'old.md'},activityIds:['old'],confirmedSession:true,reviewed:true,capacity:2,stageLimit:1,custom:'retained'},{id:'week-2',requirementIds:['d'],locked:true}]};
 const before=JSON.stringify({studio,records,reqs});
 const result=planThemeWeek(reqs,records,studio,['Scout A'],0,'Camp');
 assert.deepEqual(result.requirementIds,['b']);assert.deepEqual(result.scoutAssignments.b,['Scout A']);assert.equal(result.theme,'Camp');assert.equal(result.locked,true);assert.equal(result.activity,null);assert.equal(result.activityIds,undefined);assert.equal(result.confirmedSession,false);assert.equal(result.reviewed,false);assert.equal(result.custom,'retained');assert.equal(JSON.stringify({studio,records,reqs}),before);
});
it('theme clearing is an explicit empty proposal; unmatched themes fail without changing data',()=>{
 const studio={capacity:2,schedule:[{requirementIds:['a'],activity:{filename:'old'}}]};
 const empty=planThemeWeek(reqs,{},studio,[],0,'');assert.deepEqual(empty.requirementIds,[]);assert.equal(empty.locked,true);assert.equal(empty.activity,null);
 assert.throws(()=>planThemeWeek(reqs,{},studio,[],0,'Unknown'),/No eligible/);assert.deepEqual(studio.schedule[0].requirementIds,['a']);
});
it('random theme selection respects theme, total capacity, stage limits and locations',()=>{
 const list=[...reqs,{...reqs[0],id:'e',locations:{preferred:'Hall'}},{...reqs[0],id:'f',locations:{preferred:'Park'}}];
 const studio={capacity:3,useLocations:true,allowedLocations:['Hall'],schedule:[{requirementIds:[],stageLimit:1}]};
 const result=planThemeWeek(list,{},studio,[],0,'Camp','random',()=>0);assert.deepEqual(result.requirementIds,['e']);assert.equal(result.location,'Hall');
});
it('generation defaults to ten weeks and prioritises multiple selected themes in rotation',()=>{
 const requirements=[{...reqs[2],tags:['Unselected']},{...reqs[0],theme_tags:['Camp'],prerequisites:[]},{...reqs[3],theme_tags:['Health'],prerequisites:[]}];
 const weeks=generateSchedule(requirements,{}, {requirementsPerStage:1,preferredThemes:['Camp','Health']},[],false);
 assert.equal(weeks.length,10);assert.deepEqual(weeks[0].requirementIds,['a']);assert.equal(weeks[0].theme,'Camp');assert.deepEqual(weeks[1].requirementIds,['d']);assert.equal(weeks[1].theme,'Health');assert.ok(weeks.every(w=>!w.requirementIds.includes('c')));
});
it('theme priority does not silently add unrelated prerequisite skills, and keeps locked weeks unchanged',()=>{
 const requirements=[{...reqs[2],tags:['Other']},{...reqs[0],tags:['Foundation']},{...reqs[1],tags:['Camp']}];
 const locked={requirementIds:['c'],locked:true,location:'Hall',activity:{filename:'keep.md'}};
 const state={weeks:2,capacity:2,preferredThemes:['Camp'],schedule:[locked]};
 const result=generateSchedule(requirements,{},state,[],true);
 assert.deepEqual(result[0],locked);assert.deepEqual(result[1].requirementIds,['b']);assert.equal(result[1].stageShortfalls['1'],4);assert.equal(result[1].theme,'Camp');assert.equal(state.schedule.length,1);
});
it('Homework is inferred for log books without rewriting curriculum metadata or admitting unrelated skills',()=>{
 const log={...reqs[0],text:'Update my log book',locations:{preferred:'Scout Hall',alternatives:['Camp']}};
 const before=JSON.stringify(log);assert.ok(locationOptions(log).includes('Homework'));assert.equal(planningLocations(log).preferred,'Scout Hall');assert.equal(JSON.stringify(log),before);
 const studio={weeks:1,capacity:4,useLocations:true,allowedLocations:['Homework'],preferredThemes:['Camp'],schedule:[{requirementIds:[]}]};
 const schedule=generateSchedule([reqs[2],log],{},studio,[],false);assert.deepEqual(schedule[0].requirementIds,['a']);assert.equal(schedule[0].location,'Homework');
 const themed=planThemeWeek([reqs[2],log],{},studio,[],0,'Camp');assert.deepEqual(themed.requirementIds,['a']);assert.equal(themed.location,'Homework');
 assert.ok(!locationOptions(reqs[2]).includes('Homework'));
});
