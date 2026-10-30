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
 if(legacy)url.searchParams.set('forecastRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{for(const [key,value] of Object.entries(storage))localStorage.setItem(key,JSON.stringify(value));},fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#forecastProgress')?.textContent?.includes('Forecasted Scout requirement progress')||document.querySelector('#forecastProgress')?.textContent?.includes('Generate a schedule'),{timeout:20000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasForecastRenderer==='vue',{timeout:20000});
 const result=await page.evaluate(()=>({
  text:document.querySelector('#forecastProgress')?.textContent?.replace(/\s+/g,' ').trim(),
  chart:!!document.querySelector('#forecastProgress svg[role="img"]'),
  scoutState:localStorage.getItem('oas-trailmap-v1'),
  studioState:localStorage.getItem('oas-studio-v1')
 }));
 await page.close();
 assert.equal(errors.length,0,errors.join('\n'));
 return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   // Viewport coverage is provided by browser context sizing in a later full-suite run.
   const old=await inspect(browser,true,viewport),vue=await inspect(browser,false,viewport);
   assert.equal(vue.text,old.text);
   assert.equal(vue.chart,old.chart);
   assert.equal(vue.scoutState,old.scoutState);
   assert.equal(vue.studioState,old.studioState);
  }
  console.log('Conditional Vue forecast matches legacy totals with fictional state');
 }finally{await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1});
