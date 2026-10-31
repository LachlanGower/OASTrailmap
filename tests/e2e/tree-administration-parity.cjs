/* Fictional-content golden-master browser regression for tree admin and YAML
 * import/export. Never commit or upload actual Scout files.
 */
'use strict';
const assert=require('node:assert/strict');
const {chromium}=require('playwright');
const fs=require('node:fs');
const path=require('node:path');
const fixture=require('../fixtures/legacy-state.synthetic.json');
const ROOT=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const OUT=path.resolve('tests/baseline-artifacts/phase4d4');
fs.mkdirSync(OUT,{recursive:true});

async function inspect(browser,mode,viewport) {
 const page=await browser.newPage({viewport,acceptDownloads:true});
 const errors=[],prompts=[],alerts=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('dialog',async dialog=>{
  if(dialog.type()==='prompt') {
   assert.ok(prompts.length,'Unexpected prompt: '+dialog.message());
   await dialog.accept(prompts.shift());
  } else if(dialog.type()==='confirm') await dialog.accept();
  else { alerts.push(dialog.message());await dialog.dismiss(); }
 });
 await page.route('https://cdn.jsdelivr.net/**',r=>r.fulfill({
  status:200,contentType:'application/javascript',body:''
 }));
 const url=new URL(ROOT);
 if(mode==='legacy')url.searchParams.set('treeAdminRenderer','legacy');
 await page.goto(url.toString(),{waitUntil:'domcontentloaded'});
 await page.evaluate(storage=>{
  for(const [key,value] of Object.entries(storage))
   localStorage.setItem(key,JSON.stringify(value));
 },fixture.storage);
 await page.reload({waitUntil:'domcontentloaded'});
 await page.waitForFunction(()=>document.querySelector('#treeSelect')?.options.length>0 &&
   typeof document.querySelector('#importRequirements')?.onchange==='function'||
   document.documentElement.dataset.oasTreeAdminRenderer==='vue',
  {timeout:20000});
 if(mode==='vue')await page.waitForFunction(
  ()=>document.documentElement.dataset.oasTreeAdminRenderer==='vue',{timeout:20000});
 else assert.notEqual(await page.locator('html').getAttribute('data-oas-tree-admin-renderer'),'vue');
 await page.waitForFunction(()=>document.documentElement.dataset.oasNavRenderer==='vue' ||
  typeof document.querySelector('[data-mode="tree"]')?.onclick==='function',{timeout:20000});
 await page.locator('[data-mode="tree"]').click();
 await page.waitForFunction(()=>!document.querySelector('#treeStudio').hidden);
 const settle=()=>page.waitForTimeout(100);
 const snapshot=()=>page.evaluate(()=>{
  const studio=JSON.parse(localStorage.getItem('oas-studio-v1'));
  const scout=JSON.parse(localStorage.getItem('oas-trailmap-v1'));
  const panel=document.querySelector('#historyPanel');
  return {
   tree:document.querySelector('#treeSelect')?.value,
   options:[...document.querySelectorAll('#treeSelect option')].map(o=>[o.value,o.textContent]),
   graphMode:document.querySelector('#treeGraphMode')?.value,
   graphDisabled:document.querySelector('#treeGraphMode')?.disabled,
   graphHint:document.querySelector('#treeGraphHint')?.textContent,
   renameDisabled:document.querySelector('#renameTree')?.disabled,
   historyHidden:panel.hidden,
   history:[...panel.querySelectorAll('[data-rollback]')].map(e=>e.parentNode.querySelector('span')?.firstChild?.textContent.trim()),
   trees:studio.trees,tags:studio.tags,order:studio.order,
   graphs:studio.treeGraphs,
   historyTitles:studio.history.map(h=>h.title),
   scoutRecords:scout.scoutRecords,
   sourceReqCount:requirements.length,
   firstRequirement:{id:requirements[0].id,text:requirements[0].text,description:requirements[0].description}
  };
 });
 const result={initial:await snapshot()};
 const initialScout=result.initial.scoutRecords;
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-admin.png')});
 // Keep the exact original prompt-confirmation workflow; Vue supplies controls.
 prompts.push('Fictional New Tree');
 await page.locator('#newTree').click();
 await settle();
 result.created=await snapshot();
 assert.equal(result.created.tree,'Fictional New Tree');
 assert.ok(result.created.trees.includes('Fictional New Tree'));

 prompts.push('Fictional Renamed Tree');
 await page.locator('#renameTree').click();
 await settle();
 result.renamed=await snapshot();
 assert.equal(result.renamed.tree,'Fictional Renamed Tree');
 assert.ok(!result.renamed.trees.includes('Fictional New Tree'));

 prompts.push('fictional-new-tag');
 await page.locator('#manageTags').click();
 await settle();
 result.newTag=await snapshot();
 assert.ok(result.newTag.tags.includes('fictional-new-tag'));

 const tagView='tag::fictional-new-tag';
 await page.locator('#treeSelect').selectOption(tagView);
 await settle();
 result.tagView=await snapshot();
 assert.equal(result.tagView.graphDisabled,true);
 assert.equal(result.tagView.graphMode,'master');
 assert.equal(result.tagView.renameDisabled,true);
 await page.locator('#treeSelect').selectOption('Camping');
 await settle();

 prompts.push('Leader checkpoint example');
 await page.locator('#treeSnapshot').evaluate(node=>node.click());
 await settle();
 result.checkpoint=await snapshot();
 assert.ok(result.checkpoint.historyTitles.includes('Leader checkpoint example'));

 await page.locator('#historyBtn').evaluate(node=>node.click());
 await settle();
 result.openHistory=await snapshot();
 assert.equal(result.openHistory.historyHidden,false);
 assert.ok(result.openHistory.history.includes('Leader checkpoint example'));
 await page.screenshot({path:path.join(OUT,mode+'-'+viewport.width+'-history.png')});

 prompts.push('temporary-tag-after-checkpoint');
 await page.locator('#manageTags').click();
 await settle();
 result.afterTag=await snapshot();
 assert.ok(result.afterTag.tags.includes('temporary-tag-after-checkpoint'));
 await page.locator('#historyBtn').evaluate(node=>node.click());
 await page.locator('#historyBtn').evaluate(node=>node.click());
 await settle();
 const checkpoint=page.locator('#historyPanel .history-line')
  .filter({hasText:'Leader checkpoint example'}).locator('[data-rollback]');
 await checkpoint.click();
 await settle();
 result.restored=await snapshot();
 assert.equal(result.restored.historyHidden,true);
 assert.ok(!result.restored.tags.includes('temporary-tag-after-checkpoint'));
 assert.deepEqual(result.restored.scoutRecords,initialScout);

 // The legacy schema-v3 YAML download is valid JSON when the optional
 // js-yaml CDN is intentionally unavailable in the CI browser.
 const [download]=await Promise.all([
  page.waitForEvent('download'),page.locator('#exportRequirements').evaluate(node=>node.click())
 ]);
 assert.equal(download.suggestedFilename(),'requirements.json');
 const chunks=[],stream=await download.createReadStream();
 for await(const chunk of stream)chunks.push(Buffer.from(chunk));
 const exported=JSON.parse(Buffer.concat(chunks).toString('utf8'));
 assert.equal(exported.schema_version,3);
 assert.ok(Array.isArray(exported.requirements));
 assert.ok(exported.tree_graphs && Array.isArray(exported.tree_registry));
 result.export={schema_version:exported.schema_version,
  requirementIds:exported.requirements.map(r=>r.id),
  tree_registry:exported.tree_registry,tag_library:exported.tag_library};

 const beforeInvalid=await snapshot();
 await page.locator('#importRequirements').setInputFiles({
  name:'invalid-fictional.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify({requirements:'invalid'}))
 });
 await settle();
 result.invalid=await snapshot();
 assert.deepEqual(result.invalid.historyTitles,beforeInvalid.historyTitles);
 assert.deepEqual(result.invalid.firstRequirement,beforeInvalid.firstRequirement);
 assert.equal(result.invalid.sourceReqCount,beforeInvalid.sourceReqCount);
 assert.ok(alerts.some(x=>x.includes('Requirements import rejected')));

 // Apply a well-formed fictional edit through the exact import confirmation.
 const replacement=structuredClone(exported);
 replacement.requirements[0].description='Imported fictional description';
 await page.locator('#importRequirements').setInputFiles({
  name:'synthetic-requirements.json',mimeType:'application/json',
  buffer:Buffer.from(JSON.stringify(replacement))
 });
 await page.waitForFunction(()=>requirements[0]?.description==='Imported fictional description');
 result.imported=await snapshot();
 assert.equal(result.imported.firstRequirement.description,'Imported fictional description');
 assert.equal(result.imported.sourceReqCount,exported.requirements.length);
 assert.deepEqual(result.imported.scoutRecords,initialScout);

 await page.locator('#historyBtn').evaluate(node=>node.click());
 await settle();
 const beforeImport=page.locator('#historyPanel .history-line')
  .filter({hasText:'Before YAML import'}).locator('[data-rollback]');
 await beforeImport.click();
 await settle();
 result.importRolledBack=await snapshot();
 assert.deepEqual(result.importRolledBack.firstRequirement,beforeInvalid.firstRequirement);
 assert.deepEqual(result.importRolledBack.scoutRecords,initialScout);
 assert.deepEqual(errors,[],'Uncaught browser errors in '+mode);
 assert.deepEqual(prompts,[],'Every prompt must be handled');
 await page.close();
 return result;
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 try{
  for(const viewport of [{width:1440,height:900},{width:390,height:844}]){
   const old=await inspect(browser,'legacy',viewport);
   const vue=await inspect(browser,'vue',viewport);
   assert.deepEqual(vue,old,'Vue administration and history differ from legacy at '+viewport.width);
   console.log('Tree administration and rollback parity '+viewport.width+'px');
  }
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
