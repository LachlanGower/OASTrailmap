'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
(async()=>{const browser=await chromium.launch({headless:true});try{
 for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
  const page=await browser.newPage({viewport});
  await page.goto(ROOT,{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.documentElement.dataset.oasRecoveryRenderer==='vue',{timeout:25000});
  await page.locator('#dataManagerTab').click();
  assert.equal(await page.locator('[data-recovery-action]').count(),5);
  const ids=await page.locator('[data-recovery-action]').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('aria-describedby')));
  assert.deepEqual([...new Set(ids)],['recovery-warning']);
  await page.locator('[data-recovery-action="clearPlanBtn"]').focus();
  assert.equal(await page.locator('[data-recovery-action="clearPlanBtn"]').evaluate(n=>n===document.activeElement),true);
  await page.keyboard.press('Enter');
  assert.equal(await page.locator('#resetReview').isVisible(),true);
  await page.locator('#resetCancel').click();
  assert.equal(await page.locator('#resetReview').isVisible(),false);
  await page.close();
 }
 console.log('Accessibility keyboard/recovery parity passed');
}finally{await browser.close();}})().catch(e=>{console.error(e);process.exitCode=1});
