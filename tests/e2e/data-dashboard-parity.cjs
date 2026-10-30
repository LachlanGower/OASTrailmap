'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
async function inspect(browser,legacy,viewport){
 const page=await browser.newPage({viewport});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);if(legacy)url.searchParams.set('dataDashboardRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{for(const [key,value]of Object.entries(storage))localStorage.setItem(key,JSON.stringify(value));},fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelectorAll('#dataStats .data-stat').length===5,{timeout:25000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasDataDashboardRenderer==='vue',{timeout:25000});
 await page.locator('#dataManagerTab').click();
 const before=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),studio:localStorage.getItem('oas-studio-v1')}));
 const data=await page.evaluate(()=>{
  const vue=document.documentElement.dataset.oasDataDashboardRenderer==='vue';
  const root=vue?document.querySelector('#dataStats').previousElementSibling:document.querySelector('#dataStats');
  return {counts:[...root.querySelectorAll('.data-stat')].map(x=>x.textContent.trim()),
   exportTypes:[...(vue?root.querySelectorAll('[data-vue-export]'):document.querySelectorAll('#dataExports [data-dexport]'))].map(x=>vue?x.dataset.vueExport:x.dataset.dexport)};
 });
 const after=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),studio:localStorage.getItem('oas-studio-v1')}));
 assert.deepEqual(after,before,'Viewing dashboard must not rewrite storage');
 assert.deepEqual(errors,[]);
 await page.close();return data;
}
(async()=>{const browser=await chromium.launch({headless:true});
 try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  assert.deepEqual(await inspect(browser,false,viewport),await inspect(browser,true,viewport));
 }console.log('4G.2 Vue Data dashboard parity passed');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
