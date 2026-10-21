/* Browser contract: synthetic workbook, no uploaded Cub Pack records.
 * The original JS parser is the reference for Vue/TypeScript migration.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const {fakeWorkbook}=require('../fixtures/workbook.synthetic.cjs');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const BASE=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4c4');
fs.mkdirSync(OUT,{recursive:true});
async function inspect(browser,mode,viewport){
 const page=await browser.newPage({viewport,acceptDownloads:true});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
  status:200,contentType:'application/javascript',body:''
 }));
 await page.addInitScript(wb=>{
  const letters='ABCDEFGHIJKLMNOPQRSTUVWXYZ';
  window.XLSX={
   utils:{
    encode_cell:({r,c})=>letters[c]+(r+1),
    decode_range:ref=>{
     const parse=x=>({c:letters.indexOf(x.match(/[A-Z]+/)[0]),r:+x.match(/\d+/)[0]-1});
     const [start,end]=ref.split(':');return {s:parse(start),e:parse(end)};
    }
   },
   SSF:{parse_date_code:n=>n===45000?{y:2023,m:3,d:15}:null},
   read:()=>wb
  };
 },fakeWorkbook());
 const url=new URL(BASE);
 if(mode==='legacy')url.searchParams.set('workbookRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{
   for(const [key,value] of Object.entries(storage))localStorage.setItem(key,JSON.stringify(value));
 },fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
 if(mode==='vue')await page.waitForFunction(()=>typeof window.__oasWorkbookStart==='function',{timeout:20000});
 else assert.equal(await page.evaluate(()=>typeof window.__oasWorkbookStart),'undefined');
 await page.waitForFunction(()=>document.documentElement.dataset.oasNavRenderer==='vue' ||
   typeof document.querySelector('#dataManagerTab')?.onclick==='function',{timeout:20000});
 await page.locator('#dataManagerTab').click();
 await page.waitForFunction(()=>!document.querySelector('#dataManager').hidden);
 async function openPreview(){
  await page.locator('#workbookFile').setInputFiles({
   name:'fictional-cub-progress.xlsx',
   mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
   buffer:Buffer.from('synthetic data decoded via browser stub')
  });
  await page.waitForFunction(()=>!document.querySelector('#previewPanel').hidden &&
    !!document.querySelector('#applyWorkbook'),{timeout:20000});
 }
 async function current(){
  return page.evaluate(()=>{
   const panel=document.querySelector('#previewPanel');
   const saved=JSON.parse(localStorage.getItem('oas-trailmap-v1'));
   return {
    panelHidden:panel.hidden,
    title:panel.querySelector('h3')?.textContent,
    paragraphs:[...panel.querySelectorAll(':scope > p')].map(p=>p.textContent.replace(/\s+/g,' ').trim()),
    rows:[...panel.querySelectorAll('.preview-table tbody tr')].map(tr=>
      [...tr.querySelectorAll('td')].map(td=>td.textContent.replace(/\s+/g,' ').trim())),
    status:document.querySelector('#importStatus').textContent,
    saved,
    displayedScouts:[...document.querySelector('#scoutSelect').options].map(o=>o.value)
   };
  });
 }
 const initialRaw=await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1'));
 await openPreview();
 const preview=await current();
 assert.equal(preview.title,'Workbook import preview');
 assert.equal(preview.rows.length,2);
 assert.ok(preview.paragraphs[0].includes('2 Scouts'));
 assert.ok(preview.paragraphs[0].includes('5 completed cells'));
 assert.ok(preview.paragraphs[0].includes('2 workbook rows'));
 assert.equal(await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1')),initialRaw,
   'Opening preview must not write data');
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-preview.png')});
 await page.locator('#cancelWorkbook').click();
 assert.equal(await page.locator('#previewPanel').getAttribute('hidden'),'');
 assert.equal(await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1')),initialRaw,
   'Cancel must not change stored state');
 await openPreview();
 await page.locator('#applyWorkbook').click();
 await page.waitForFunction(()=>document.querySelector('#importStatus')?.textContent?.startsWith('Imported'));
 const applied=await current();
 assert.equal(applied.panelHidden,true);
 assert.equal(applied.saved.scoutRecords['Example Scout::s1-camping-i-know-about-the-buddy-system'].date,
  '2023-03-15');
 assert.equal(applied.saved.scoutRecords['Example Scout::s1-camping-i-know-about-the-buddy-system'].sourceRow,5);
 assert.equal(applied.saved.scoutRecords['Example Scout::s1-camping-i-know-about-the-buddy-system'].highlighted,true);
 assert.equal(applied.saved.scoutRecords['Another Example::s1-camping-i-know-about-the-buddy-system'].date,'');
 assert.equal(applied.saved.scoutRecords['Another Example::s1-camping-i-know-about-the-buddy-system'].highlighted,true);
 assert.ok(applied.saved.scoutRecords['Example Scout::__roster__']);
 assert.ok(applied.saved.scoutRecords['Another Example::__roster__']);
 assert.equal(applied.saved.supplementalRequirements.length,2);
 const once=JSON.stringify(applied.saved.scoutRecords);
 await openPreview();
 const reimport=await current();
 await page.locator('#applyWorkbook').click();
 await page.waitForFunction(()=>document.querySelector('#previewPanel').hidden);
 const reimported=await current();
 assert.equal(JSON.stringify(reimported.saved.scoutRecords),once,
   'Reimporting identical workbook should preserve record values and sources');
 assert.equal(reimported.saved.supplementalRequirements.length,2);
 const [dl]=await Promise.all([page.waitForEvent('download'),page.locator('#exportBtn').click()]);
 assert.equal(dl.suggestedFilename(),'oas-trailmap-backup.json');
 const stream=await dl.createReadStream(),chunks=[];
 for await(const part of stream)chunks.push(Buffer.from(part));
 const backup=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 assert.equal(backup.scoutRecords['Example Scout::s1-camping-i-know-about-the-buddy-system'].sourceRow,5);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length>=142);
 const retained=await page.evaluate(()=>{
  const x=JSON.parse(localStorage.getItem('oas-trailmap-v1'));
  return {count:x.supplementalRequirements.length,rows:Object.keys(x.scoutRecords).length};
 });
 assert.equal(retained.count,2);
 assert.deepEqual(errors,[],'Browser errors in '+mode);
 await page.close();
 return {
  preview:{title:preview.title,paragraphs:preview.paragraphs,rows:preview.rows,status:preview.status},
  applied:{saved:applied.saved,status:applied.status,selected:applied.displayedScouts},
  reimport:{rows:reimport.rows,scouts:reimport.displayedScouts},
  reimported:reimported.saved,retained
 };
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const legacy=await inspect(browser,'legacy',viewport);
   const vue=await inspect(browser,'vue',viewport);
   assert.deepEqual(vue,legacy,'Vue workbook import differs at '+viewport.width);
   console.log('Workbook preview/cancel/apply/reimport parity '+viewport.width+'px');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
