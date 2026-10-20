/* Phase 2: Vue preview only; no Scout data is read or created. */
'use strict';
const assert = require('node:assert/strict');
const { chromium } = require('playwright');

const base = process.env.OAS_TEST_URL || 'http://127.0.0.1:8765/';
(async()=>{
  const browser=await chromium.launch({headless:true});
  try {
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]) {
      const page=await browser.newPage({viewport});
      const errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      await page.goto(new URL('vue-preview.html',base).toString(),{waitUntil:'domcontentloaded'});
      await page.locator('[data-test="requirement-count"]').waitFor({timeout:20000});
      const count=await page.locator('[data-test="requirement-count"]').textContent();
      assert.equal(count?.trim(),'142','Unexpected requirements count');
      assert.equal((await page.locator('ul li').allTextContents()).length,3);
      assert.equal(await page.locator('a').first().getAttribute('href'),'./index.html');
      assert.deepEqual(errors,[],'Uncaught errors in Vue preview: '+errors);
      await page.close();
      console.log('Vue preview loaded all 142 requirements at '+viewport.width+'px under '+base);
    }
  } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
