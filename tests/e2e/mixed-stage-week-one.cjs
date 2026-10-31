'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
(async()=>{const browser=await chromium.launch({headless:true});try{
 const page=await browser.newPage();
 await page.goto(ROOT,{waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof window.buildSchedule==='function'&&typeof window.scopedScoutNames==='function'&&typeof requirements!=='undefined'&&requirements.length===142,{timeout:25000});
 const result=await page.evaluate(()=>{
  const before=localStorage.getItem('oas-trailmap-v1');
  scoutRecords={};
  for(const r of requirements.filter(r=>r.stage<=2)){
    scoutRecords[getKey('Advanced Fictional Scout',r.id)]={completed:true,date:'2026-01-01',source:'synthetic'};
  }
  scoutRecords[getKey('Advanced Fictional Scout','__roster__')]={completed:false,date:'',source:'synthetic'};
  scoutRecords[getKey('Starter Fictional Scout','__roster__')]={completed:false,date:'',source:'synthetic'};
  selectedScout='__all__';selectedScoutNames=[];
  studio.schedule=[];studio.weeks=1;studio.capacity=9;studio.strategy='progress';studio.useLocations=false;
  const proposed=buildSchedule(false),stages=proposed[0].requirementIds.map(id=>byId(id).stage);
  return {stages,noWrites:before===localStorage.getItem('oas-trailmap-v1')};
 });
 assert.equal(result.noWrites,true,'Planning preview must not write Scout records');
 assert.ok(result.stages.length>0,'One-week plan must contain requirements');
 for(const stage of [1,2,3])assert.ok(result.stages.filter(n=>n===stage).length<=4,'Stage '+stage+' exceeded default cap');
 assert.ok(result.stages.some(n=>n>=2),'Stage 2/3 ready Scouts need early opportunities');
 await page.close();
 console.log('Mixed-ability first-week stage eligibility and per-stage cap passed',result.stages);
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
