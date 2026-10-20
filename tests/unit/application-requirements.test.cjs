'use strict';
const {describe,it} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {
  parseCatalogue, filterCatalogue, statusCounts, statusLabel, catalogueCsv, catalogueJson
} = require('../../.phase3-test-dist/features/application-requirements/catalogue.js');

const source=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/application-requirements.json'),'utf8'));
const catalogue=parseCatalogue(source);
describe('Application Requirements Vue island pure data parity',()=>{
  it('preserves all source IDs, statuses and original category options',()=>{
    assert.equal(catalogue.requirements.length,118);
    assert.strictEqual(catalogue,source);
    assert.deepEqual(statusCounts(catalogue),{implemented:93,partial:7,planned:3,future:15});
    assert.equal(Object.keys(catalogue.categories).length,10);
    assert.equal(statusLabel('implemented'),'Implemented in code');
    assert.equal(statusLabel('future'),'Future idea only');
    assert.throws(()=>parseCatalogue({...source,requirements:[...source.requirements,source.requirements[0]]}),/duplicate/);
  });
  it('matches the original appReqList() search fields and filters',()=>{
    const original=(query,status,category)=>source.requirements.filter(r=>
      (status==='all'||r.status===status)&&(category==='all'||r.category===category)&&
      (!query.trim()||[r.id,r.title,r.description,...(r.implementation||[]),
      r.verification,source.categories?.[r.category]||''].join(' ').toLowerCase()
        .includes(query.trim().toLowerCase()))).map(r=>r.id);
    for(const query of ['APP-025','excel','schedule','  SCOUT ', 'nonsense-no-match','']){
      for(const status of ['all','implemented','future','partial']){
        for(const category of ['all','CORE','SCHED','FUTURE']){
          assert.deepEqual(filterCatalogue(catalogue,query,status,category).map(r=>r.id),
            original(query,status,category),query+'/'+status+'/'+category);
        }
      }
    }
  });
  it('exports the original CRLF CSV with all fields quoted and the original JSON bytes',()=>{
    const columns=['ID','Area','Title','Requirement','Implementation status','Code and documentation','Verification'];
    const rows=source.requirements.map(r=>[r.id,source.categories[r.category]||r.category,
      r.title,r.description,statusLabel(r.status),(r.implementation||[]).join('; '),r.verification]);
    const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
    const expected=[columns,...rows].map(row=>row.map(quote).join(',')).join('\r\n');
    assert.equal(catalogueCsv(catalogue),expected);
    assert.equal(catalogueJson(catalogue),JSON.stringify(source,null,2));
    assert.equal(catalogueCsv(catalogue).split('\r\n').length,119);
  });
  it('rejects structurally invalid input before the Vue island attempts takeover',()=>{
    assert.throws(()=>parseCatalogue(null),/Invalid/);
    assert.throws(()=>parseCatalogue({requirements:[],categories:{}}),/Invalid/);
    assert.throws(()=>parseCatalogue({...source,requirements:[{id:'APP-1',status:'bogus'}]}),/Invalid or duplicate/);
  });
});
