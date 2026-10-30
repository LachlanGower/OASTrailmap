'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
async function inspect(browser,legacy){
 const page=await browser.newPage({viewport:{width:1280,height:800}});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',d=>d.dismiss());
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);
 if(legacy)url.searchParams.set('requirementsTrackerRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{for(const [k,v] of Object.entries(storage))localStorage.setItem(k,JSON.stringify(v));},fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#requirementsTrackerSearch')?.oninput && document.querySelectorAll('#requirementsTrackerRows tr').length>0,{timeout:20000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasRequirementsTrackerRenderer==='vue',{timeout:20000});
 await page.locator('[data-mode="schedule"]').click();
 const data=async()=>page.evaluate(()=>{
   const vue=document.documentElement.dataset.oasRequirementsTrackerRenderer==='vue';
   const root=document.querySelector(vue?'#vueCoverageRows':'#requirementsTrackerRows');
   return {ids:[...root.querySelectorAll('tr td:first-child small')].map(n=>n.textContent),rows:[...root.querySelectorAll('tr')].map(n=>n.textContent.replace(/\\s+/g,' ').trim()),summary:document.querySelector(vue?'#requirementsTracker .data-stats:not(#requirementsTrackerSummary)':'#requirementsTrackerSummary').textContent.replace(/\\s+/g,' ').trim(),scoutState:localStorage.getItem('oas-trailmap-v1')};
 });
 let full=await data();
 await page.locator('#requirementsTrackerSearch').fill('unlikely-search-term-no-match');
 await page.waitForTimeout(100);
 const empty=await data();
 await page.close();
 assert.equal(errors.length,0,errors.join('\n'));
 return {full,empty};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  const legacy=await inspect(browser,true),vue=await inspect(browser,false);
  assert.equal(new Set(vue.full.ids).size,vue.full.ids.length);
  assert.deepEqual(vue.full.ids,legacy.full.ids);
  assert.deepEqual(vue.full.rows,legacy.full.rows);
  assert.equal(vue.full.summary,legacy.full.summary);
  assert.deepEqual(vue.empty.rows,legacy.empty.rows);
  assert.equal(vue.full.scoutState,legacy.full.scoutState);
  console.log('4E.4a Vue/legacy coverage parity verified with fictional data');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
