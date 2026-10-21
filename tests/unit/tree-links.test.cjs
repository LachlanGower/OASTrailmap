'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {mapperLinks,validateProposedMandatoryLinks,prerequisiteDependents}
  =require('../../.phase3-test-dist/domain/tree-links.js');
const base=[
  {id:'A',stage:1,stream:'Camping',text:'A',tags:[],prerequisites:[],suggested_links:[{id:'C'}]},
  {id:'B',stage:1,stream:'Camping',text:'B',tags:[],prerequisites:['A'],suggested_links:[]},
  {id:'C',stage:2,stream:'Bushcraft',text:'C',tags:[],prerequisites:['B'],suggested_links:[]}
];
const custom={Camping:{mode:'custom',nodes:{
  B:{prerequisites:[],suggested_links:[]},
  C:{prerequisites:['A'],suggested_links:[{id:'B',reason:'advisory'}]}
}}};
describe('Phase 4D master/custom graph contract (UI not yet replaced)',()=>{
  it('keeps master prerequisites unchanged when editing custom tree links',()=>{
    assert.deepEqual(mapperLinks(base[1],'Camping',custom).prerequisites,[]);
    assert.deepEqual(mapperLinks(base[1],'Other',custom).prerequisites,['A']);
    assert.deepEqual(mapperLinks(base[2],'tag::Camping',custom).prerequisites,['B']);
    assert.deepEqual(base[1].prerequisites,['A']);
  });
  it('rejects mandatory cycles, unknown links, and self edges without touching source',()=>{
    assert.throws(()=>validateProposedMandatoryLinks(base,'A',['C'],'Unknown',{}),/Circular/);
    assert.throws(()=>validateProposedMandatoryLinks(base,'B',['B'],'Unknown',{}),/Self/);
    assert.throws(()=>validateProposedMandatoryLinks(base,'B',['missing'],'Unknown',{}),/Missing/);
    assert.doesNotThrow(()=>validateProposedMandatoryLinks(base,'B',[],'Camping',custom));
    assert.deepEqual(base[0].prerequisites,[]);
  });
  it('treats suggested links as advisory and counts layer-specific dependents',()=>{
    assert.deepEqual(prerequisiteDependents(base,'A','Other',{}),['B','C']);
    assert.deepEqual(prerequisiteDependents(base,'A','Camping',custom),['C']);
    assert.doesNotThrow(()=>validateProposedMandatoryLinks(base,'A',[],'Camping',custom));
    assert.deepEqual(mapperLinks(base[2],'Camping',custom).suggested_links,[{id:'B',reason:'advisory'}]);
  });
});
