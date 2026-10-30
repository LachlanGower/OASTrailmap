'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {treeAdminSnapshot}=require('../../.phase3-test-dist/features/tree/admin-types.js');
describe('Phase 4D.4 Tree administration presentation',()=>{
 it('keeps original tree/tag ordering and private graph hint without source mutation',()=>{
  const trees=['Camping','Bushcraft'],tags=['camp','night'];
  const snap=treeAdminSnapshot(trees,tags,'Camping','custom');
  assert.deepEqual(snap.trees,trees);
  assert.deepEqual(snap.tags,tags);
  assert.equal(snap.graphMode,'custom');
  assert.equal(snap.isTag,false);
  assert.match(snap.graphHint,/master and Scout progress stay unchanged/);
  snap.trees.push('Other');
  assert.equal(trees.length,2);
 });
 it('enforces master-only graph display for tag views',()=>{
  const snap=treeAdminSnapshot(['Camping'],['camp'],'tag::camp','custom');
  assert.equal(snap.graphMode,'master');
  assert.equal(snap.isTag,true);
  assert.equal(snap.graphHint,'Tag views show the master relationship graph.');
 });
 it('preserves shared-master warning and scope',()=>{
  const snap=treeAdminSnapshot(['Camping'],[], 'Camping','master');
  assert.match(snap.graphHint,/drive Scout progress and scheduling/);
  assert.equal(snap.isTag,false);
 });
});
