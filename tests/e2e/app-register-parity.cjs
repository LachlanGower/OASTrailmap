/* Browser parity of real Vue workspace vs the original register. No Scout data. */
'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const BASE = process.env.OAS_TEST_URL || 'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4');
fs.mkdirSync(OUT,{recursive:true});

async function contentOf(download) {
  const stream=await download.createReadStream();
  if(!stream)throw new Error('No download stream');
  const chunks=[];
  for await(const chunk of stream)chunks.push(Buffer.from(chunk));
  return Buffer.concat(chunks).toString('utf8');
}
async function inspect(browser, mode, viewport) {
  const page=await browser.newPage({viewport,acceptDownloads:true});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  const url=new URL(BASE);
  if(mode==='legacy') url.searchParams.set('appReqRenderer','legacy');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#mapCanvas .requirement-node'));
  if(mode==='vue') await page.waitForFunction(
    ()=>document.documentElement.dataset.appRequirementsRenderer==='vue',{timeout:20000}
  );
  else assert.notEqual(await page.locator('html').getAttribute('data-app-requirements-renderer'),'vue');
  await page.locator('#appRequirementsTab').click();
  await page.waitForFunction(()=>document.querySelector('#appReqList')?.textContent?.includes('APP-001'));
  assert.equal(await page.locator('#applicationRequirements').getAttribute('hidden'),null);
  const snapshot=async()=>({
    ids:await page.locator('#appReqList article.app-req-card').evaluateAll(
      cards=>cards.map(c=>c.id)),
    stats:await page.locator('#appReqSummary').innerText(),
    summary:await page.locator('#appReqResults').innerText(),
    statuses:await page.locator('#appReqList .app-req-status').allTextContents()
  });
  const output={};
  output.all=await snapshot();
  assert.equal(output.all.ids.length,118);
  await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-initial.png'),fullPage:false});
  await page.locator('#appReqSearch').fill('Excel');
  output.search=await snapshot();
  await page.locator('#appReqStatus').selectOption('implemented');
  output.filtered=await snapshot();
  await page.locator('#appReqCategory').selectOption('EXCEL');
  output.categorised=await snapshot();
  await page.locator('#appReqClear').click();
  output.cleared=await snapshot();
  assert.equal(output.cleared.ids.length,118);
  await page.locator('#appReqSearch').fill('no-such-requirement-query');
  output.empty=await snapshot();
  assert.equal(output.empty.ids.length,0);
  assert.ok((await page.locator('#appReqList').innerText()).includes('No application requirements match'));
  await page.locator('#appReqClear').click();
  await page.locator('#appReqList details').first().locator('summary').click();
  assert.equal(await page.locator('#appReqList details').first().getAttribute('open'),'');
  output.details=await page.locator('#appReqList details').first().innerText();
  for(const [kind,name] of [['csv','oas-trailmap-application-requirements.csv'],
                             ['json','oas-trailmap-application-requirements.json']]){
    const [dl]=await Promise.all([
      page.waitForEvent('download'),
      page.locator(kind==='csv'?'#appReqExportCsv':'#appReqExportJson').click()
    ]);
    assert.equal(dl.suggestedFilename(),name);
    output[kind]=await contentOf(dl);
  }
  const saved=await page.evaluate(()=>Object.keys(localStorage));
  assert.deepEqual(saved,[],'Register UI must not write Scout progress storage');

  // Legacy navigation still controls which of the seven panels is visible.
  await page.locator('[data-mode="trail"]').click();
  assert.equal(await page.locator('#applicationRequirements').getAttribute('hidden'),'');
  await page.locator('#appRequirementsTab').click();
  assert.equal(await page.locator('#applicationRequirements').getAttribute('hidden'),null);
  assert.deepEqual(errors,[],'Uncaught browser errors in '+mode+' mode');
  await page.close();
  return output;
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
      const old=await inspect(browser,'legacy',viewport);
      const vue=await inspect(browser,'vue',viewport);
      assert.deepEqual(vue,old,'Vue and legacy register diverged at '+viewport.width+'px');
      console.log('Register Vue/legacy search/filter/export/navigation parity: '+viewport.width+'px');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
