'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {recoveryImportPreview}=require('../../.phase3-test-dist/services/recovery-preview.js');
const requirements=[{id:'A',text:'Sample A',stage:1,stream:'Camping',tags:[],prerequisites:[]},
  {id:'B',text:'Sample B',stage:1,stream:'Camping',tags:[],prerequisites:[]}];
describe('Phase 4G non-destructive import previews (real recovery remains legacy)',()=>{
  it('matches added/modified/removed selected Scout progress ID counts',()=>{
    const current={scoutRecords:{
      'Example Scout::A':{completed:false,source:'manual'},
      'Example Scout::B':{completed:true,source:'workbook'}
    }};
    const next={scoutRecords:{
      'Example Scout::A':{completed:true,source:'manual'},
      'Another Example::B':{completed:false,source:'manual'}
    }};
    const original=JSON.stringify(current);
    const result=recoveryImportPreview('progress',current,next,requirements);
    assert.deepEqual([result.added,result.modified,result.removed],[1,1,1]);
    assert.equal(JSON.stringify(current),original,'Dry-run must never modify existing Scout data');
  });
  it('warns about complete backup replacement without implying no Scout data changes',()=>{
    const full={format:'oas-trailmap-full-state',schema_version:2,
      requirements,scoutRecords:{},activities:[]};
    const out=recoveryImportPreview('full',{},full,requirements);
    assert.equal(out.added,0);
    assert.match(out.description,/Complete local application state will be replaced/);
  });
  it('rejects malformed progress and allows legacy top-level activity arrays',()=>{
    assert.throws(()=>recoveryImportPreview('progress',{scoutRecords:{}},
      {scoutRecords:{'bad-key':{completed:true}}},requirements),/Invalid progress record/);
    const old={activities:[{id:'a',covers:['A']}]};
    const next=[{id:'a',covers:['B']},{id:'b',covers:['A']}];
    const out=recoveryImportPreview('activities',old,next,requirements);
    assert.deepEqual([out.added,out.modified,out.removed],[1,1,0]);
  });
});
