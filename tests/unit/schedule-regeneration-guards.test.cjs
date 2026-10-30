'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {inspectRegeneration,assertUnchangedSincePreview}=require('../../.phase3-test-dist/domain/schedule-regeneration-guards.js');
describe('4E.3b scheduler safety invariants',()=>{
 const locked={id:'w1',locked:true,requirementIds:['a'],activity:{filename:'do-not-erase'}};
 const open={id:'w2',locked:false,requirementIds:['a']};
 it('counts changed unlocked weeks and retains locked metadata',()=>{
  assert.deepEqual(inspectRegeneration([locked,open],[structuredClone(locked),{...open,requirementIds:['b']}]),{changed:1,locked:1});
 });
 it('rejects lost or edited locked weeks',()=>{
  assert.throws(()=>inspectRegeneration([locked,open],[{...locked,activity:null},open]),/Locked week/);
  assert.throws(()=>inspectRegeneration([locked,open],[open]),/Locked week/);
 });
 it('enforces 1–60 week bounds',()=>{
  assert.throws(()=>inspectRegeneration([],[]),/between 1 and 60/);
  assert.throws(()=>inspectRegeneration([],Array.from({length:61},()=>({requirementIds:[]}))),/between 1 and 60/);
 });
 it('rejects stale preview without mutating input',()=>{
  const original=[locked,open],fingerprint=JSON.stringify(original);
  assert.doesNotThrow(()=>assertUnchangedSincePreview(fingerprint,original));
  assert.throws(()=>assertUnchangedSincePreview(fingerprint,[locked,{...open,requirementIds:['b']}]),/changed after preview/);
  assert.equal(JSON.stringify(original),fingerprint);
 });
});
