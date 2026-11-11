// Local-only acceptance: all browser contexts and workbooks use fictional Scouts.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const XLSX=require('xlsx');
const base=process.env.OAS_TEST_URL||'http://127.0.0.1:5173/';
const requirements=require('../../data/requirements.json').requirements;
const sections={Planner:['Trailmap','Scheduler','Activity Studio'],'Curriculum Mapping':['Skill Trees','Weekly Themes','Requirements Tracker'],'Data and State':['Monitoring','Importer','Exporter','Recovery and reset'],Help:['Help docs','Application Requirements','Future state']};

(async()=>{
 const browser=await chromium.launch({headless:true});
 const context=await browser.newContext({viewport:{width:1440,height:1000}});
 const page=await context.newPage(),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(String(e)));page.on('request',r=>requests.push(r.url()));
 const savedRecords=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords);
 async function setCompletion(scout,value){const row=page.locator('.detail .scout-evidence-row').filter({hasText:scout});if(!await row.evaluate(node=>node.open))await row.locator('summary').click();await row.getByRole('checkbox',{name:scout,exact:true}).setChecked(value);}
 const savedWeeks=()=>page.evaluate(()=>JSON.parse(localStorage.getItem('oas-studio-v1')).schedule);
 async function visit(tab){
  const section=Object.keys(sections).find(s=>sections[s].includes(tab));
  await page.getByRole('navigation',{name:'Main sections',exact:true}).getByRole('link',{name:section,exact:true}).click();
  await page.getByRole('navigation',{name:'Workspaces',exact:true}).getByRole('link',{name:tab,exact:true}).click();
  await page.getByRole('heading',{name:tab,exact:true,level:1}).waitFor();
 }
 function workbook(names,date=''){
  const wb=XLSX.utils.book_new(),r=requirements.find(r=>r.stage===1&&r.stream==='Camping');
  XLSX.utils.book_append_sheet(wb,XLSX.utils.aoa_to_sheet([['','',...names],['Do',r.text,date,'']]),'Stage 1 Camping');
  return {name:'fictional.xlsx',mimeType:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',buffer:XLSX.write(wb,{type:'buffer',bookType:'xlsx'})};
 }
 async function uploadBook(file){
  await page.getByLabel('Dataset',{exact:true}).selectOption('workbook'); await page.getByLabel('Choose original Scout progress workbook (.xlsx)',{exact:true}).setInputFiles(file);
  await page.getByRole('heading',{name:'Workbook import preview'}).waitFor();
 }
 try{
  await page.goto(base);await page.locator('.requirement').first().waitFor();
  assert.equal(await page.locator('.requirement').count(),142);
  assert.deepEqual(await page.getByRole('navigation',{name:'Main sections',exact:true}).getByRole('link').allTextContents(),Object.keys(sections));
  assert.equal(await page.locator('#trailWorkspace,#treeStudio,#scheduleStudio').count(),0);
  assert.ok(!requests.some(url=>/\/js\/(app|studio|forecast|data-manager)\.js/.test(url)));
  assert.deepEqual(await page.evaluate(()=>Object.keys(localStorage)),[]);
  assert.equal(await page.getByLabel('Add Scout',{exact:true}).count(),0,'Scout scope must not ask users to type names');
  for(const column of await page.locator('.stage-column').all())assert.deepEqual(await column.locator('.stream-group').evaluateAll(nodes=>nodes.map(n=>n.dataset.stream)),['Camping','Bushwalking','Bushcraft']);
  assert.ok(!(await page.locator('.requirement').first().innerText()).includes(requirements[0].id),'Card broadcasts its ID');
  assert.equal(await page.locator('.requirement .progress-mark').count(),142);
  assert.ok(await page.locator('.filter-panel').isVisible());
  // Import an empty-evidence roster; choose existing Scouts using the picker.
  await visit('Importer');await uploadBook(workbook(['Synthetic Browser Scout','Synthetic Second Scout']));
  await page.getByRole('button',{name:'Apply import',exact:true}).click();
  await visit('Trailmap');await page.getByRole('combobox',{name:'Scout scope',exact:true}).selectOption('__subset__');
  await page.getByRole('group',{name:'Select imported Scouts'}).getByLabel('Synthetic Browser Scout',{exact:true}).check();
  await page.getByRole('combobox',{name:'Scout scope',exact:true}).selectOption('Synthetic Browser Scout');
  await page.locator('.requirement').first().click();await setCompletion('Synthetic Browser Scout',true);
  const records=await savedRecords();assert.ok(Object.entries(records).some(([key,v])=>key.startsWith('Synthetic Browser Scout::')&&v.completed));
  await page.reload();await page.locator('.requirement').first().waitFor();await page.getByRole('combobox',{name:'Scout scope',exact:true}).selectOption('Synthetic Browser Scout');
  assert.equal(await page.locator('.requirement.complete').count(),1);
  await page.locator('.requirement').first().click();await visit('Scheduler');assert.equal(await page.locator('.detail').count(),0,'Editor survived a tab change');
  assert.equal(await page.getByText('Forecast and planned opportunities',{exact:true}).count(),0);
  await page.getByLabel('Weeks',{exact:true}).fill('4');await page.getByRole('button',{name:'Generate schedule',exact:true}).click();
  assert.equal(await page.locator('.week-grid>article').count(),0);await page.getByRole('button',{name:'Apply proposed schedule'}).click();assert.equal(await page.locator('.week-grid>article').count(),4);
  await page.getByRole('button',{name:'Lock Week 1',exact:true}).click();
  const locked=(await savedWeeks())[0];await page.getByRole('button',{name:'Regenerate unlocked',exact:true}).click();await page.getByRole('button',{name:'Apply proposed schedule'}).click();assert.deepEqual((await savedWeeks())[0],locked);
  // Theme changes preview, allow intentional replacement of locked weeks and preserve other weeks/evidence.
  const theme=requirements[0].tags[0],beforeTheme=await savedWeeks();
  await page.getByRole('combobox',{name:'Week 1 theme',exact:true}).selectOption(theme);
  await page.locator('.week-grid>article').first().getByRole('button',{name:'Preview themed week',exact:true}).click();
  assert.deepEqual(await savedWeeks(),beforeTheme,'Theme preview wrote the schedule');
  await page.getByRole('button',{name:'Apply theme and lock week',exact:true}).click();
  const themed=await savedWeeks();assert.equal(themed[0].theme,theme);assert.equal(themed[0].locked,true);assert.deepEqual(themed.slice(1),beforeTheme.slice(1));assert.deepEqual(await savedRecords(),records);
  await visit('Requirements Tracker');assert.equal(await page.locator('.coverage-summary .coverage-stat').count(),4);assert.equal(await page.locator('.coverage-table thead th').count(),6);assert.equal(await page.locator('.coverage-table tbody tr').count(),142);
  await page.getByLabel('Coverage status',{exact:true}).selectOption('complete');assert.equal(await page.locator('.coverage-table tbody tr').count(),1);await page.getByLabel('Coverage status',{exact:true}).selectOption('');
  await page.getByLabel('Tracker stream',{exact:true}).selectOption('Camping');assert.equal(await page.locator('.coverage-table tbody tr').count(),requirements.filter(r=>r.stream==='Camping').length);
  await page.screenshot({path:'test-results/vue-monitoring.png',fullPage:false});
  await visit('Exporter');assert.equal(await page.getByLabel('Original Scout progress workbook').count(),0);
  const downloading=page.waitForEvent('download');await page.getByRole('button',{name:'Export full',exact:true}).click();const backup=JSON.parse(fs.readFileSync(await (await downloading).path(),'utf8'));assert.equal(backup.requirements.length,142);
  await visit('Importer');assert.equal(await page.getByRole('button',{name:'Export full',exact:true}).count(),0);
  await page.getByLabel(/Dataset/).selectOption('progress');const incoming={format:'oas-trailmap-progress',schema_version:1,scoutRecords:{'Synthetic Imported Scout::__roster__':{completed:false}}};
  await page.getByLabel('Choose JSON / YAML / OAS CSV').setInputFiles({name:'progress.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(incoming))});assert.deepEqual(await savedRecords(),records);
  await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await savedRecords(),incoming.scoutRecords);
  await visit('Recovery and reset');await page.getByRole('button',{name:'Review restore',exact:true}).first().click();await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await savedRecords(),records);
  await visit('Importer');await uploadBook(workbook(['Synthetic XLSX A','Synthetic XLSX B'],'15/01/2026'));assert.deepEqual(await savedRecords(),records);await page.getByRole('button',{name:'Apply import',exact:true}).click();
  const afterBook=await savedRecords(),firstId=requirements.find(r=>r.stage===1&&r.stream==='Camping').id;assert.equal(afterBook['Synthetic XLSX A::'+firstId].date,'2026-01-15');for(const [key,value] of Object.entries(records))assert.deepEqual(afterBook[key],value);
  await visit('Recovery and reset');await page.getByLabel('Reset operation').selectOption('factory');await page.getByLabel('Type RESET to apply').fill('RESET');await page.getByRole('button',{name:'Apply reset',exact:true}).click();await page.waitForFunction(()=>Object.keys(JSON.parse(localStorage.getItem('oas-trailmap-v1')).scoutRecords).length===0);
  await page.getByRole('button',{name:'Review restore',exact:true}).first().click();await page.getByRole('button',{name:'Apply import',exact:true}).click();assert.deepEqual(await savedRecords(),afterBook);
  for(const tab of Object.values(sections).flat())await visit(tab);
  await visit('Help docs');await page.getByLabel('Search help').fill('Choosing Scouts');await page.getByRole('heading',{name:'Choosing Scouts',exact:true}).waitFor();
  await visit('Trailmap');await page.setViewportSize({width:390,height:844});await page.screenshot({path:'test-results/vue-mobile.png',fullPage:false});assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Mobile horizontal overflow');
  await visit('Requirements Tracker');assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Tracker table broke mobile layout');
  await visit('Trailmap');await page.setViewportSize({width:1440,height:1000});await page.screenshot({path:'test-results/vue-desktop.png',fullPage:false});
  const other=await context.newPage();await other.goto(base);await other.locator('.requirement').first().waitFor();await other.evaluate(()=>localStorage.setItem('oas-studio-v1',JSON.stringify({...JSON.parse(localStorage.getItem('oas-studio-v1')),crossTabSentinel:true})));await page.getByRole('alert').filter({hasText:'Another tab changed'}).waitFor();await page.locator('.requirement').first().click();await setCompletion('Synthetic Browser Scout',false);assert.deepEqual(await savedRecords(),afterBook);await other.close();
  if(process.env.OAS_TEST_HMR==='1'){
   const file=path.resolve('src/styles/app.css'),original=fs.readFileSync(file,'utf8');await page.getByRole('combobox',{name:'Scout scope',exact:true}).selectOption('Synthetic Browser Scout');
   try{fs.appendFileSync(file,'\nbody{--oas-hmr-probe:ready}\n');await page.waitForFunction(()=>getComputedStyle(document.body).getPropertyValue('--oas-hmr-probe').trim()==='ready');assert.equal(await page.getByRole('combobox',{name:'Scout scope',exact:true}).inputValue(),'Synthetic Browser Scout');}finally{fs.writeFileSync(file,original);}
  }
  assert.deepEqual(errors,[]);console.log('Vue acceptance passed: four-section navigation, imported Scout picker, stream grouping, icons, editor cleanup, scheduler locks and theme previews, original-style tracker, data tabs, backup/XLSX/reset/recovery, help, mobile and cross-tab safety'+(process.env.OAS_TEST_HMR==='1'?', hot reload':'')+'.');
 }catch(error){fs.mkdirSync('test-results',{recursive:true});await page.screenshot({path:'test-results/vue-failure.png',fullPage:true});console.error('Browser errors:',errors);throw error;}finally{await context.close();await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
