/* Browser smoke for the *legacy* site. Produces no user Scout data. */
'use strict';
const { chromium } = require('playwright');
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');

const ROOT = process.env.OAS_TEST_URL || 'http://127.0.0.1:8765/';
const OUT = path.resolve('tests/baseline-artifacts');
const fixture = require('../fixtures/legacy-state.synthetic.json');
fs.mkdirSync(OUT, {recursive:true});
const delay = ms => new Promise(resolve=>setTimeout(resolve, ms));

(async () => {
  const browser = await chromium.launch({headless:true});
  const failures = [];
  try {
    for (const viewport of [{name:'desktop',width:1440,height:900},{name:'mobile',width:390,height:844}]) {
      const page = await browser.newPage({viewport:{width:viewport.width,height:viewport.height}});
      const jsErrors=[];
      page.on('pageerror', e=>jsErrors.push(e.message));
      // Excel/YAML parsing is tested separately, using the real workbook.
      // Stub the remote CDN scripts so general UI baseline can run offline.
      await page.route('https://cdn.jsdelivr.net/**', route=>
        route.fulfill({status:200,contentType:'application/javascript',body:''})
      );
      await page.goto(ROOT,{waitUntil:'domcontentloaded'});
      await page.evaluate(()=>{const toggle=document.querySelector('#groupDuplicateRequirements');if(toggle){toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));}});
  await page.waitForFunction(
        ()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142,
        {timeout:20000}
      );
      assert.equal(await page.locator('#mapCanvas .requirement-node').count(),142);
      const screenshots=[
        ['trailmap','#trailWorkspace',null],
        ['skill-tree','#treeStudio','[data-mode="tree"]'],
        ['scheduler','#scheduleStudio','[data-mode="schedule"]'],
        ['activity-studio','#activityStudio','#activityStudioTab'],
        ['data-state','#dataManager','#dataManagerTab'],
        ['help','#helpDesign','#helpDesignTab'],
        ['application-requirements','#applicationRequirements','#appRequirementsTab']
      ];
      for (const [name,panel,tab] of screenshots) {
        if(tab) await page.locator(tab).click();
        await page.waitForFunction(sel => {
          const el = document.querySelector(sel);
          return !!el && !el.hidden && getComputedStyle(el).display!=='none';
        }, panel);
        if(name==='application-requirements'){
          await page.waitForFunction(
            ()=>document.querySelector('#appReqList')?.textContent?.includes('APP-001'),
            {timeout:20000}
          );
        }
        await page.screenshot({path:path.join(OUT,viewport.name+'-'+name+'.png')});
      }
      assert.deepEqual(jsErrors,[],'Uncaught browser errors in '+viewport.name+': '+jsErrors.join('; '));
      await page.close();
      console.log(viewport.name+': all seven legacy workspace panels visible and screenshots captured');
    }

    const page=await browser.newPage({viewport:{width:1440,height:900}});
    page.on('pageerror',e=>failures.push(e.message));
    await page.route('https://cdn.jsdelivr.net/**', route=>
      route.fulfill({status:200,contentType:'application/javascript',body:''})
    );
    await page.goto(ROOT,{waitUntil:'domcontentloaded'});
    await page.evaluate(storage=>{
      for (const [key,value] of Object.entries(storage)) localStorage.setItem(key,JSON.stringify(value));
    },fixture.storage);
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
    await page.locator('#scoutSelect').selectOption('Example Scout');
    await page.locator('#mapCanvas [data-id="s1-camping-i-know-about-the-buddy-system"]').click();
    await page.waitForSelector('#detailComplete');
    assert.equal(await page.locator('#detailComplete').isChecked(),true,'Synthetic imported completion must load');
    await page.locator('#detailComplete').uncheck();
    const recordId='Example Scout::s1-camping-i-know-about-the-buddy-system';
    const saved=await page.evaluate(id=>{
      const state=JSON.parse(localStorage.getItem('oas-trailmap-v1'));
      return state.scoutRecords[id];
    },recordId);
    assert.equal(saved?.completed,false,'Manual completion change must persist locally');
    await page.reload({waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
    await page.locator('#scoutSelect').selectOption('Example Scout');
    await page.locator('#mapCanvas [data-id="s1-camping-i-know-about-the-buddy-system"]').click();
    assert.equal(await page.locator('#detailComplete').isChecked(),false,
      'Progress must survive reload without completion being reset');
    assert.deepEqual(failures,[],'Browser errors in synthetic progress scenario');
    await page.close();
    console.log('Fictional Scout completion load, update and reload verified');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
