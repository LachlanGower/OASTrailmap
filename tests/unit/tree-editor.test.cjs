'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {safeOccurrenceCount,editorModeText} =
 require('../../.phase3-test-dist/features/tree/tree-editor-model.js');
describe('Phase 4D.3 read-only Vue editor and legacy graph contract',()=>{
 it('clamps manual planning opportunities to exact legacy range 1–40',()=>{
  assert.equal(safeOccurrenceCount(0),1);
  assert.equal(safeOccurrenceCount(-100),1);
  assert.equal(safeOccurrenceCount('3'),3);
  assert.equal(safeOccurrenceCount(45),40);
  assert.equal(safeOccurrenceCount('invalid'),1);
 });
 it('makes master/custom scope unambiguous to leaders',()=>{
  assert.equal(editorModeText(false),'Prerequisite links here change the shared master.');
  assert.equal(editorModeText(true),'Prerequisite links here are private to this tree.');
 });
});
