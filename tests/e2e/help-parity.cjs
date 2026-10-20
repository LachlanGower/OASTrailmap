'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4h');
fs.mkdirSync(OUT,{recursive:true});

async function inspect(browser,mode,viewport) {
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
    status:200,contentType:'application/javascript',body:''
  }));
  const url=new URL(ROOT);if(mode==='legacy')url.searchParams.set('helpRenderer','legacy');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
  if(mode==='vue') await page.waitForFunction(
    ()=>document.documentElement.dataset.oasHelpRenderer==='vue',{timeout:20000});
  else assert.notEqual(await page.locator('html').getAttribute('data-oas-help-renderer'),'vue');
  await page.locator('#helpDesignTab').click();
  await page.waitForFunction(()=> {
    const panel=document.querySelector('#helpDesign');
    return panel && !panel.hidden && document.querySelectorAll('#helpTopics button').length>=12;
  });
  const snap=async()=>({
    titles:await page.locator('#helpTopics [data-help]').evaluateAll(nodes=>nodes.map(x=>x.textContent)),
    ids:await page.locator('#helpTopics [data-help]').evaluateAll(nodes=>nodes.map(x=>x.getAttribute('data-help'))),
    article:await page.locator('#helpContent').innerHTML(),
    search:await page.locator('#helpSearch').inputValue()
  });
  const result={initial:await snap()};
  assert.equal(result.initial.ids.length,14,'Help catalogue must include additional repeat and forecast topics');
  await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-initial.png')});
  for(const query of ['excel','repeat','forecast','not-a-real-topic']){
    await page.locator('#helpSearch').fill(query);
    result[query]=await snap();
  }
  await page.locator('#helpSearch').fill('');
  await page.locator('#helpTopics [data-help="trees"]').click();
  result.trees=await snap();
  await page.locator('[data-mode="trail"]').click();
  assert.equal(await page.locator('#helpDesign').getAttribute('hidden'),'');
  await page.locator('#helpDesignTab').click();
  assert.equal(await page.locator('#helpDesign').getAttribute('hidden'),null);
  assert.deepEqual(errors,[],'Uncaught errors in '+mode+' Help UI');
  await page.close();
  return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try {
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const legacy=await inspect(browser,'legacy',viewport);
    const vue=await inspect(browser,'vue',viewport);
    assert.deepEqual(vue,legacy,'Help UI differs from original at '+viewport.width+'px');
    console.log('Vue Help/legacy text and markup parity '+viewport.width+'px');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
