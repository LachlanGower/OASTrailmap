'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {suggestActivityCoverage,activitiesForRequirement,prepareActivityChange,activityLabel}
  =require('../../.phase3-test-dist/domain/activity-planning.js');
const req=[
  {id:'A',text:'A',stage:1,stream:'Camping',tags:['camp'],prerequisites:[],
    locations:{preferred:'Campsite',alternatives:['Local outdoor area']}},
  {id:'B',text:'B',stage:1,stream:'Bushcraft',tags:['camp'],prerequisites:[]},
  {id:'C',text:'C',stage:2,stream:'Bushwalking',tags:['hike'],prerequisites:[]}
];
const act={id:'activity-1',title:'Fictional camping night',tags:['camp'],covers:['A']};
describe('Phase 4F activity coverage contracts (legacy editor remains active)',()=>{
  it('suggests tag + compatible location matches, retaining existing selections',()=>{
    assert.deepEqual(suggestActivityCoverage(req,['camp'],'Campsite',['C']),['C','A','B']);
    assert.deepEqual(suggestActivityCoverage(req,['camp'],'Local outdoor area',['A']),['A','B']);
    assert.deepEqual(suggestActivityCoverage(req,['hike'],'Scout Hall - indoor',[]),['C']);
  });
  it('uses the original activity display label and read-only reverse coverage',()=>{
    assert.equal(activityLabel(act),'Fictional camping night');
    assert.deepEqual(activitiesForRequirement([act],'A'),[act]);
    assert.deepEqual(activitiesForRequirement([act],'C'),[]);
  });
  it('prepares immutable updates with confirmed, known skill identifiers only',()=>{
    const current=[act];
    const next=prepareActivityChange(current,{...act,covers:['B','B','A'],extra:'preserve'},req);
    assert.deepEqual(next[0].covers,['B','A']);
    assert.equal(next[0].extra,'preserve');
    assert.deepEqual(current[0].covers,['A']);
    assert.throws(()=>prepareActivityChange(current,{...act,covers:['UNKNOWN']},req),/unknown requirement/);
    assert.equal(prepareActivityChange(current,{id:'activity-2',covers:[]},req).length,2);
  });
});
