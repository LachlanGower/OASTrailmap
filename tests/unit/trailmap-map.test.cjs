'use strict';
const {describe,it}=require('node:test');
const assert=require('node:assert/strict');
const {mapStages,mapNodeTitle,hasPlannerPriority}
  =require('../../.phase3-test-dist/features/trailmap/map-model.js');
function node(id,stage,stream,overrides={}) {
 return {id,stage,stream,text:id,workflow:'Plan',tags:[],status:'ready',
   readyCount:0,missingPrerequisites:0,hasActivity:false,selected:false,...overrides};
}
describe('Phase 4C.2 Vue requirement map presentation',()=>{
 it('preserves all stages including empty columns and the original stream order',()=>{
   const snapshot={nodes:[node('B',1,'Bushcraft'),node('C',2,'Camping'),node('A',1,'Camping')],
     plannerMode:false,selectedPlannerTags:[],groupScope:true};
   const groups=mapStages(snapshot);
   assert.deepEqual(groups.map(g=>g.count),[2,1,0]);
   assert.deepEqual(groups[0].streams.map(g=>g.stream),['Camping','Bushcraft']);
   assert.deepEqual(groups[0].streams.flatMap(g=>g.nodes.map(n=>n.id)),['A','B']);
   assert.deepEqual(snapshot.nodes.map(n=>n.id),['B','C','A'],'view must not sort source state');
 });
 it('uses the same ready-count/tag overlap/lexical ordering as legacy planner',()=>{
   const snapshot={nodes:[
     node('B',1,'Camping',{text:'Zulu',tags:['camp'],readyCount:10}),
     node('A',1,'Camping',{text:'Alpha',tags:['camp','night'],readyCount:2}),
     node('C',1,'Camping',{text:'Beta',tags:['camp'],readyCount:12})
   ],plannerMode:true,selectedPlannerTags:['camp','night'],groupScope:true};
   assert.deepEqual(mapStages(snapshot)[0].streams[0].nodes.map(n=>n.id),['A','C','B']);
   assert.equal(hasPlannerPriority(snapshot.nodes[0],snapshot),true);
   assert.equal(hasPlannerPriority(snapshot.nodes[0],{...snapshot,plannerMode:false}),false);
 });
 it('keeps wording of all legacy readiness states and group-dependent blockers',()=>{
   const complete=node('done',1,'Camping',{status:'complete'});
   const blocked=node('blocked',1,'Camping',{status:'blocked',missingPrerequisites:3});
   assert.equal(mapNodeTitle(complete,false),'Complete');
   assert.equal(mapNodeTitle(blocked,false),'3 prerequisite(s) missing');
   assert.equal(mapNodeTitle(blocked,true),'Prerequisites outstanding for remaining Scouts');
   assert.equal(mapNodeTitle(node('ready',1,'Camping'),true),'Ready to work on');
 });
});
