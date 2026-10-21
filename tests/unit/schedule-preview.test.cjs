'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {previewScheduleRegeneration,plannedOpportunityCoverage}
  =require('../../.phase3-test-dist/domain/schedule-preview.js');
const r=[{id:'a',text:'A',stage:1,stream:'Camping',tags:[],prerequisites:[],required_occurrences:3}];
describe('Phase 4E scheduler preview safety contracts (scheduler UI remains legacy)',()=>{
  it('preserves locked weeks and previews only changed unlocked requirement sequences',()=>{
    const before=[{id:'week-1',locked:true,requirementIds:['a'],activity:{id:'keep'}},
      {id:'week-2',locked:false,requirementIds:['a']},
      {id:'week-3',locked:false,requirementIds:[]}];
    const after=[structuredClone(before[0]),{...before[1],requirementIds:[]},
      {...before[2],requirementIds:['a']}];
    const result=previewScheduleRegeneration(before,after);
    assert.equal(result.changedUnlockedWeeks,2);
    assert.equal(result.lockedWeeksPreserved,1);
    assert.deepEqual(result.changes.map(x=>x.weekIndex),[1,2]);
    assert.deepEqual(before[1].requirementIds,['a'],'preview must not mutate existing schedule');
  });
  it('rejects lost, edited or modified locked weeks before any apply action',()=>{
    const before=[{locked:true,requirementIds:['a'],activity:'keep'}];
    assert.throws(()=>previewScheduleRegeneration(before,[]),/Locked week missing/);
    assert.throws(()=>previewScheduleRegeneration(before,[{locked:true,requirementIds:['a'],activity:'changed'}]),/Locked week changed/);
  });
  it('counts repeat opportunities by distinct planned weeks, never awarding Scout completion',()=>{
    const out=plannedOpportunityCoverage(r,[
      {requirementIds:['a','a']},{requirementIds:['a']}
    ]);
    assert.deepEqual(out,[{requirementId:'a',required:3,planned:2,outstanding:1}]);
    assert.equal(plannedOpportunityCoverage(r,[])[0].outstanding,3);
  });
});
