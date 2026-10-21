'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {fakeWorkbook,fakeSheetJs}=require('../fixtures/workbook.synthetic.cjs');
const {parseCubWorkbook,validateWorkbookPreview,isHighlighted,uniqueEvidencePairs}
 =require('../../.phase3-test-dist/features/workbook/workbook-parser.js');
const requirements=[
 {id:'s1-camping-i-know-about-the-buddy-system',stage:1,stream:'Camping',
  text:'I know about the buddy system',tags:[],prerequisites:[],workflow:'Plan'},
 {id:'known-lost',stage:1,stream:'Camping',
  text:'I know to stop when I get lost while camping.',tags:[],prerequisites:[],workflow:'Plan'}
];
describe('Phase 4C.4 typed Cub Pack interpretation (no real roster)',()=>{
 it('parses stage/sheet rosters, dates, colored cells and verifies source provenance',()=>{
  const original=JSON.stringify(requirements);
  const result=parseCubWorkbook(fakeWorkbook(),fakeSheetJs(),requirements);
  assert.equal(JSON.stringify(requirements),original,'a preview must not mutate requirements');
  assert.deepEqual(result.scouts,['Another Example','Example Scout']);
  assert.equal(result.rows.length,5);
  assert.equal(uniqueEvidencePairs(result.rows),5);
  const first=result.rows.find(x=>x.scout==='Example Scout'&&x.sourceRow===5);
  assert.equal(first.id,'s1-camping-i-know-about-the-buddy-system');
  assert.equal(first.date,'2023-03-15');
  assert.equal(first.highlighted,true);
  assert.equal(first.sourceSheet,'Stage 1 - Camping (in progress)');
  assert.equal(first.workflow,'Plan');
  const highlighted=result.rows.find(x=>x.scout==='Another Example'&&x.sourceRow===5);
  assert.equal(highlighted.date,'');
  assert.equal(highlighted.highlighted,true);
  const unmatched=result.unmatched;
  assert.equal(unmatched.length,2);
  assert.equal(unmatched[0].workflow,'Do');
  assert.equal(unmatched[1].workflow,'Verify');
  assert.equal(result.extraReqs.length,2);
  assert.equal(result.extraReqs[0].supplemental,true);
  assert.equal(result.extraReqs[0].source,'Stage 1 - Camping (in progress) · row 6');
  assert.equal(validateWorkbookPreview(result),result);
 });
 it('keeps blanks, white fills, missing patterns and empty date cells incomplete',()=>{
  assert.equal(isHighlighted({s:{fill:{patternType:'none',fgColor:{rgb:'FFAA3322'}}}}),false);
  assert.equal(isHighlighted({s:{fill:{patternType:'solid',fgColor:{rgb:'FFFFFFFF'}}}}),false);
  assert.equal(isHighlighted({s:{fill:{patternType:'solid',fgColor:{rgb:'FF00BB33'}}}}),true);
  assert.equal(isHighlighted({v:'21/10/2026'}),false);
 });
 it('rejects workbook with no Scout roster without recording any achievements',()=>{
  const result=parseCubWorkbook({SheetNames:['Summary'],Sheets:{Summary:{'!ref':'A1'}}},
    fakeSheetJs(),requirements);
  assert.deepEqual(result.rows,[]);
  assert.throws(()=>validateWorkbookPreview(result),/No Scout roster/);
 });
 it('collects missing workflows as deferred apply-only changes',()=>{
  const list=requirements.map(x=>({...x,workflow:undefined}));
  const parsed=parseCubWorkbook(fakeWorkbook(),fakeSheetJs(),list);
  assert.deepEqual(parsed.workflows.filter(x=>x.id==='s1-camping-i-know-about-the-buddy-system'),
   [{id:'s1-camping-i-know-about-the-buddy-system',workflow:'Plan'}]);
  assert.equal(list[0].workflow,undefined);
 });
});
