/* Golden-master editor parity. All progress is from fictional fixture only. */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4d3');
fs.mkdirSync(OUT,{recursive:true});

async function inspect(browser,mode,viewport){
 const page=await browser.newPage({viewport});
 const errors=[];
 page.on('pageerror',error=>errors.push(error.message));
 page.on('dialog',dialog=>dialog.accept());
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
  status:200,contentType:'application/javascript',body:''
 }));
 const url=new URL(ROOT);
 if(mode==='legacy')url.searchParams.set('treeEditorRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{
  for(const [key,value] of Object.entries(storage))
   localStorage.setItem(key,JSON.stringify(value));
 },fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#treeCanvas .tree-lanes')&&
  typeof window.__oasTreeEditorSnapshot==='function',{timeout:20000});
 if(mode==='vue')await page.waitForFunction(
  ()=>document.documentElement.dataset.oasTreeEditorRenderer==='vue',{timeout:20000});
 else assert.notEqual(await page.locator('html').getAttribute('data-oas-tree-editor-renderer'),'vue');
 await page.waitForFunction(()=>document.documentElement.dataset.oasNavRenderer==='vue' ||
  typeof document.querySelector('[data-mode="tree"]')?.onclick==='function');
 await page.locator('[data-mode="tree"]').click();
 await page.waitForFunction(()=>!document.querySelector('#treeStudio').hidden);
 const settle=()=>page.waitForTimeout(130);

 const snapshot=()=>page.evaluate(()=>{
  const form=document.querySelector('#editTreeForm');
  const values=name=>[...form?.querySelectorAll('[name="'+name+'"]')||[]]
    .filter(x=>x.type!=='checkbox'||x.checked).map(x=>x.value);
  const progress=JSON.parse(localStorage.getItem('oas-trailmap-v1'));
  const studio=JSON.parse(localStorage.getItem('oas-studio-v1'));
  const chosen=window.__oasTreeEditorSnapshot();
  const req=requirements.find(r=>r.id===chosen.id);
  return {
   selected:chosen.id,custom:chosen.custom,mode:document.querySelector('#treeGraphMode').value,
   title:document.querySelector('#treeEditor h3')?.textContent??null,
   scope:document.querySelector('#treeEditor .tiny.muted')?.textContent??null,
   empty:!form?document.querySelector('#treeEditor').textContent.trim():null,
   names:[...form?.querySelectorAll('[name]')||[]].reduce((counts,e)=>{
    counts[e.name]=(counts[e.name]||0)+1;return counts;
   },{}),
   text:values('text')[0]??null,
   description:values('description')[0]??null,
   tree:values('tree')[0]??null,stage:values('stage')[0]??null,
   preferred:values('preferredLocation')[0]??null,
   alternatives:values('alternativeLocation'),
   tags:values('tags'),parents:values('prerequisites'),
   recommended:values('recommended'),
   occurrences:values('requiredOccurrences')[0]??null,
   basis:form?.querySelector('fieldset p')?.textContent??null,
   direct:[...document.querySelectorAll('#treeEditor [data-break-child]')]
    .map(x=>[x.dataset.breakChild,x.dataset.breakParent,x.getAttribute('aria-label')]),
   requirement:req?{
    id:req.id,text:req.text,description:req.description,tree:req.tree,
    tags:req.tags,prerequisites:req.prerequisites,
    suggested_links:req.suggested_links,locations:req.locations,
    required_occurrences:req.required_occurrences,
    occurrence_basis:req.occurrence_basis
   }:null,
   historyTitles:studio.history.map(h=>h.title),
   treeGraphs:studio.treeGraphs,
   savedScoutRecords:progress.scoutRecords
  };
 });
 const result={empty:await snapshot()};
 assert.ok(result.empty.empty?.includes('Select a skill'));
 const chosenId=await page.locator('#treeCanvas .tree-node').first().getAttribute('data-tree-id');
 await page.locator('#treeCanvas .tree-node').first().click();
 await page.waitForSelector('#editTreeForm');
 await settle();
 result.selected=await snapshot();
 assert.equal(result.selected.selected,chosenId);
 assert.equal(result.selected.title,'Edit requirement');
 assert.equal(result.selected.names.stage,1);
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-editor.png')});

 const originalScouts=JSON.stringify(result.selected.savedScoutRecords);
 await page.locator('#editTreeForm textarea[name="text"]').fill('Fictional edited skill');
 await page.locator('#editTreeForm textarea[name="description"]').fill('Fictional detailed description.');
 await page.locator('#editTreeForm input[name="requiredOccurrences"]').fill('3');
 const tag=page.locator('#editTreeForm input[name="tags"]:not(:checked)').first();
 if(await tag.count())await tag.check();
 const alternative=page.locator('#editTreeForm input[name="alternativeLocation"]:not(:checked)').first();
 if(await alternative.count())await alternative.check();
 const preferred=page.locator('#editTreeForm [name="preferredLocation"]');
 const locs=await preferred.locator('option').evaluateAll(nodes=>nodes.map(o=>o.value));
 if(locs.length>1)await preferred.selectOption(locs[1]);
 await page.locator('#editTreeForm button[type="submit"]').click();
 await settle();
 result.saved=await snapshot();
 assert.equal(result.saved.requirement.text,'Fictional edited skill');
 assert.equal(result.saved.requirement.description,'Fictional detailed description.');
 assert.equal(result.saved.requirement.required_occurrences,3);
 assert.equal(result.saved.requirement.occurrence_basis,'leader-reviewed');
 assert.deepEqual(result.saved.savedScoutRecords,result.selected.savedScoutRecords,
  'Editing curriculum must not award Scout progress');
 assert.ok(result.saved.historyTitles.length>result.selected.historyTitles.length);

 // Reject a mandatory cycle before making any further checkpoint.
 const pair=await page.evaluate(()=>{
  const child=requirements.find(r=>r.prerequisites?.length&&
    requirements.some(x=>x.id===r.prerequisites[0]));
  return child?{child:child.id,parent:child.prerequisites[0]}:null;
 });
 if(pair){
  await page.evaluate(id=>window.__oasTreeSelect(id),pair.parent);
  await page.waitForSelector('#editTreeForm');
  const check=page.locator('#editTreeForm input[name="prerequisites"]')
   .filter({has:page.locator('nothing')});
  const candidate=page.locator('#editTreeForm input[name="prerequisites"]')
   .and(page.locator('[value="'+pair.child+'"]'));
  await candidate.check();
  const before=await snapshot();
  await page.locator('#editTreeForm button[type="submit"]').click();
  await settle();
  const after=await snapshot();
  assert.deepEqual(after.historyTitles,before.historyTitles,
   'Rejected cyclic edit must not checkpoint');
  assert.deepEqual(after.requirement,before.requirement,
   'Rejected cyclic edit must not mutate requirement');
  result.cycle={parent:pair.parent,child:pair.child,rejected:true};
 }

 // Custom graph edits must not mutate mandatory/master requirement links.
 await page.locator('#treeSelect').selectOption(result.selected.tree);
 await settle();
 await page.locator('#treeGraphMode').selectOption('custom');
 await settle();
 await page.evaluate(id=>window.__oasTreeSelect(id),chosenId);
 await page.waitForSelector('#editTreeForm');
 const beforeCustom=await snapshot();
 const recommended=page.locator('#editTreeForm input[name="recommended"]:not(:checked)').first();
 if(await recommended.count())await recommended.check();
 await page.locator('#editTreeForm button[type="submit"]').click();
 await settle();
 const afterCustom=await snapshot();
 assert.deepEqual(afterCustom.requirement.prerequisites,beforeCustom.requirement.prerequisites);
 assert.ok(afterCustom.treeGraphs[result.selected.tree]?.mode==='custom');
 result.custom={before:beforeCustom,after:afterCustom};

 await page.locator('#treeGraphMode').selectOption('master');
 await settle();
 result.master=await snapshot();

 // Undo the latest requirement edit using original snapshot restore route.
 const priorHistory=await snapshot();
 if(priorHistory.historyTitles.length){
  await page.locator('#undoLastEdit').click();
  await settle();
  result.undo=await snapshot();
  assert.equal(result.undo.historyTitles.length,priorHistory.historyTitles.length-1);
 }
 assert.deepEqual(errors,[],'Uncaught browser error in '+mode);
 await page.close();
 return result;
}

(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const old=await inspect(browser,'legacy',viewport);
   const modern=await inspect(browser,'vue',viewport);
   assert.deepEqual(modern,old,'Tree editor Vue/legacy diverged at '+viewport.width+'px');
   console.log('Tree editor parity '+viewport.width+'px: save, cycle, master/custom, undo');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
