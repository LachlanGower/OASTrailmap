'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
async function inspect(browser,legacy,viewport){
 const page=await browser.newPage({viewport});
 const errors=[],dialogs=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',async d=>{dialogs.push(d.type());await d.dismiss();});
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);if(legacy)url.searchParams.set('recoveryRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{for(const [key,v]of Object.entries(storage))localStorage.setItem(key,JSON.stringify(v));},fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>typeof document.querySelector('#clearPlanBtn')?.onclick==='function',{timeout:25000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasRecoveryRenderer==='vue',{timeout:25000});
 await page.locator('#dataManagerTab').click();
 const button=legacy?page.locator('#clearPlanBtn'):page.locator('[data-recovery-action="clearPlanBtn"]');
 const before=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),studio:localStorage.getItem('oas-studio-v1')}));
 await button.click();
 assert.equal(await page.locator('#resetReview').isVisible(),true);
 assert.equal(await page.locator('#resetBackupDownload').count(),1);
 await page.locator('#resetCancel').click();
 const afterCancel=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),studio:localStorage.getItem('oas-studio-v1')}));
 assert.deepEqual(afterCancel,before,'Cancel must preserve all storage');
 // Checkpoint failure must prevent destructive reset even when confirmations are accepted.
 await page.evaluate(()=>{
  const original=Storage.prototype.setItem;
  Storage.prototype.setItem=function(key,value){if(key.includes('checkpoint'))throw new DOMException('Storage quota exceeded','QuotaExceededError');return original.call(this,key,value);};
 });
 // The explicit confirmations are handled below, without dismissing them.
 page.removeAllListeners('dialog');
 page.on('dialog',async d=>{if(d.type()==='prompt')await d.accept('CLEAR SCHEDULE');else await d.accept();});
 await button.click();
 await page.locator('#resetProceed').click();
 const afterFailure=await page.evaluate(()=>({scout:localStorage.getItem('oas-trailmap-v1'),studio:localStorage.getItem('oas-studio-v1')}));
 assert.deepEqual(afterFailure,before,'Checkpoint failure must abort reset');
 assert.equal(await page.locator('#resetReview').isVisible(),true,'Failed recovery remains reviewable');
 assert.deepEqual(errors,[]);
 await page.close();
 return {cancel:true,failedCheckpoint:true};
}
(async()=>{const browser=await chromium.launch({headless:true});
 try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  assert.deepEqual(await inspect(browser,false,viewport),await inspect(browser,true,viewport));
 }console.log('4G.3 reset cancel and checkpoint failure safety passed');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
