'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
async function inspect(browser,legacy,viewport){
 const page=await browser.newPage({viewport});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>dialog.dismiss());
 await page.route('https://cdn.jsdelivr.net/**',route=>route.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);
 if(legacy)url.searchParams.set('activityRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{for(const [key,value] of Object.entries(storage))localStorage.setItem(key,JSON.stringify(value));},fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof document.querySelector('#newActivity')?.onclick==='function',{timeout:20000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasActivityRenderer==='vue',{timeout:20000});
 await page.locator('#activityStudioTab').click();
 const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords);
 await page.locator('#newActivity').click();
 const form=legacy?page.locator('#activityEditor #activityForm'):page.locator('#activityEditor + div form');
 await form.locator('[name="title"]').fill('Synthetic navigation activity');
 await form.locator('[name="description"]').fill('Fictional test only');
 await form.locator('[name="duration"]').fill('45');
 await form.locator('button[type="submit"]').click();
 await page.waitForFunction(()=>[...document.querySelectorAll('#activityList button')].some(b=>b.textContent.includes('Synthetic navigation activity')),{timeout:10000});
 const after=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),activities:JSON.parse(localStorage.getItem('oas-studio-v1')||'{}')}));
 await page.close();
 assert.deepEqual(errors,[]);
 assert.deepEqual(JSON.parse(after.scout).scoutRecords,before,'Activity Studio must not write Scout evidence');
 const created=(after.activities.activities||[]).find(a=>a.title==='Synthetic navigation activity');
 return {title:created?.title,description:created?.description,duration:created?.duration,location:created?.location,coverage:created?.covers};
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const old=await inspect(browser,true,viewport),vue=await inspect(browser,false,viewport);
   assert.equal(vue,old,'Activity save should preserve legacy storage semantics');
  }
  console.log('4F.2 activity editor save parity checked using fictional Scout data');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
