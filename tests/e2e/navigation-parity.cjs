/* Phase 4B navigation: compare Vue and original navigation across 7 workspaces.
 * Browser tests use only public curriculum and fictional Scout data.
 */
'use strict';
const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const BASE=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4b');
fs.mkdirSync(OUT,{recursive:true});
const tabs=[
  {label:'Trailmap',tab:'[data-mode="trail"]',panel:'#trailWorkspace'},
  {label:'Skill Tree Mapper',tab:'[data-mode="tree"]',panel:'#treeStudio'},
  {label:'40-week Scheduler',tab:'[data-mode="schedule"]',panel:'#scheduleStudio'},
  {label:'Activity Studio',tab:'#activityStudioTab',panel:'#activityStudio'},
  {label:'Data & State',tab:'#dataManagerTab',panel:'#dataManager'},
  {label:'Help & Design',tab:'#helpDesignTab',panel:'#helpDesign'},
  {label:'Application Requirements',tab:'#appRequirementsTab',panel:'#applicationRequirements'}
];

async function inspect(browser,mode,viewport){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({status:200,contentType:'application/javascript',body:''}));
  const url=new URL(BASE);if(mode==='legacy')url.searchParams.set('navRenderer','legacy');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{const toggle=document.querySelector('#groupDuplicateRequirements');if(toggle){toggle.checked=false;toggle.dispatchEvent(new Event('change',{bubbles:true}));}});
  await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
  await page.waitForFunction(()=>document.querySelector('#appRequirementsTab')?.onclick!==null||
    document.documentElement.dataset.oasNavRenderer==='vue');
  if(mode==='vue') await page.waitForFunction(
    ()=>document.documentElement.dataset.oasNavRenderer==='vue',{timeout:20000});
  else assert.notEqual(await page.locator('html').getAttribute('data-oas-nav-renderer'),'vue');
  assert.equal(await page.locator('nav.studio-nav button:visible').count(),9);
  const results=[];
  for(const item of tabs) {
    await page.locator(item.tab).click();
    await page.waitForFunction(selector=> {
      const el=document.querySelector(selector);
      return el && !el.hidden && getComputedStyle(el).display!=='none';
    },item.panel);
    if(item.label==='Application Requirements')await page.waitForFunction(
      ()=>document.querySelector('#appReqList')?.textContent?.includes('APP-001'));
    const panels=await page.evaluate(()=>{
      const selectors=['#trailWorkspace','#treeStudio','#scheduleStudio','#activityStudio',
        '#dataManager','#helpDesign','#applicationRequirements'];
      return selectors.map(s=>!document.querySelector(s).hidden);
    });
    assert.equal(panels.filter(Boolean).length,1,'Multiple workspaces visible: '+item.label+'/'+mode);
    results.push({
      label:item.label,
      panelVisibility:panels,
      navClasses:await page.locator('nav.studio-nav button').evaluateAll(nodes=>nodes.map(x=>x.className)),
      sectionHeading:await page.locator(item.panel).locator('h2').first().innerText()
    });
  }
  await page.locator('[data-mode="trail"]').click();
  assert.equal(await page.locator('#trailWorkspace').getAttribute('hidden'),null);
  await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-trail.png')});
  assert.deepEqual(errors,[],'Browser console page errors in '+mode+': '+errors);
  await page.close();
  return results;
}
(async()=>{
  const browser=await chromium.launch({headless:true});
  try{
    for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
      const legacy=await inspect(browser,'legacy',viewport);
      const vue=await inspect(browser,'vue',viewport);
      assert.deepEqual(vue,legacy,'Vue navigation changed workspace behavior at '+viewport.width+'px');
      console.log('Navigation 7/7 parity: '+viewport.width+'px');
    }
  }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
