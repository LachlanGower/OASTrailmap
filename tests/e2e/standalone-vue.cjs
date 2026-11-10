// Local-only Vue acceptance tests. No Actions workflow or real Scout data.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const XLSX=require('xlsx');
const base=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const requirements=require('../../data/requirements.json').requirements;
(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[],requests=[];page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
 try{
  await page.goto(base);await page.getByRole('heading',{name:'Trailmap',exact:true}).waitFor();await page.locator('.requirement').first().waitFor();
  assert.equal(await page.locator('.requirement').count(),142);assert.equal(await page.locator('#trailWorkspace,#treeStudio,#scheduleStudio').count(),0);
  assert.ok(!requests.some(url=>/\/js\/(app|studio|forecast|data-manager)\.js/.test(url)),'Root loaded a legacy UI script');
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[],'Initial load wrote browser records');
  await page.getByLabel('Add Scout',{exact:true}).fill('Synthetic Browser Scout');await page.getByRole('button',{name:'Add Scout',exact:true}).click();
  await page.locator('.requirement').first().click();const id=await page.locator('.detail>small').innerText();
  await page.locator('.detail').getByLabel('Synthetic Browser Scout',{exact:true}).check();
  const records=await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords);assert.ok(Object.entries(records).some(([key,v])=>key.startsWith('Synthetic Browser Scout::')&&v.completed));
  await page.reload();await page.locator('.requirement').first().waitFor();assert.equal(await page.locator('.requirement.complete').count(),1);
  await page.getByRole('link',{name:'Scheduler',exact:true}).click();await page.getByLabel('Weeks',{exact:true}).fill('4');await page.getByRole('button',{name:'Generate schedule',exact:true}).click();
  assert.equal(await page.locator('.week-grid article').count(),0,'Preview applied schedule early');await page.getByRole('button',{name:'Apply proposed schedule'}).click();assert.equal(await page.locator('.week-grid article').count(),4);
  await page.locator('.week-grid article').first().getByLabel('Lock',{exact:true}).check();
  const locked=await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-studio-v1')).schedule[0]);
  await page.getByRole('button',{name:'Regenerate unlocked',exact:true}).click();await page.getByRole('button',{name:'Apply proposed schedule'}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-studio-v1')).schedule[0]),locked);
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),records,'Scheduling changed evidence');
  await page.getByRole('link',{name:'Data & State',exact:true}).click();
  const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Export full',exact:true}).click();const download=await downloadPromise;const backup=JSON.parse(fs.readFileSync(await download.path(),'utf8'));assert.equal(backup.requirements.length,142);
  // Progress import preview is read-only until the explicit apply action.
  await page.getByLabel(/Dataset/).selectOption('progress');const incoming={format:'oas-trailmap-progress',schema_version:1,scoutRecords:{'Synthetic Imported Scout::__roster__':{completed:false}}};
  await page.getByLabel('Choose JSON / YAML / OAS CSV').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});
  assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),records);await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),incoming.scoutRecords);
  await page.getByRole('button',{name:'Review restore',exact:true}).first().click();await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),records);
  // Decode a real workbook, review, then merge without erasing earlier evidence.
  const wb=XLSX.utils.book_new(),req=requirements.find(r=>r.stage===1&&r.stream==='Camping');XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['','','Synthetic XLSX A','Synthetic XLSX B'],['Do',req.text,'15/01/2026','']]),'Stage 1 Camping');
  await page.getByLabel('Original Scout progress workbook').setInputFiles({name:'fictional.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:XLSX.write(wb,{type:'buffer',bookType:'xlsx'})});await page.getByRole('heading',{name:'Workbook import preview'}).waitFor();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),records);await page.getByRole('button',{name:'Apply import',exact:true}).click();
  const afterBook=await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords);assert.equal(afterBook['Synthetic XLSX A::'+req.id].date,'2026-01-15');for(const [key,value] of Object.entries(records))assert.deepEqual(afterBook[key],value);
  // Full reset is checkpointed and restores the precise evidence via the same preview path.
  await page.getByLabel('Reset operation').selectOption('factory');await page.getByLabel('Type RESET to apply').fill('RESET');await page.getByRole('button',{name:'Apply reset',exact:true}).click();await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords).length===0);assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),{});
  await page.getByRole('button',{name:'Review restore',exact:true}).first().click();await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords),afterBook);
  for(const route of ['Skill Trees','Activities','Weekly Themes','Requirements Tracker','Application Requirements','Help','Trailmap']){await page.getByRole('link',{name:route,exact:true}).first().click();await page.getByRole('heading',{name:route,exact:true,level:1}).waitFor();}
  await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/vue-mobile.png',fullPage:false});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');
  await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/vue-desktop.png',fullPage:false});
  // A second comparison tab changing data must block stale writes in Vue.
  const other=await context.newPage();await other.goto(base);await other.locator('.requirement').first().waitFor();await other.evaluate(()=>localStorage.setItem('oas-studio-v1',JSON.stringify({...JSON.parse(localStorage.getItem('oas-studio-v1')),crossTabSentinel:true})));await page.getByRole('alert').filter({hasText:'Another tab changed'}).waitFor();await page.getByLabel('Add Scout',{exact:true}).fill('Should Not Save');await page.getByRole('button',{name:'Add Scout',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords['Should Not Save::__roster__']),undefined);await other.close();
  // Verify Vue/Vite applies a CSS change without reloading or losing in-memory selection.
  if(process.env.OAS_TEST_HMR==='1'){
   const file=path.resolve('src/styles/app.css'),original=fs.readFileSync(file,'utf8');
   try{fs.appendFileSync(file,'\nbody{--oas-hmr-probe:ready}\n');await page.waitForFunction(()=>getComputedStyle(document.body).getPropertyValue('--oas-hmr-probe').trim()==='ready');assert.equal(await page.getByLabel('Add Scout',{exact:true}).inputValue(),'Should Not Save');}finally{fs.writeFileSync(file,original);}
  }
  assert.deepEqual(errors,[]);console.log('Vue browser acceptance passed: root ownership, 142 IDs, evidence reload, scheduler locks, preview/apply, backup, XLSX, reset/recovery, routes, mobile, cross-tab safety'+(process.env.OAS_TEST_HMR==='1'?', hot reload':'')+'.');
 }catch(error){fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/vue-failure.png',fullPage:true});console.error('Browser errors:',errors);throw error;}finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
