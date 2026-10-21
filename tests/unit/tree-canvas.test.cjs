'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {treeNote,actionFor,canMoveWithinDepth}
  =require('../../.phase3-test-dist/features/tree/tree-view-model.js');
const snapshot={isTag:false,name:'Camping',count:3,lanes:[
 {depth:0,cards:[{id:'A'},{id:'B'}]},
 {depth:1,cards:[{id:'C'}]}
]};
describe('Phase 4D.2 Vue tree rendering interaction rules',()=>{
 it('preserves stage/depth grouping and same-lane reordering protection',()=>{
  assert.equal(canMoveWithinDepth(snapshot,'A','B'),true);
  assert.equal(canMoveWithinDepth(snapshot,'A','C'),false);
  assert.equal(canMoveWithinDepth(snapshot,'A','missing'),false);
  assert.equal(canMoveWithinDepth(snapshot,'A','A'),false);
 });
 it('keeps mandatory add/remove arrows and descriptive button labels',()=>{
  assert.deepEqual(actionFor(false,false).map(a=>[a.action,a.symbol,a.unlink]),
   [['parent','↑',false],['child','↓',false]]);
  assert.deepEqual(actionFor(true,true).map(a=>[a.action,a.symbol,a.unlink]),
   [['remove-parent','×',true],['remove-child','×',true]]);
  assert.equal(actionFor(true,false)[0].label,'Remove as parent of selected skill');
 });
 it('presents tag and named-tree scope without implying stage prerequisites',()=>{
  assert.equal(treeNote(snapshot),'Skill tree: Camping · 3 skills.');
  assert.equal(treeNote({...snapshot,name:'camp',isTag:true}),
   'Tag view: camp · 3 matching skills across all trees.');
 });
});
