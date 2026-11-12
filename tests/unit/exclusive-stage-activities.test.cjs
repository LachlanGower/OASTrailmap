const {it}=require('node:test');
const assert=require('node:assert/strict');
const {projectSchedule}=require('../../.phase3-test-dist/domain/scout-projection.js');
const {generateSchedule}=require('../../.phase3-test-dist/domain/schedule-engine.js');
const {assignStageActivity}=require('../../.phase3-test-dist/domain/stage-activity.js');
const {validateScheduleWeeks}=require('../../.phase3-test-dist/domain/scheduling.js');
const {planThemeWeek}=require('../../.phase3-test-dist/domain/theme-planning.js');
const req=(id,stage,pre=[])=>({id,text:id,stage,stream:'Camping',tags:['Camp'],theme_tags:['Camp'],prerequisites:pre,locations:{preferred:'Hall'}});
const r=[req('one',1),req('two',2,['one']),req('three',3,['two']),req('extra-one',1)];
const bank=[{id:'first',title:'Stage one activity',covers:['one','extra-one','three'],location:'Hall'},{id:'second',title:'Stage two activity',covers:['two'],location:'Hall'},{id:'third',covers:['three'],location:'Hall'}];
function exclusive(part){const all=Object.values(part.stageScouts).flat();assert.equal(new Set(all).size,all.length);for(const [id,names] of Object.entries(part.requirementScouts)){const stage=r.find(x=>x.id===id)?.stage;for(const name of names)assert.equal(part.scoutStages[name],stage);}}
it('a Scout progresses through stage activities in separate weeks, never multiple stages in one week',()=>{
 const weeks=generateSchedule(r,{}, {weeks:3,requirementsPerStage:4,preferredThemes:['Camp']},['Scout'],false);
 const parts=projectSchedule(r,{},weeks,['Scout']);parts.forEach(exclusive);
 assert.deepEqual(parts.map(p=>p.scoutStages.Scout),[1,2,3]);assert.ok(weeks[0].requirementIds.includes('two'));assert.ok(weeks[0].requirementIds.includes('three'));assert.deepEqual(weeks[0].scoutAssignments.two,[]);assert.deepEqual(weeks[0].scoutAssignments.three,[]);
});
it('advanced and beginner groups run together but an eligible Scout joins only the highest primary stage',()=>{
 const records={'Advanced::one':{completed:true},'Advanced::extra-one':{completed:true},'Advanced::two':{completed:true}},weeks=[{requirementIds:['one','two','three','extra-one']}];
 const part=projectSchedule(r,records,weeks,['Advanced','Beginner'])[0];exclusive(part);
 assert.deepEqual(part.stageScouts['1'],['Beginner']);assert.deepEqual(part.stageScouts['3'],['Advanced']);assert.deepEqual(part.requirementScouts.two,[]);assert.deepEqual(part.requirementScouts['extra-one'],['Beginner']);
});
it('one activity can cover multiple same-stage statements, but its other-stage coverage earns nothing',()=>{
 const week={requirementIds:['one','extra-one','three'],stageActivityIds:{'1':'first'}},part=projectSchedule(r,{},[week],['Scout'],{activities:bank})[0];exclusive(part);
 assert.deepEqual(part.requirementScouts.one,['Scout']);assert.deepEqual(part.requirementScouts['extra-one'],['Scout']);assert.deepEqual(part.requirementScouts.three,[]);
});
it('uncovered planned skills cannot unlock a later stage',()=>{
 const narrow={id:'narrow',covers:['extra-one'],location:'Hall'};
 const weeks=[{requirementIds:['one','extra-one'],stageActivityIds:{'1':'narrow'}},{requirementIds:['two'],stageActivityIds:{'2':'second'}}];
 const parts=projectSchedule(r,{},weeks,['Scout'],{activities:[...bank,narrow]});parts.forEach(exclusive);
 assert.deepEqual(parts[0].requirementScouts.one,[]);assert.deepEqual(parts[0].requirementScouts['extra-one'],['Scout']);assert.deepEqual(parts[1].requirementScouts.two,[]);assert.ok(parts[0].warnings.some(s=>s.includes('Not covered')));
});
it('missing or location-incompatible bank activities give no projected credit',()=>{
 for(const activity of [undefined,{id:'missing',covers:['one'],location:'Lake'}]){
  const weeks=[{requirementIds:['one'],location:'Hall',stageActivityIds:{'1':'missing'}},{requirementIds:['two']}];
  const parts=projectSchedule(r,{},weeks,['Scout'],{activities:activity?[activity]:[]});assert.deepEqual(parts[0].requirementScouts.one,[]);assert.deepEqual(parts[1].requirementScouts.two,[]);assert.ok(parts[0].warnings.length);
 }
});
it('same-stage prerequisites can progress inside a single stage activity',()=>{
 const same=[req('start',2),req('finish',2,['start'])],activity={id:'same',covers:['start','finish'],location:'Hall'};
 const part=projectSchedule(same,{},[{requirementIds:['finish','start'],stageActivityIds:{'2':'same'}}],['Scout'],{activities:[activity]})[0];
 assert.deepEqual(part.requirementScouts.start,['Scout']);assert.deepEqual(part.requirementScouts.finish,['Scout']);assert.deepEqual(part.stageScouts['2'],['Scout']);
});
it('stage activity selection stores one reference, retains other stage metadata and refuses locked or incompatible changes',()=>{
 const week={requirementIds:['one','extra-one','two'],location:'Hall',stageActivityIds:{'2':'second'},custom:{retain:true}};
 const result=assignStageActivity(week,1,'first',bank,r);assert.deepEqual(result.stageActivityIds,{'1':'first','2':'second'});assert.deepEqual(result.custom,week.custom);assert.deepEqual(week.stageActivityIds,{'2':'second'});
 assert.throws(()=>assignStageActivity({...week,locked:true},1,'first',bank,r),/Unlock/);assert.throws(()=>assignStageActivity(week,1,'absent',bank,r),/no longer/);
 assert.throws(()=>assignStageActivity(week,1,'second',bank,r),/no Stage 1/);
 assert.throws(()=>assignStageActivity(week,1,'lake',[{id:'lake',covers:['one'],location:'Lake'}],r),/location/);
 assert.deepEqual(assignStageActivity(result,1,null,bank,r).stageActivityIds,{'2':'second'});
});
it('saved assignments cannot introduce duplicate membership after a scope or progress change',()=>{
 const week={requirementIds:['one','two','three'],locked:true,stageActivityIds:{'1':'first','2':'second','3':'third'},scoutAssignments:{one:['Scout'],three:['Scout']}};
 const before=JSON.stringify(week);const records={'Scout::one':{completed:true},'Scout::extra-one':{completed:true},'Scout::two':{completed:true}};
 const part=projectSchedule(r,records,[week],['Scout'],{activities:bank})[0];exclusive(part);assert.deepEqual(part.stageScouts['3'],['Scout']);assert.equal(JSON.stringify(week),before);
});
it('generation replays locked stage activities using their real coverage, without changing their payload',()=>{
 const locked={id:'locked',locked:true,requirementIds:['one'],location:'Hall',stageActivityIds:{'1':'uncovered'},custom:true};
 const activity={id:'uncovered',covers:['extra-one'],location:'Hall'},studio={weeks:2,requirementsPerStage:1,preferredThemes:['Camp'],schedule:[locked]};
 const result=generateSchedule(r,{},studio,['Scout'],true,[activity]);assert.deepEqual(result[0],locked);assert.deepEqual(result[1].scoutAssignments.two,[]);
});
it('theme replacement clears stale stage activity links and leaves evidence untouched',()=>{
 const records={'Scout::__roster__':{completed:false}},before=JSON.stringify(records),studio={schedule:[{requirementIds:['one'],stageActivityIds:{'1':'first'}}]};
 const result=planThemeWeek(r,records,studio,['Scout'],0,'Camp');assert.equal(result.stageActivityIds,undefined);assert.equal(JSON.stringify(records),before);
});
it('stage links round-trip as schedule metadata and reject arrays or multiple IDs for one stage',()=>{
 const week={requirementIds:['one'],stageActivityIds:{'1':'first'}};assert.doesNotThrow(()=>validateScheduleWeeks(JSON.parse(JSON.stringify([week])),r));
 for(const invalid of [{stageActivityIds:{'1':['first','second']}},{stageActivityIds:[]},{stageActivityIds:{'4':'first'}}])assert.throws(()=>validateScheduleWeeks([{requirementIds:['one'],...invalid}],r),/one activity ID per stage/);
});
it('already-recorded activity evidence reserves the Scouts stage for that week',()=>{
 const records={'Scout::one':{completed:true,sessionEvidence:['week-1']},'Scout::two':{completed:true}};
 const part=projectSchedule(r,records,[{id:'week-1',requirementIds:['extra-one','three']}],['Scout'])[0];
 exclusive(part);assert.deepEqual(part.stageScouts['1'],['Scout']);assert.deepEqual(part.requirementScouts.three,[]);
});
it('conflicting historical stage evidence stays intact and blocks additional projected activity that week',()=>{
 const records={'Scout::one':{completed:true,sessionEvidence:['week-1']},'Scout::two':{completed:true,sessionEvidence:['week-1']}};
 const before=JSON.stringify(records),part=projectSchedule(r,records,[{id:'week-1',requirementIds:['three']}],['Scout'])[0];
 assert.deepEqual(part.requirementScouts.three,[]);assert.ok(part.warnings.some(s=>s.includes('multiple stages')));assert.equal(JSON.stringify(records),before);
});
