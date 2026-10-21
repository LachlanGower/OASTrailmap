/* Browser comparison of Vue mapper canvas and original legacy rendering.
 * Uses only public OAS requirements and a fictional Scout state.
 */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const BASE=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4d2');
fs.mkdirSync(OUT,{recursive:true});

async function inspect(browser,mode,viewport){
 const page=await browser.newPage({viewport});
 const errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
  status:200,contentType:'application/javascript',body:''
 }));
 const url=new URL(BASE);
 if(mode==='legacy')url.searchParams.set('treeRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{
  for(const [key,value] of Object.entries(storage))
    localStorage.setItem(key,JSON.stringify(value));
 },fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#treeCanvas .tree-lanes') &&
    document.querySelector('#treeSelect')?.options.length>0,{timeout:20000});
 if(mode==='vue')
   await page.waitForFunction(()=>document.documentElement.dataset.oasTreeRenderer==='vue',
    {timeout:20000});
 else assert.notEqual(await page.locator('html').getAttribute('data-oas-tree-renderer'),'vue');
 await page.waitForFunction(()=>document.documentElement.dataset.oasNavRenderer==='vue' ||
  typeof document.querySelector('[data-mode="tree"]')?.onclick==='function',{timeout:20000});
 await page.locator('[data-mode="tree"]').click();
 await page.waitForFunction(()=>!document.querySelector('#treeStudio').hidden);
 await page.waitForTimeout(120);
 async function snapshot(){
  return page.evaluate(()=>{
   const box=document.querySelector('#treeCanvas');
   const nodes=[...box.querySelectorAll('.tree-node')];
   const select=document.querySelector('#treeSelect');
   const data=JSON.parse(localStorage.getItem('oas-studio-v1'));
   return {
    tree:select.value,options:[...select.options].map(x=>[x.value,x.label]),
    graphMode:document.querySelector('#treeGraphMode').value,
    graphDisabled:document.querySelector('#treeGraphMode').disabled,
    graphHint:document.querySelector('#treeGraphHint').textContent,
    focus:document.querySelector('#treeFocus').checked,
    note:box.querySelector('.tree-view-note')?.textContent.replace(/\s+/g,' ').trim(),
    depths:[...box.querySelectorAll('.tree-lane')].map(x=>[x.dataset.depth,x.querySelector('h3')?.textContent]),
    nodes:nodes.map(n=>({
     id:n.dataset.treeId,
     label:n.getAttribute('aria-label'),
     classes:[...n.classList].join(' '),
     text:n.querySelector('strong')?.textContent,
     smalls:[...n.querySelectorAll('small')].map(s=>s.textContent),
     quick:[...n.querySelectorAll('[data-quick-link]')].map(x=>[x.dataset.quickLink,x.getAttribute('aria-label'),x.title,x.textContent])
    })),
    paths:[...box.querySelectorAll('#treeEdges path.tree-edge')]
      .map(p=>[p.getAttribute('class'),p.getAttribute('marker-end')]),
    editor:document.querySelector('#treeEditor').querySelector('h3')?.textContent || 'Select a skill',
    order:data.order,graphs:data.treeGraphs,
    historyCount:data.history.length
   };
  });
 }
 const result={initial:await snapshot()};
 assert.ok(result.initial.nodes.length>0,'Tree must contain nodes');
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-tree.png')});
 const first=result.initial.nodes[0].id;
 await page.locator('#treeCanvas [data-tree-id="'+first+'"]').click();
 await page.waitForTimeout(150);
 result.selected=await snapshot();
 assert.equal(result.selected.editor,'Edit requirement');
 assert.ok(result.selected.nodes.some(n=>n.id===first&&n.classes.includes('active')));
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-selected.png')});
 await page.locator('#treeFocus').check();
 await page.waitForTimeout(150);
 result.focused=await snapshot();
 assert.ok(result.focused.nodes.length<=result.selected.nodes.length);
 await page.locator('#treeFocus').uncheck();
 await page.waitForTimeout(130);

 // The first eligible quick action exercises the original graph mutation code.
 const action=page.locator('#treeCanvas [data-quick-link="parent"]').first();
 if(await action.count()){
  await action.click();
  await page.waitForTimeout(150);
 }
 result.afterQuickLink=await snapshot();

 // Same-depth dragging must save ordering, without altering Scout progress.
 const lanes=page.locator('#treeCanvas .tree-lane');
 const n=await lanes.count();
 let dragged=false;
 for(let i=0;i<n;i++){
  const cards=lanes.nth(i).locator('.tree-node');
  if(await cards.count()>=2){
   await cards.nth(1).dragTo(cards.nth(0));
   await page.waitForTimeout(170);dragged=true;break;
  }
 }
 result.dragged=dragged;
 result.afterDrag=await snapshot();

 const treeOptions=await page.locator('#treeSelect option').evaluateAll(
   options=>options.map(o=>o.value));
 const tag=treeOptions.find(t=>t.startsWith('tag::'));
 if(tag){
  await page.locator('#treeSelect').selectOption(tag);
  await page.waitForTimeout(120);
  result.tag=await snapshot();
  assert.equal(result.tag.graphDisabled,true);
 }
 const named=treeOptions.find(t=>!t.startsWith('tag::')&&t!==result.initial.tree);
 if(named){
  await page.locator('#treeSelect').selectOption(named);
  await page.waitForTimeout(130);
  result.otherTree=await snapshot();
 }
 await page.locator('#treeSelect').selectOption(result.initial.tree);
 await page.waitForTimeout(120);
 await page.locator('#treeGraphMode').selectOption('custom');
 await page.waitForTimeout(140);
 result.custom=await snapshot();
 assert.equal(result.custom.graphMode,'custom');
 await page.locator('#treeGraphMode').selectOption('master');
 await page.waitForTimeout(140);
 result.master=await snapshot();
 assert.equal(result.master.graphMode,'master');
 const savedProgress=await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords);
 assert.equal(savedProgress['Example Scout::s1-camping-i-know-about-the-buddy-system'].completed,true);
 assert.deepEqual(errors,[],'Browser page errors in '+mode+' mode');
 await page.close();
 return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const original=await inspect(browser,'legacy',viewport);
   const vue=await inspect(browser,'vue',viewport);
   assert.deepEqual(vue,original,'Vue tree canvas diverged from original at '+viewport.width+'px');
   console.log('Tree canvas parity '+viewport.width+'px: selection, quick links, focus, drag, tag/custom/master');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
