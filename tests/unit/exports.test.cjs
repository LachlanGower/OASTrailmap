'use strict';
const { describe, it } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {buildLegacyExport} = require('../../.phase3-test-dist/services/legacy-exports.js');
const {loadPublicRequirements} = require('../../.phase3-test-dist/services/public-requirements.js');
const {validateImportPayload} = require('../../.phase3-test-dist/services/import-validation.js');

const A={id:'A',text:'Sample OAS skill',stage:1,stream:'Camping',tags:['camp'],prerequisites:[]};
const act={id:'activity-1',title:'Fictional event',covers:['A'],tags:['camp'],extraCustom:'preserved'};
const state={
  requirements:[A],scoutRecords:{'Example Scout::A':{completed:true,source:'workbook',date:'2026-01-01',custom:'original'}},
  activities:[act],
  studio:{
    trees:['Camping'],tags:['camp'],order:{Camping:['A']},treeGraphs:{Camping:{mode:'master'}},
    strategy:'progress',capacity:4,schedule:[{id:'week-1',requirementIds:['A'],locked:true}],
    history:Array.from({length:14},(_,i)=>({id:i,title:'Local snapshot '+i}))
  },
  scope:['Example Scout']
};
const timestamp='2026-10-20T00:00:00.000Z';

describe('legacy Data & State exports',()=>{
  it('builds all 6 original export variants, with expected version markers',()=>{
    const expected={
      full:['oas-trailmap-full-state',2],
      progress:['oas-trailmap-progress',1],
      activities:['oas-trailmap-activities',2],
      schedule:['oas-trailmap-schedule',1],
      trees:['oas-trailmap-trees',1],
      requirements:[undefined,3]
    };
    for(const [kind,[format,version]] of Object.entries(expected)){
      const result=buildLegacyExport(kind,state,timestamp);
      assert.equal(result.format,format);
      assert.equal(result.schema_version,version);
      assert.strictEqual(validateImportPayload(kind,result,state.requirements),result);
    }
  });
  it('keeps provenance, custom metadata and source IDs in exported JSON',()=>{
    const output=buildLegacyExport('full',state,timestamp);
    const round=JSON.parse(JSON.stringify(output));
    assert.equal(round.scoutRecords['Example Scout::A'].source,'workbook');
    assert.equal(round.scoutRecords['Example Scout::A'].custom,'original');
    assert.equal(round.requirements[0].id,'A');
    assert.equal(round.activities[0].extraCustom,'preserved');
    assert.equal(round.studio.history.length,10); // Original full-backup truncation.
    assert.equal(state.studio.history.length,14); // No source mutation.
    round.scoutRecords['Example Scout::A'].completed=false;
    assert.equal(state.scoutRecords['Example Scout::A'].completed,true);
  });
  it('exports the legacy schedule reference with the correct curriculum scope',()=>{
    const regular=buildLegacyExport('schedule',state,timestamp);
    assert.deepEqual(regular.scope,['Example Scout']);
    assert.strictEqual(regular.weeks,state.studio.schedule);
    const curriculum=buildLegacyExport('schedule',{
      ...state,studio:{...state.studio,strategy:'curriculum'}
    },timestamp);
    assert.equal(curriculum.scope,'curriculum');
    assert.equal(curriculum.weeks[0].locked,true);
  });
  it('keeps requirements schema v3 names for custom graphs and tags',()=>{
    const out=buildLegacyExport('requirements',state,timestamp);
    assert.deepEqual(out.tree_registry,['Camping']);
    assert.deepEqual(out.tag_library,['camp']);
    assert.equal(out.tree_graphs.Camping.mode,'master');
    assert.strictEqual(out.requirements[0].text,A.text);
  });
});

describe('canonical public requirements loading',()=>{
  it('loads the actual OAS JSON source using an injected fetcher',async()=>{
    const original=JSON.parse(fs.readFileSync(path.resolve(__dirname,'../../data/requirements.json'),'utf8'));
    let called='';
    const loaded=await loadPublicRequirements(async url=>{
      called=url;
      return {ok:true,status:200,async json(){return original;}};
    });
    assert.equal(called,'data/requirements.json');
    assert.strictEqual(loaded.requirements,original.requirements);
    assert.equal(loaded.requirements.length,142);
  });
  it('rejects failed downloads and malformed JSON datasets',async()=>{
    await assert.rejects(()=>loadPublicRequirements(async()=>({
      ok:false,status:404,async json(){return {};}
    })),/HTTP 404/);
    await assert.rejects(()=>loadPublicRequirements(async()=>({
      ok:true,status:200,async json(){return {requirements:[]};}
    })),/No requirements/);
  });
});
