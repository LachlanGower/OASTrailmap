'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const root=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(root,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.oasNavRenderer==='vue',{timeout:25000});
  const nav=page.locator('nav.studio-nav');
  await nav.locator('[data-mode="schedule"]').click();
  await nav.locator('#requirementsTrackerTab').click();
  assert.equal(await page.locator('#requirementsWorkspace').isVisible(),true);
  assert.equal(await nav.locator('button.primary').count(),1,'Exactly one workspace tab should be selected');
  await nav.locator('#dataManagerTab').click();
  for(const id of ['dataSnapshot','dataImporter','dataExporter','dataReset'])assert.equal(await page.locator('#'+id).isVisible(),true);
  assert.equal(await page.locator('#dataExportFormat option').count(),3);
  await nav.locator('#weeklyThemesTab').click();
  await page.locator('#weeklyThemeSelect').selectOption({index:1});
  assert.equal(await page.locator('.theme-stage').count(),3);
  await page.locator('.theme-requirement-link').first().click();
  assert.equal(await page.locator('#oasRequirementInspector').isVisible(),true);
  await page.locator('#oasRequirementInspector button').click();
  await nav.locator('#activityStudioTab').click();
  assert.equal(await page.locator('#activityLibrarySearch').count(),1);
  await nav.locator('[data-mode="tree"]').click();
  assert.equal(await page.locator('#deleteTree').count(),1);
  assert.deepEqual(errors,[]);
  await page.close();
 }
 console.log('Phase 4 UX: single active tab, data sections, themed details and controls verified');
}finally{await browser.close()}})().catch(e=>{console.error(e);process.exitCode=1});
