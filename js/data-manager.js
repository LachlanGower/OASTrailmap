/* OAS Trailmap local-first Data & State Manager and Activity Studio.
 * Excel evidence is always imported through the original parser and never auto-cleared.
 */
const DATA_CHECKPOINTS_KEY='oas-data-checkpoints-v1';
const DATA_LOCATION_LIST=['Scout Hall - indoor','Scout Hall - outdoor','Local outdoor area','Campsite','External venue','Flexible / anywhere'];
let dataPending=null;
let dataTagChoice=[];
let dataMatch='any';
const dataClone=x=>JSON.parse(JSON.stringify(x));
function dataStamp(){return new Date().toISOString();}
function dataEncode(x){return window.jsyaml?jsyaml.dump(x,{lineWidth:120,noRefs:true}):JSON.stringify(x,null,2);}
function dataParse(text,name){return /\.json$/i.test(name)?JSON.parse(text):(window.jsyaml?jsyaml.load(text):JSON.parse(text));}
function dataLabel(type){return ({full:'Complete backup',requirements:'Requirements',progress:'Scout progress',activities:'Activities',schedule:'Schedule',trees:'Tree layouts and links'})[type]||type;}
function dataBundle(type){
 if(type==='full')return {format:'oas-trailmap-full-state',schema_version:2,exportedAt:dataStamp(),requirements:dataClone(requirements),scoutRecords:dataClone(scoutRecords),activities:dataClone(activities),studio:dataClone({...studio,history:studio.history.slice(0,10)})};
 if(type==='requirements')return {schema_version:3,requirements:dataClone(requirements),tree_graphs:dataClone(studio.treeGraphs),tree_registry:[...studio.trees],tag_library:[...studio.tags]};
 if(type==='progress')return {format:'oas-trailmap-progress',schema_version:1,scoutRecords:dataClone(scoutRecords)};
 if(type==='activities')return {format:'oas-trailmap-activities',schema_version:2,activities:dataClone(activities)};
 if(type==='schedule')return scheduleExport();
 if(type==='trees')return {format:'oas-trailmap-trees',schema_version:1,trees:[...studio.trees],order:dataClone(studio.order),treeGraphs:dataClone(studio.treeGraphs)};
 throw Error('Unknown dataset');
}
function dataRecordCount(type,d=dataBundle(type)){return type==='full'?Object.keys(d.scoutRecords).length:type==='requirements'?d.requirements.length:type==='progress'?Object.keys(d.scoutRecords).length:type==='activities'?d.activities.length:type==='schedule'?d.weeks.length:d.trees.length;}
function dataValidate(type,x){
 if(!x||typeof x!=='object')throw Error('Expected an object');
 if(type==='full'){
  if(x.format!=='oas-trailmap-full-state'&&x.format!=='oas-trailmap-backup')throw Error('Not an OAS backup');
  dataValidate('requirements',{requirements:x.requirements,tree_graphs:x.studio?.treeGraphs});
  dataValidate('progress',{scoutRecords:x.scoutRecords});
  dataValidate('activities',{activities:x.activities||[]});
  if(x.studio?.schedule?.length)dataValidate('schedule',{format:'oas-trailmap-schedule',weeks:x.studio.schedule});
  return;
 }
 if(type==='requirements'){validateReqs(x.requirements);if(x.tree_graphs)validateTreeGraphs(x.tree_graphs,x.requirements);return;}
 if(type==='progress'){
  if(!x.scoutRecords||typeof x.scoutRecords!=='object'||Array.isArray(x.scoutRecords))throw Error('Invalid Scout progress data');
  for(const [k,v] of Object.entries(x.scoutRecords))if(!k.includes('::')||!v||typeof v.completed!=='boolean')throw Error('Invalid progress record: '+k);
  return;
 }
 if(type==='activities'){
  if(!Array.isArray(x.activities))throw Error('Expected an activities array');
  const ids=new Set(),known=new Set(requirements.map(r=>r.id));
  for(const a of x.activities){
   if(!a||typeof a.id!=='string'||!a.id.trim()||ids.has(a.id))throw Error('Missing or repeated activity ID');
   ids.add(a.id);
   if(!Array.isArray(a.covers)||a.covers.some(id=>!known.has(id)))throw Error('Unknown requirement in activity '+a.id);
   if(a.tags&&!Array.isArray(a.tags))throw Error('Invalid activity tags');
  }
  return;
 }
 if(type==='schedule'){validateSchedule(x);return;}
 if(type==='trees'){
  if(!Array.isArray(x.trees)||!x.order||!x.treeGraphs)throw Error('Invalid tree state');
  validateTreeGraphs(x.treeGraphs,requirements);return;
 }
}
function dataDataset(x,type){if(type==='full'&&x.format==='oas-trailmap-backup')return {...x,studio:null};if(type==='activities'&&Array.isArray(x))return {activities:x};return x;}
function dataCompare(type,next){
 const current=dataBundle(type);
 const arr=t=>type==='requirements'?t.requirements:type==='activities'?t.activities:type==='schedule'?t.weeks:type==='trees'?t.trees.map(id=>({id})):Object.entries(t.scoutRecords||{}).map(([id,value])=>({id,...value}));
 if(type==='full')return {added:0,modified:0,removed:0,description:'Complete local application state will be replaced. A safety checkpoint will be made first.'};
 const a=new Map(arr(current).map(x=>[x.id,JSON.stringify(x)])),b=new Map(arr(next).map(x=>[x.id,JSON.stringify(x)]));
 return {added:[...b.keys()].filter(k=>!a.has(k)).length,modified:[...b].filter(([k,v])=>a.has(k)&&a.get(k)!==v).length,removed:[...a.keys()].filter(k=>!b.has(k)).length};
}
function dataCheckpoints(){try{return JSON.parse(localStorage.getItem(DATA_CHECKPOINTS_KEY)||'[]')}catch{return []}}
function dataCheckpoint(title,types=['full']){
 let list=dataCheckpoints();list.unshift({title,at:dataStamp(),types,payload:dataBundle('full')});
 list=list.slice(0,6);
 try{localStorage.setItem(DATA_CHECKPOINTS_KEY,JSON.stringify(list))}catch(error){throw new Error('Safety checkpoint could not be stored. Export a full backup before proceeding. '+(error?.message||''))}
}
function dataExport(type){const obj=dataBundle(type),ext=['requirements','activities','schedule'].includes(type)?'yaml':'json';download(type==='full'?'oas-trailmap-full-backup.json':type+'-'+(type==='trees'?'layout.':'')+ext,ext==='yaml'?dataEncode(obj):JSON.stringify(obj,null,2),ext==='yaml'?'text/yaml':'application/json')}
function dataShowPreview(type,next,fileName){
 try{next=dataDataset(next,type);dataValidate(type,next)}catch(e){alert('Import rejected: '+e.message);return}
 const d=dataCompare(type,next);dataPending={type,next};
 $('#dataPreview').hidden=false;
 $('#dataPreview').innerHTML='<h3>Review '+esc(dataLabel(type))+' import</h3><p>'+esc(fileName)+' · <b>'+d.added+'</b> added · <b>'+d.modified+'</b> modified · <b>'+d.removed+'</b> removed</p><p>'+esc(d.description||'Only this dataset will be replaced. Scout progress remains unchanged unless you explicitly import Scout progress or a full backup.')+'</p><button class="button primary" id="dataApply">Apply import</button> <button class="button secondary" id="dataCancel">Cancel</button>';
 $('#dataApply').onclick=()=>{try{dataApply(type,next);$('#dataPreview').hidden=true;dataPending=null;dataRender();showToast('Import applied locally.')}catch(e){alert('Could not apply import: '+e.message)}};
 $('#dataCancel').onclick=()=>{dataPending=null;$('#dataPreview').hidden=true};
}
function dataApply(type,x){
 dataCheckpoint('Before importing '+dataLabel(type),[type]);
 if(type==='full'){requirements=dataClone(x.requirements);scoutRecords=dataClone(x.scoutRecords);activities=dataClone(x.activities||[]);if(x.studio)studio={...studio,...dataClone(x.studio)};}
 if(type==='requirements'){
  requirements=dataClone(x.requirements);studio.trees=x.tree_registry||[...new Set(requirements.map(treeFor))];studio.tags=x.tag_library||[...new Set(requirements.flatMap(r=>r.tags||[]))];studio.treeGraphs=dataClone(x.tree_graphs||{});
 }
 if(type==='progress')scoutRecords=dataClone(x.scoutRecords);
 if(type==='activities')activities=dataClone(x.activities);
 if(type==='schedule'){studio.schedule=dataClone(x.weeks);studio.weeks=x.weeks.length;studio.strategy=x.strategy||'progress';studio.capacity=x.capacity||4;}
 if(type==='trees'){studio.trees=dataClone(x.trees);studio.order=dataClone(x.order);studio.treeGraphs=dataClone(x.treeGraphs)}
 save();writeStudio();renderAll();renderTree();renderSchedule();dataRender();
}
function dataRender(){
 const el=$('#dataManager');if(!el)return;
 const types=['requirements','progress','activities','schedule','trees'],numbers=types.map(t=>dataRecordCount(t));
 window.__oasVueDataDashboardRender?.(types.map((type,i)=>({type,label:dataLabel(type),count:numbers[i]})));
 const filter=$('#mainTagFilter'),previous=filter?.value;if(filter){filter.innerHTML='<option value="">All tags</option>'+[...new Set(requirements.flatMap(r=>r.tags||[]))].sort().map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('');filter.value=previous||'';}
 $('#dataStats').innerHTML=types.map((t,i)=>'<div class="data-stat"><strong>'+numbers[i]+'</strong><span>'+dataLabel(t)+'</span></div>').join('');
 $('#dataExports').innerHTML=['full',...types].map(t=>'<button type="button" class="button secondary" data-dexport="'+t+'">Export '+dataLabel(t)+'</button>').join('');
 $('#dataExports').querySelectorAll('[data-dexport]').forEach(b=>b.onclick=()=>dataExport(b.dataset.dexport));
 $('#dataHistory').innerHTML=dataCheckpoints().map((p,i)=>'<div class="mapper-link-row"><span>'+esc(p.title)+' <small>'+esc(new Date(p.at).toLocaleString())+'</small></span><button class="button secondary" data-data-restore="'+i+'">Review restore</button></div>').join('')||'<p class="muted tiny">No checkpoints yet. Automatic checkpoints are created before imports.</p>';
 $('#dataHistory').querySelectorAll('[data-data-restore]').forEach(b=>b.onclick=()=>{const p=dataCheckpoints()[Number(b.dataset.dataRestore)];if(!p)return;const type=p.types.length===1&&p.types[0]!=='full'?p.types[0]:'full';const backup=p.payload;let data=type==='full'?backup:type==='requirements'?{requirements:backup.requirements,tree_graphs:backup.studio?.treeGraphs,tree_registry:backup.studio?.trees,tag_library:backup.studio?.tags}:type==='progress'?{scoutRecords:backup.scoutRecords}:type==='activities'?{activities:backup.activities}:type==='schedule'?{format:'oas-trailmap-schedule',weeks:backup.studio?.schedule||[],capacity:backup.studio?.capacity,strategy:backup.studio?.strategy}:{trees:backup.studio?.trees,order:backup.studio?.order,treeGraphs:backup.studio?.treeGraphs};dataShowPreview(type,data,'Local checkpoint: '+p.title)});
}
function dataManagerInit(){
 $('#dataType').onchange=()=>$('#dataPreview').hidden=true;
 $('#dataImportBtn').onclick=()=>$('#dataFile').click();
 $('#dataFile').onchange=async e=>{const file=e.target.files[0];if(!file)return;try{const type=$('#dataType').value;if(type==='excel'){await handleWorkbook(file);$('#dataManager').scrollIntoView({behavior:'smooth'});}else{const obj=dataParse(await file.text(),file.name);dataShowPreview(type,obj,file.name)}}catch(err){alert('Import error: '+err.message)}e.target.value=''};
 $('#dataCheckpointBtn').onclick=()=>{dataCheckpoint(prompt('Checkpoint name','Manual checkpoint')||'Manual checkpoint');dataRender()};
 $('#dataWorkbookBtn').onclick=()=>$('#workbookFile').click();
 $('#dataManagerTab').onclick=()=>dataView('data');
 $('#activityStudioTab').onclick=()=>dataView('activity');
 $('#newActivity').onclick=()=>dataEditActivity();
 $('#exportActivityStudio').onclick=()=>dataExport('activities');
 dataRender();dataActivityRender();
}
function dataView(mode){
 const appReq=$('#applicationRequirements');if(appReq)appReq.hidden=true;
 const appReqTab=$('#appRequirementsTab');if(appReqTab){appReqTab.classList.remove('primary');appReqTab.classList.add('secondary');}
 if(mode==='data'||mode==='activity'){
  if($('#helpDesign'))$('#helpDesign').hidden=true;
  setMode('trail');
  $('#trailWorkspace').hidden=true;
  $('#treeStudio').hidden=true;$('#scheduleStudio').hidden=true;
  $('#dataManager').hidden=mode!=='data';$('#activityStudio').hidden=mode!=='activity';
  document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('primary'));
 }else{$('#dataManager').hidden=true;$('#activityStudio').hidden=true;if($('#helpDesign'))$('#helpDesign').hidden=true;}
}
function dataActivityRender(){
 const area=$('#activityList');if(!area)return;
 area.innerHTML=activities.map((a,i)=>'<button type="button" class="button secondary" data-activity-index="'+i+'">'+esc(a.title||a.name||a.id)+'</button>').join('')||'<p class="tiny muted">No activities yet. Create one or import activities.yaml from Data & State Manager.</p>';
 area.querySelectorAll('[data-activity-index]').forEach(b=>b.onclick=()=>dataEditActivity(Number(b.dataset.activityIndex)));
}
function dataEditActivity(index=-1){
 const a=index>=0?activities[index]:{id:'activity-'+Date.now(),title:'',tags:[],covers:[],location:'Scout Hall - indoor',duration:90};
 const holder=$('#activityEditor');holder.hidden=false;
 holder.innerHTML='<h3>'+(index>=0?'Edit':'Create')+' activity</h3><form id="activityForm"><label>Activity title<input name="title" required value="'+esc(a.title||'')+'"></label><label>Description<textarea name="description">'+esc(a.description||'')+'</textarea></label><label>Duration (minutes)<input name="duration" type="number" min="5" value="'+(Number(a.duration)||90)+'"></label><label>Location<select name="location">'+DATA_LOCATION_LIST.map(loc=>'<option '+(a.location===loc?'selected':'')+'>'+esc(loc)+'</option>').join('')+'</select></label><fieldset><legend>Tags</legend><div class="studio-tag-list">'+studio.tags.map(t=>'<label><input type="checkbox" name="tags" value="'+esc(t)+'" '+((a.tags||[]).includes(t)?'checked':'')+'>'+esc(t)+'</label>').join('')+'</div></fieldset>'+['equipment','preparation','instructions','safety','review'].map(field=>'<label>'+field[0].toUpperCase()+field.slice(1)+'<textarea name="'+field+'" rows="3">'+esc(a[field]||'')+'</textarea></label>').join('')+'<button class="button secondary" type="button" id="activitySuggest">Suggest coverage from tags + location</button><fieldset><legend>Confirmed requirement coverage</legend><div id="activityCoverage" class="studio-prereqs"></div></fieldset><button class="button primary" type="submit">Save activity locally</button> <button class="button secondary" type="button" id="activityCancel">Cancel</button></form>';
 const form=$('#activityForm');
 const renderCovers=(selected)=>{$('#activityCoverage').innerHTML=requirements.map(r=>'<label><input type="checkbox" name="covers" value="'+esc(r.id)+'" '+(selected.has(r.id)?'checked':'')+'>'+esc(r.text.slice(0,90))+'</label>').join('')};
 renderCovers(new Set(a.covers||[]));
 $('#activitySuggest').onclick=()=>{const fd=new FormData(form),tags=fd.getAll('tags'),location=fd.get('location');const set=new Set(fd.getAll('covers'));let matches=0;for(const r of requirements){const places=[r.locations?.preferred,...(r.locations?.alternatives||[])];if((r.tags||[]).some(t=>tags.includes(t))&&(!r.locations||places.includes(location))){set.add(r.id);matches++;}}renderCovers(set);showToast(matches+' requirements suggested. Review the checkboxes before saving.')};
 $('#activityCancel').onclick=()=>{holder.hidden=true;window.__oasActivityEditorClose?.();};
 form.onsubmit=e=>{e.preventDefault();const fd=new FormData(form);const result={...a,title:String(fd.get('title')).trim(),description:String(fd.get('description')),duration:Number(fd.get('duration')),location:String(fd.get('location')),tags:fd.getAll('tags'),covers:fd.getAll('covers')};for(const field of ['equipment','preparation','instructions','safety','review'])result[field]=String(fd.get(field));if(!result.title)return;dataCheckpoint('Before editing activity',[ 'activities' ]);if(index>=0)activities[index]=result;else activities.push(result);save();renderAll();dataActivityRender();dataRender();holder.hidden=true;window.__oasActivityEditorClose?.();};
 window.__oasActivityEditorOpen?.(index);
}
document.addEventListener('DOMContentLoaded',()=>{
 const timer=setInterval(()=>{if(typeof studio==='object'&&typeof requirements!=='undefined'&&requirements.length&&document.querySelector('#dataManager')&&studio.trees.length){clearInterval(timer);dataManagerInit()}},100);
});
