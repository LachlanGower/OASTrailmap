/* The legacy Trailmap is the golden master for this Vue rendering island.
 * All Scout identities/data are fictional. No real workbook or browser data.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4c2');
fs.mkdirSync(OUT,{recursive:true});
const skillId='s1-camping-i-know-about-the-buddy-system';

async function inspect(browser,mode,viewport){
  const page=await browser.newPage({viewport});
  const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
    status:200,contentType:'application/javascript',body:''
  }));
  const url=new URL(ROOT);
  if(mode==='legacy')url.searchParams.set('trailmapRenderer','legacy');
  await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
  await page.evaluate(storage=>{
    for(const [key,value] of Object.entries(storage))localStorage.setItem(key,JSON.stringify(value));
  },fixture.storage);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelectorAll('#mapCanvas .requirement-node').length===142);
  if(mode==='vue')await page.waitForFunction(
    ()=>document.documentElement.dataset.oasTrailmapRenderer==='vue',{timeout:20000});
  else assert.notEqual(
    await page.locator('html').getAttribute('data-oas-trailmap-renderer'),'vue');

  async function snapshot(){
    return await page.evaluate(()=>{
      const map=document.querySelector('#mapCanvas');
      const nodes=[...map.querySelectorAll('.requirement-node')];
      return {
        ids:nodes.map(n=>n.dataset.id),
        marks:nodes.map(n=>n.querySelector('.node-mark')?.textContent),
        classes:nodes.map(n=>[...n.classList].join(' ')), // HTML class whitespace is not a visual difference
        copy:nodes.map(n=>n.querySelector('.node-copy')?.textContent),
        badges:nodes.map(n=>[...n.querySelectorAll('.node-badge')].map(x=>x.textContent)),
        titles:nodes.map(n=>n.title),
        headings:[...map.querySelectorAll('.stage-title')].map(el=>el.textContent.replace(/\\s+/g,' ').trim()),
        streams:[...map.querySelectorAll('.stream-title')].map(el=>el.textContent),
        empty:document.querySelector('#emptyMap').hidden,
        summary:['progressPct','completedCount','activityCount','nextCount','scopeNote'].map(id=>document.getElementById(id)?.textContent),
        detail:document.querySelector('#detailPanel')?.innerText,
        overlayCount:map.querySelectorAll('.related-overlay path').length
      };
    });
  }
  async function settled(){await page.waitForTimeout(90);}
  const output={initial:await snapshot()};
  assert.equal(output.initial.ids.length,142);
  await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-initial.png')});

  await page.locator('#stageFilter').selectOption('1');
  await settled();output.stage=await snapshot();
  await page.locator('#streamFilter').selectOption('Camping');
  await settled();output.stream=await snapshot();
  await page.locator('#searchInput').fill('buddy');
  await settled();output.search=await snapshot();
  await page.locator('#searchInput').fill('');
  await page.locator('#streamFilter').selectOption('all');
  await page.locator('#stageFilter').selectOption('all');

  await page.locator('#scoutSelect').selectOption('Example Scout');
  await settled();output.scout=await snapshot();
  await page.locator('#statusFilter').selectOption('complete');
  await settled();output.completedFilter=await snapshot();
  assert.deepEqual(output.completedFilter.ids,[skillId]);
  await page.locator('#statusFilter').selectOption('outstanding');
  await settled();output.outstanding=await snapshot();
  await page.locator('#statusFilter').selectOption('all');

  await page.locator('#mapCanvas [data-id="'+skillId+'"]').click();
  await page.waitForSelector('#detailComplete');
  await settled();output.selected=await snapshot();
  assert.equal(await page.locator('#detailComplete').isChecked(),true);
  await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-selected.png')});
  await page.locator('#detailComplete').uncheck();
  await settled();output.afterCompletion=await snapshot();
  output.savedRecord=await page.evaluate(id=>JSON.parse(localStorage.getItem('oas-trailmap-v1'))
    .scoutRecords['Example Scout::'+id],skillId);
  assert.equal(output.savedRecord.completed,false);
  await page.locator('#closeDetail').click();
  await settled();output.closed=await snapshot();

  await page.locator('#plannerMode').check();
  await settled();
  const firstTag=await page.locator('#plannerTags input[type=checkbox]').first().inputValue();
  await page.locator('#plannerTags input[type=checkbox]').first().check();
  await settled();output.planner=await snapshot();
  output.plannerTag=firstTag;
  await page.locator('#plannerMode').uncheck();
  await page.locator('#searchInput').fill('unlikely-pattern-not-in-requirements');
  await settled();output.empty=await snapshot();
  assert.deepEqual(output.empty.ids,[]);
  assert.equal(output.empty.empty,false);
  await page.locator('#searchInput').fill('');

  assert.deepEqual(errors,[],'Uncaught errors in '+mode+' Trailmap: '+errors);
  await page.close();
  return output;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
    const old=await inspect(browser,'legacy',viewport);
    const modern=await inspect(browser,'vue',viewport);
    assert.deepEqual(modern,old,'Vue requirement map diverged at '+viewport.width+'px');
    console.log('Trailmap map Vue/legacy data and interaction parity '+viewport.width+'px');
  }
 }finally{await browser.close();}
})().catch(err=>{console.error(err);process.exitCode=1;});
