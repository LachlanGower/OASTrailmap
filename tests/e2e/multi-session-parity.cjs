'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
async function inspect(browser,legacy,viewport){
 const page=await browser.newPage({viewport});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',async dialog=>dialog.accept());
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
 const url=new URL(ROOT);
 if(legacy)url.searchParams.set('scheduleWeeksRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 const state=structuredClone(fixture.storage);
 state['oas-trailmap-v1'].activities=[
  {id:'fictional-a',title:'Map practice',duration:30,location:'Scout Hall - indoor',tags:['navigation'],covers:['s1-camping-i-know-about-the-buddy-system']},
  {id:'fictional-b',title:'Safety practice',duration:20,location:'Scout Hall - indoor',tags:['safety'],covers:['s1-camping-i-know-about-the-buddy-system']}
 ];
 state['oas-studio-v1'].schedule=[{id:'week-1',title:'Fictional week',locked:false,capacity:4,requirementIds:['s1-camping-i-know-about-the-buddy-system'],activityIds:[],confirmedSession:false,sessionMinutes:90}];
 state['oas-studio-v1'].weeks=1;
 await page.evaluate(data=>{for(const [key,v] of Object.entries(data))localStorage.setItem(key,JSON.stringify(v));},state);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('[data-week-session="0"] [data-multi-pick]'),{timeout:25000});
 if(!legacy)await page.waitForFunction(()=>document.documentElement.dataset.oasScheduleWeeksRenderer==='vue');
 await page.locator('[data-mode="schedule"]').click();
 const scoutBefore=await page.evaluate(()=>localStorage.getItem('oas-trailmap-v1'));
 const panel=page.locator('[data-week-session="0"]');
 assert.equal(await page.locator('[data-week-session="0"]').count(),1,'only one multi-session panel per week');
 await panel.locator('[data-multi-pick]').selectOption('fictional-a');
 await page.waitForFunction(()=>document.querySelector('[data-week-session="0"] [data-multi-pick]'));
 assert.equal(await page.locator('[data-week-session="0"]').count(),1);
 await page.locator('[data-week-session="0"] [data-multi-pick]').selectOption('fictional-b');
 await page.locator('[data-week-session="0"] [data-multi-confirm]').click();
 const output=await page.evaluate(()=>({
  week:JSON.parse(localStorage.getItem('oas-studio-v1')).schedule[0],
  scout:localStorage.getItem('oas-trailmap-v1'),
  panels:document.querySelectorAll('[data-week-session="0"]').length
 }));
 assert.deepEqual(errors,[]);
 assert.equal(output.scout,scoutBefore,'planning must not award Scout evidence');
 assert.equal(output.panels,1);
 assert.deepEqual(output.week.activityIds,['fictional-a','fictional-b']);
 assert.equal(output.week.confirmedSession,true);
 await page.close();
 return {ids:output.week.activityIds,confirmed:output.week.confirmedSession,minutes:output.week.sessionMinutes};
}
(async()=>{const browser=await chromium.launch({headless:true});
 try{for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  assert.deepEqual(await inspect(browser,false,viewport),await inspect(browser,true,viewport));
 }console.log('4F.3 multi-session Vue/legacy parity passed');}
 finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1});
