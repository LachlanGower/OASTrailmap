'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const page=await browser.newPage({viewport:{width:1365,height:900},acceptDownloads:true});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(ROOT,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>typeof window.dataBundle==='function'&&typeof window.dataCsvParse==='function'&&typeof requirements!=='undefined'&&requirements.length===142&&document.documentElement.dataset.oasNavRenderer==='vue',{timeout:25000});
  const result=await page.evaluate(()=>{
    const original=localStorage.getItem('oas-trailmap-v1');
    const formats=['requirements','progress','activities','schedule'];
    const roundTrips=formats.map(type=>{
      const data=dataBundle(type),csv=dataCsvRecords(type,data),restored=dataParse(csv,type+'.csv',type);
      return {type,same:JSON.stringify(restored)===JSON.stringify(data),rows:csv.split('\r\n').length};
    });
    return {roundTrips,noWrites:localStorage.getItem('oas-trailmap-v1')===original,stageOneWithoutDependencies:requirements.filter(r=>r.stage===1&&(r.prerequisites||[]).length).length,ids:requirements.map(r=>r.id)};
  });
  assert.equal(result.noWrites,true,'Export conversion must never mutate Scout state');
  assert.equal(result.stageOneWithoutDependencies,0,'Stage 1 must not have hard prerequisites');
  assert.equal(result.ids.length,142);
  assert.equal(new Set(result.ids).size,142);
  for(const row of result.roundTrips)assert.equal(row.same,true,row.type+' CSV roundtrip should preserve all fields');
  await page.locator('#dataManagerTab').click();
  assert.equal(await page.locator('#dataExportFormat option').count(),3);
  await page.locator('#requirementsTrackerTab').click();
  const downloadPromise=page.waitForEvent('download');
  await page.locator('#exportRequirementsTrello').click();
  const dl=await downloadPromise;
  assert.equal(dl.suggestedFilename(),'oas-requirements-trello.json');
  const reqId=await page.evaluate(()=>requirements[0].id);
  const beforeImport=await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1'));
  page.on('dialog',async dialog=>dialog.accept());
  const trello={cards:[{name:'Fictional planning card',desc:'OAS-ID: '+reqId+'\\nNotes: Test planning annotation only',idList:'list-open',closed:false}],lists:[{id:'list-open',name:'Planning'}]};
  await page.locator('#requirementsTrelloFile').setInputFiles({name:'fictional-trello-board.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(trello))});
  await page.waitForFunction(id=>JSON.parse(localStorage.getItem('oas-trello-tracker-v1')||'{}')[id]?.note==='Test planning annotation only',reqId,{timeout:10000});
  assert.equal(await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1')),beforeImport,'Trello planning import must not write Scout completion records');
  assert.deepEqual(errors,[]);
  await page.close();
  console.log('Lossless JSON/CSV datasets, Trello export and Stage 1 policy passed');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
