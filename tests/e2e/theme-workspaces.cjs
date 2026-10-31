'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const URL=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
 const page=await browser.newPage({viewport});const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(URL,{waitUntil:'domcontentloaded'});
 await page.locator('#weeklyThemesTab').click();
 await page.waitForFunction(()=>document.querySelector('#weeklyThemeSelect')?.options.length>3,{timeout:25000});
 assert.equal(await page.locator('#weeklyThemes').isVisible(),true);
 const theme=await page.locator('#weeklyThemeSelect option').evaluateAll(items=>items.find(x=>x.value)?.value);
 await page.locator('#weeklyThemeSelect').selectOption(theme);
 assert.equal(await page.locator('.theme-stage').count(),3);
 await page.locator('#requirementsTrackerTab').click();
 assert.equal(await page.locator('#requirementsWorkspace').isVisible(),true);
 await page.locator('[data-mode="schedule"]').click();
 assert.equal(await page.locator('#requirementsWorkspace').isVisible(),false);
 assert.ok(await page.locator('#scheduleLocationChoices input').count()>0);
 assert.deepEqual(errors,[]);
 await page.close();
 }
 console.log('Theme navigation, stage panels and location choices passed');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
