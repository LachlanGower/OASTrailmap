/* Phase 4C.3: Vue-vs-legacy Scout scope and evidence edits.
 * All names and metadata are synthetic. Do not upload real Scout records.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const baseFixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4c3');
fs.mkdirSync(OUT,{recursive:true});
const reqId='s1-camping-i-know-about-the-buddy-system';
const storage=structuredClone(baseFixture.storage);
storage['oas-trailmap-v1'].scoutRecords['Another Example::__roster__']={
  completed:false,date:'',source:'workbook-roster',customNote:'keep this metadata'
};
storage['oas-trailmap-v1'].scoutRecords['Another Example::'+reqId]={
  completed:false,date:'',source:'workbook',sourceSheet:'Stage 1 Camping',
  sourceRow:23,highlighted:false,extraField:'preserve this'
};

async function inspect(browser,mode,viewport){
 const page=await browser.newPage({viewport,acceptDownloads:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',route=>
   route.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);
 if(mode==='legacy')url.searchParams.set('scoutRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(x=>{
   for(const [key,value] of Object.entries(x))localStorage.setItem(key,JSON.stringify(value));
 },storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
 if(mode==='vue')await page.waitForFunction(
   ()=>document.documentElement.dataset.oasScoutRenderer==='vue',{timeout:20000});
 else assert.notEqual(await page.locator('html').getAttribute('data-oas-scout-renderer'),'vue');
 const settle=()=>page.waitForTimeout(100);
 async function snapshot(){
  return page.evaluate(()=>{
   const key='oas-trailmap-v1';
   const x=JSON.parse(localStorage.getItem(key));
   return {
    selected:document.querySelector('#scoutSelect').value,
    names:[...document.querySelector('#scoutSelect').options].map(x=>[x.value,x.textContent]),
    subset:[...document.querySelectorAll('#multiScoutOptions input')].map(x=>[x.value,x.checked]),
    subsetVisible:!document.querySelector('#multiScoutPanel').hidden,
    missingDisabled:document.querySelector('#missingOnly').disabled,
    missingChecked:document.querySelector('#missingOnly').checked,
    scopeNote:document.querySelector('#scopeNote').textContent,
    progress:document.querySelector('#completedCount').textContent,
    selectedNode:document.querySelector('#mapCanvas .requirement-node.selected')?.dataset.id||null,
    groupChecks:[...document.querySelectorAll('[data-complete-scout]')].map(x=>[x.dataset.completeScout,x.checked]),
    singleCheck:document.querySelector('#detailComplete')?.checked??null,
    completionDate:document.querySelector('#completionDate')?.value??null,
    stored:{first:x.scoutRecords['Example Scout::s1-camping-i-know-about-the-buddy-system'],
      second:x.scoutRecords['Another Example::s1-camping-i-know-about-the-buddy-system'],
      roster:x.scoutRecords['Another Example::__roster__']}
   };
  });
 }
 const output={};
 output.initial=await snapshot();
 const noWriteBefore=await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1'));
 await page.locator('#scoutSelect').selectOption('Example Scout');
 await settle();
 output.individual=await snapshot();
 assert.equal(output.individual.selected,'Example Scout');
 assert.equal(output.individual.missingDisabled,false);
 await page.locator('#mapCanvas [data-id="'+reqId+'"]').click();
 await page.waitForSelector('#detailComplete');
 output.selected=await snapshot();
 assert.equal(output.selected.singleCheck,true);
 assert.equal(output.selected.completionDate,'2026-01-15');
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-individual.png')});
 await page.locator('#completionDate').fill('2026-03-14');
 await page.locator('#completionDate').dispatchEvent('change');
 await settle();
 output.changedDate=await snapshot();
 assert.equal(output.changedDate.stored.first.date,'2026-03-14');
 assert.equal(output.changedDate.stored.first.source,'workbook');
 assert.equal(output.changedDate.stored.first.sourceRow,10);
 await page.locator('#detailComplete').uncheck();
 await settle();
 output.unchecked=await snapshot();
 assert.equal(output.unchecked.stored.first.completed,false);
 assert.equal(output.unchecked.stored.first.date,'');
 assert.equal(output.unchecked.stored.first.sourceSheet,'Stage 1 Camping');
 await page.locator('#detailComplete').check();
 await settle();
 await page.locator('#completionDate').fill('2026-03-15');
 await page.locator('#completionDate').dispatchEvent('change');
 await settle();
 output.rechecked=await snapshot();
 assert.equal(output.rechecked.stored.first.source,'manual');
 assert.equal(output.rechecked.stored.first.highlighted,true);

 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
 if(mode==='vue')await page.waitForFunction(
   ()=>document.documentElement.dataset.oasScoutRenderer==='vue');
 await page.locator('#scoutSelect').selectOption('Example Scout');
 await page.locator('#mapCanvas [data-id="'+reqId+'"]').click();
 await page.waitForSelector('#detailComplete');
 await settle();
 output.afterReload=await snapshot();
 assert.equal(output.afterReload.singleCheck,true);
 assert.equal(output.afterReload.completionDate,'2026-03-15');

 await page.locator('#scoutSelect').selectOption('__all__');
 await settle();
 output.pack=await snapshot();
 assert.equal(output.pack.missingDisabled,true);
 assert.equal(output.pack.groupChecks.length,2);
 await page.locator('[data-complete-scout="Another Example"]').check();
 await settle();
 output.groupUpdated=await snapshot();
 assert.equal(output.groupUpdated.stored.second.completed,true);
 assert.equal(output.groupUpdated.stored.second.sourceRow,23);
 assert.equal(output.groupUpdated.stored.second.extraField,'preserve this');
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-pack.png')});

 await page.locator('#multiScoutBtn').click();
 await settle();
 output.subsetOpened=await snapshot();
 await page.locator('#multiScoutOptions input[value="Example Scout"]').uncheck();
 await page.locator('#multiScoutOptions input[value="Another Example"]').check();
 await page.locator('#applyScoutSubset').click();
 await settle();
 output.subsetApplied=await snapshot();
 assert.equal(output.subsetApplied.selected,'__subset__');
 assert.equal(output.subsetApplied.scopeNote,'1 selected Scouts');
 assert.equal(output.subsetApplied.groupChecks.length,1);
 assert.equal(output.subsetApplied.groupChecks[0][0],'Another Example');

 await page.locator('#scoutSelect').selectOption('Example Scout');
 await settle();
 output.afterSubset=await snapshot();
 await page.locator('#closeDetail').click();
 await settle();
 output.closed=await snapshot();
 const recordOnly=await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1'));
 assert.ok(recordOnly.includes('preserve this'));
 assert.notEqual(noWriteBefore,recordOnly,'Completion saves should persist');
 const [download]=await Promise.all([
    page.waitForEvent('download'),page.locator('#exportBtn').click()
 ]);
 assert.equal(download.suggestedFilename(),'oas-trailmap-backup.json');
 const stream=await download.createReadStream();
 const chunks=[];for await(const part of stream)chunks.push(Buffer.from(part));
 const backup=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 assert.equal(backup.scoutRecords['Another Example::'+reqId].extraField,'preserve this');
 output.backup={format:backup.format,version:backup.version,
    count:Object.keys(backup.scoutRecords).length};
 assert.deepEqual(errors,[],'Browser JavaScript errors in '+mode);
 await page.close();
 return output;
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const legacy=await inspect(browser,'legacy',viewport);
    const vue=await inspect(browser,'vue',viewport);
    assert.deepEqual(vue,legacy,'Vue Scout editing parity differs at '+viewport.width+'px');
    console.log('4C.3 Scout selection, dates, group edits, reload and backup parity '+viewport.width+'px');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
