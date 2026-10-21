/* OAS Trailmap: leader-facing help, reset & recovery, and multi-activity weekly plans. */
const HELP_TOPICS=[
 {id:'start',group:'Getting started',title:'First-time setup',text:'1. Open Data & State. 2. Import the original OAS Excel progress workbook. 3. Review the preview before applying completion evidence. 4. Select the Scouts you want to plan for. 5. Create or import activities. 6. Open Scheduler and generate a plan. 7. Export a full backup when the setup is complete.'},
 {id:'excel',group:'Getting started',title:'Importing the original Excel workbook',text:'Use Data & State → Original Excel Scout progress → Choose file. The workbook parser identifies relevant sheets and Scout columns; a date or highlighted assessment cell counts as completed. Review unmatched rows before accepting. Import adds evidence rather than wiping manual achievements. Reimporting is supported. If the importer cannot find the roster, check the workbook format.'},
 {id:'scouts',group:'Everyday workflows',title:'Recording Scout achievements',text:'Choose the Scouts you are working with. Select a skill in Trailmap to review readiness and completion. After a scheduled session, use Review skills and tick only skills actually demonstrated. Scheduling a skill or attaching an activity does not mark it completed. Dates and evidence from the Excel import are retained.'},
 {id:'activities',group:'Everyday workflows',title:'Creating and matching activities',text:'In Activity Studio, enter the name, duration, tags, location, equipment, preparation, instructions, safety considerations and review prompts. Suggest coverage proposes requirements using tags and location. Review the suggestions and explicitly confirm the correct requirements. The scheduler considers only confirmed coverage.'},
 {id:'nights',group:'Everyday workflows',title:'Planning a Scout night with activities',text:'Generate a 40-week schedule, then open Suggested activity combinations under a week. Suggested activities are drawn from Activity Studio using requirement coverage, venue compatibility, prerequisites and available minutes. Use the proposed combination, reorder it, add or remove activities, then confirm. Nothing is committed to a week until you accept the combination. Review achievements only after the night takes place.'},
 {id:'scheduling',group:'Workflows & design',title:'How scheduling decisions are made',text:'Progress-focused emphasises foundational requirements needed by more Scouts. Location-focused groups compatible sessions at practical venues. Balanced combines both. Existing prerequisites, session capacity and locked weeks remain important. Preferred external weeks influence suggestions but do not book a venue. The planner is a heuristic: leaders should always check practical feasibility.'},
 {id:'trees',group:'Workflows & design',title:'Editing prerequisites and skill trees',text:'Open Skill Tree Mapper and choose a tree or tag view. Select a requirement to edit its text, tags, preferred location and alternatives. Mandatory prerequisite links control readiness. Suggested links are advisory. Custom tree links can be different from the master graph; use individual Remove controls to disconnect problem links. Use checkpoints or Undo to recover from changes.'},
 {id:'state',group:'Managing data',title:'Backups and transfers',text:'Data & State is the one-stop shop for importing, reviewing and exporting. Choose Full Backup to move your whole local setup between computers. Export individual requirements, activities, schedule, Scout progress or tree layouts for targeted work. The app stores records in this browser, not on GitHub. Save backups outside the browser regularly.'},
 {id:'reset',group:'Managing data',title:'Clearing records and restoring defaults',text:'Data & State → Reset & Recovery offers: clear achievements while keeping roster; clear roster and achievements; clear schedule; restore the bundled default requirements; and factory reset. Choose the smallest action that meets your goal. A local checkpoint is made before targeted changes, and a full backup is recommended. Restoring requirements does not clear Scout progress.'},
 {id:'trouble',group:'Troubleshooting',title:'Common issues',text:'Excel will not load? Make sure the workbook is .xlsx, the browser is online to load the Excel reader, and the sheet follows the original stage/stream structure. Missing Scouts? Check the import preview and unmatched entries. No activity suggestions? Create activities in Activity Studio and confirm requirement coverage first. Lost local data? Restore a previously exported full backup from Data & State.'},
 {id:'appendix',group:'Appendix',title:'Technical data design',text:'Operational data uses local browser storage. Scout progress is keyed by Scout identity and requirement ID. The workbook remains the foundation for initial progress, with completion dates and source evidence. Requirements have stable IDs, tags, prerequisites, optional suggested links and preferred/alternative locations. Activity Studio records confirmed covers arrays and duration. Each schedule week can store an ordered activityIds array, a sessionMinutes limit and a confirmedSession marker. Individual imports should not alter unrelated datasets. JSON/YAML exports are portable; avoid publishing files containing Scout data.'},
 {id:'future',group:'Future phases (brainstorm)',title:'Ideas for future releases — not committed requirements',text:'IDEAS FOR DISCUSSION, NOT APPROVED REQUIREMENTS:\n\n• Reusable night templates: turn a successful multi-activity session into a template for future terms.\n• Scout-group sharing: exchange reviewed activities and requirements without revealing Scout data.\n• Equipment and resource planning: detect missing gear, venue constraints and leader qualifications.\n• Session calendar: map Week 1–40 to actual term dates, holidays, excursions and camp weekends.\n• Progress insights: show likely requirement unlocks, gaps by strand and progress over time.\n• Offline application: installable browser experience with explicit local data recovery guidance.\n• Optional integrations: consider Scout management data sources only after privacy and permissions design.\n• Better provenance: show where requirements and completion evidence originated.\n• Accessibility and translations: larger text, keyboard-first navigation, printable leader guides.\n\nEach idea needs its own discovery, acceptance criteria, privacy review and prioritisation before work is scheduled.'}
];
function helpRender(){
 if(window.__oasHelpVueActive)return; // Vue now owns the read-only Help workspace.
 const nav=$('#helpTopics'),content=$('#helpContent');if(!nav||!content)return;
 const q=($('#helpSearch')?.value||'').toLowerCase();
 const filtered=HELP_TOPICS.filter(t=>(t.title+' '+t.group+' '+t.text).toLowerCase().includes(q));
 nav.innerHTML=filtered.map(t=>'<button type="button" class="button secondary" data-help="'+esc(t.id)+'">'+esc(t.title)+'</button>').join('')||'<p>No matching help topics. Try a simpler term.</p>';
 nav.querySelectorAll('[data-help]').forEach(b=>b.onclick=()=>helpOpen(b.dataset.help));
 if(!document.querySelector('#helpContent [data-help-open]')||q)helpOpen(filtered[0]?.id);
}
function helpOpen(id){
 const target=HELP_TOPICS.find(t=>t.id===id),box=$('#helpContent');if(!box)return;
 if(!target){box.innerHTML='';return;}
 const lines=target.text.split('\n').map(x=>'<p>'+esc(x)+'</p>').join('');
 box.innerHTML='<article data-help-open="'+esc(id)+'"><p class="eyebrow">'+esc(target.group)+'</p><h3>'+esc(target.title)+'</h3>'+lines+'</article>';
}
function showHelp(){dataView('help');$('#trailWorkspace').hidden=true;$('#treeStudio').hidden=true;$('#scheduleStudio').hidden=true;$('#helpDesign').hidden=false;document.querySelectorAll('[data-mode]').forEach(b=>b.classList.remove('primary'));helpRender();}
function recoverySnapshot(label,types){
 try{dataCheckpoint(label,types);return true}catch(e){alert('A safety checkpoint could not be stored. Export your full backup before continuing. '+e.message);return false}
}
function recoveryConfirm(label,details,apply,phrase){
 const review=$('#resetReview');review.hidden=false;
 review.innerHTML='<h3>'+esc(label)+'</h3><p>'+esc(details)+'</p><p><strong>This changes only data stored in your current browser.</strong> Download a full backup first if you may need this information later.</p><div class="studio-toolbar"><button type="button" class="button secondary" id="resetBackupDownload">Download full backup</button><button type="button" class="button primary" id="resetProceed">Continue</button><button type="button" class="button secondary" id="resetCancel">Cancel</button></div>';
 $('#resetBackupDownload').onclick=()=>dataExport('full');
 $('#resetCancel').onclick=()=>review.hidden=true;
 $('#resetProceed').onclick=()=>{
  if(phrase&&prompt('Type '+phrase+' to confirm:', '')!==phrase)return;
  if(!confirm('Confirm: '+label+'?'))return;
  try{apply();review.hidden=true;showToast(label+' completed.');}catch(e){alert('Reset failed: '+e.message);}
 };
 review.scrollIntoView({block:'nearest',behavior:'smooth'});
}
function recoveryRefresh(){save();writeStudio();renderAll();renderTree();renderSchedule();dataRender();}
function recoveryInit(){
 $('#clearAchievementsBtn').onclick=()=>{
  const names=scoutNames().length,total=Object.values(scoutRecords).filter(r=>r.completed).length;
  recoveryConfirm('Clear achievements','Will reset '+total+' completed records for '+names+' Scouts. Keep the existing roster and evidence-free record entries. Import the original workbook again to reseed achievements.',()=>{
   if(!recoverySnapshot('Before clearing Scout achievements',['progress']))return;
   for(const k of Object.keys(scoutRecords))scoutRecords[k]={...scoutRecords[k],completed:false,date:'',source:'reset',sourceSheet:undefined,sourceRow:undefined};
   recoveryRefresh();
  },'CLEAR PROGRESS');
 };
 $('#clearScoutDataBtn').onclick=()=>{
  recoveryConfirm('Clear Scout roster and progress','Remove '+scoutNames().length+' Scouts and every completion record. This does not delete activities, requirements or schedules.',()=>{
   if(!recoverySnapshot('Before clearing Scout roster and progress',['progress']))return;
   scoutRecords={};selectedScoutNames=[];selectedScout='__all__';recoveryRefresh();
  },'CLEAR SCOUTS');
 };
 $('#clearPlanBtn').onclick=()=>{
  recoveryConfirm('Clear the schedule','Remove all planned weeks, locked sessions, activity assignments and session reviews. Scout achievements remain intact.',()=>{
   if(!recoverySnapshot('Before clearing schedule',['schedule']))return;
   studio.schedule=[];recoveryRefresh();
  },'CLEAR SCHEDULE');
 };
 $('#restoreDefaultReqsBtn').onclick=async()=>{
  try{
   const response=await fetch('data/requirements.json',{cache:'no-store'});
   if(!response.ok)throw Error('The bundled requirements file could not be loaded');
   const defaults=await response.json();
   dataShowPreview('requirements',{requirements:defaults.requirements,tree_graphs:{},tree_registry:[...new Set(defaults.requirements.map(treeFor))],tag_library:[...new Set(defaults.requirements.flatMap(r=>r.tags||[]))]},'Bundled default requirements.json (original application baseline)');
   $('#resetReview').hidden=false;
   $('#resetReview').innerHTML='<p><strong>Default requirements ready for review.</strong> Use the import preview above to decide whether to restore. This preserves Scout progress but replaces customised requirement wording, tags, locations and prerequisite links. The source text is not modified.</p>';
  }catch(err){alert('Cannot restore default requirements: '+err.message);}
 };
 $('#fullResetBtn').onclick=()=>{
  recoveryConfirm('Full factory reset','Clear browser-only Scout records, activities, schedule, custom requirements, tree settings, and local checkpoints. The original Excel workbook can be imported again after resetting.',()=>{
    dataExport('full');
    localStorage.removeItem(STORE_KEY);localStorage.removeItem(STUDIO_KEY);localStorage.removeItem(DATA_CHECKPOINTS_KEY);
    location.reload();
  },'FACTORY RESET');
 };
}
function multiActivitiesFor(week){
 const eligible=(activities||[]).filter(a=>a&&a.id&&Array.isArray(a.covers)&&a.covers.some(id=>(week.requirementIds||[]).includes(id)));
 const planned=new Set(week.requirementIds||[]),picked=new Set(),chosen=[],limit=Math.max(15,Number(week.sessionMinutes)||90);
 const scope=typeof scheduleScope==='function'?scheduleScope():[];
 let remaining=limit;
 for(let pass=0;pass<8;pass++){
  let best=null,bestScore=-1;
  for(const a of eligible){
   if(picked.has(a.id))continue;
   const duration=Math.max(5,Number(a.duration)||60);
   if(duration>remaining)continue;
   const notYet=(a.covers||[]).filter(id=>planned.has(id)&&!chosen.some(x=>x.covers.includes(id)));
   if(!notYet.length)continue;
   const location=a.location||'Flexible / anywhere';
   const compatible=studio.useLocations!==true||!week.location||location===week.location||location==='Flexible / anywhere'||week.location==='Flexible / anywhere';
   const scoutValue=notYet.reduce((n,id)=>n+(scope.length?scope.filter(name=>!isCompleted(name,id)).length:1),0);
   const score=(scoutValue*3+notYet.length*8)*(compatible?1.25:.55)/Math.sqrt(duration);
   if(score>bestScore){best=a;bestScore=score;}
  }
  if(!best)break;
  chosen.push(best);picked.add(best.id);remaining-=Math.max(5,Number(best.duration)||60);
 }
 return chosen;
}
function multiSelectedActivities(w){return (w.activityIds||[]).map(id=>activities.find(a=>a.id===id)).filter(Boolean);}
function multiSummary(items,w){
 const coverage=[...new Set(items.flatMap(a=>a.covers||[]))],hits=coverage.filter(id=>(w.requirementIds||[]).includes(id)).length;
 const minutes=items.reduce((n,a)=>n+(Number(a.duration)||60),0),locations=[...new Set(items.map(a=>a.location).filter(Boolean))];
 return {coverage,hits,minutes,locations};
}
function multiSchedulePanel(w,i){
 const selected=multiSelectedActivities(w),suggested=multiActivitiesFor(w),choices=Array.isArray(w.activityIds)?selected:suggested;
 const summary=multiSummary(choices,w),remaining=(w.requirementIds||[]).filter(id=>!summary.coverage.includes(id));
 const all=activities.filter(a=>a?.id&&Array.isArray(a.covers));
 const preferred=Number(w.sessionMinutes)||90;
 return '<section class="multi-session" data-week-session="'+i+'"><h4>Activities for this Scout night</h4>'+
 '<p class="tiny muted">'+(w.confirmedSession?'Confirmed by leader':'Suggested combination — not yet confirmed')+' · '+esc(summary.hits)+' planned requirements covered · '+esc(summary.minutes)+' / '+preferred+' minutes'+(summary.minutes>preferred?' ⚠ Over time':'')+'</p>'+
 '<div class="multi-activities">'+choices.map((a,j)=>'<div class="multi-activity"><span>'+(j+1)+'. <strong>'+esc(a.title||a.name||a.id)+'</strong> <small>'+esc(a.duration||60)+' min · '+esc(a.location||'Location flexible')+'</small></span><div><button type="button" class="button secondary" data-multi-up="'+j+'" '+(!j?'disabled':'')+' aria-label="Move activity earlier">↑</button><button type="button" class="button secondary" data-multi-down="'+j+'" '+(j===choices.length-1?'disabled':'')+' aria-label="Move activity later">↓</button><button type="button" class="button secondary" data-multi-remove="'+j+'" aria-label="Remove activity">×</button></div></div>').join('')+'</div>'+
 '<p class="tiny muted">'+(remaining.length?remaining.length+' planned requirements are not covered by the shown activities.':'All planned requirements covered by the shown activities.')+(summary.locations.length>1?' Check multiple activity locations: '+esc(summary.locations.join(', ')):'')+'</p>'+
 '<label>Session length (minutes) <input type="number" min="15" max="600" data-multi-minutes="'+i+'" value="'+preferred+'"></label>'+
 '<div class="studio-toolbar"><button class="button secondary" type="button" data-multi-suggest="'+i+'">Refresh suggestions</button><select data-multi-pick="'+i+'"><option value="">Add from Activity Studio…</option>'+all.filter(a=>!choices.some(c=>c.id===a.id)).map(a=>'<option value="'+esc(a.id)+'">'+esc(a.title||a.id)+'</option>').join('')+'</select><button class="button primary" type="button" data-multi-confirm="'+i+'">Confirm this combination</button></div></section>';
}
function multiEnhanceSchedule(){
 const grid=$('#scheduleWeeksGrid');if(!grid)return;
 grid.querySelectorAll('.week-card').forEach((card,i)=>{
  const w=studio.schedule[i];if(!w)return;
  card.insertAdjacentHTML('beforeend',multiSchedulePanel(w,i));
  const panel=card.querySelector('[data-week-session]');if(!panel)return;
  const proposed=()=>Array.isArray(w.activityIds)?multiSelectedActivities(w):multiActivitiesFor(w);
  function update(ids,confirmed=false){w.activityIds=ids;w.confirmedSession=confirmed;saveSchedule();}
  panel.querySelectorAll('[data-multi-up]').forEach(b=>b.onclick=()=>{const ids=proposed().map(a=>a.id),j=+b.dataset.multiUp;[ids[j-1],ids[j]]=[ids[j],ids[j-1]];update(ids)});
  panel.querySelectorAll('[data-multi-down]').forEach(b=>b.onclick=()=>{const ids=proposed().map(a=>a.id),j=+b.dataset.multiDown;[ids[j+1],ids[j]]=[ids[j],ids[j+1]];update(ids)});
  panel.querySelectorAll('[data-multi-remove]').forEach(b=>b.onclick=()=>{const ids=proposed().map(a=>a.id);ids.splice(+b.dataset.multiRemove,1);update(ids)});
  panel.querySelector('[data-multi-suggest]').onclick=()=>{w.activityIds=multiActivitiesFor(w).map(a=>a.id);w.confirmedSession=false;saveSchedule()};
  panel.querySelector('[data-multi-pick]').onchange=e=>{if(!e.target.value)return;update([...new Set([...proposed().map(a=>a.id),e.target.value])])};
  panel.querySelector('[data-multi-minutes]').onchange=e=>{w.sessionMinutes=Math.max(15,Math.min(600,Number(e.target.value)||90));w.confirmedSession=false;saveSchedule()};
  panel.querySelector('[data-multi-confirm]').onclick=()=>{
   const ids=proposed().map(a=>a.id),items=ids.map(id=>activities.find(a=>a.id===id)).filter(Boolean);
   if(!ids.length){alert('Create activities with confirmed requirement coverage in Activity Studio first.');return;}
   const result=multiSummary(items,w),max=Number(w.sessionMinutes)||90;
   if(result.minutes>max&&!confirm('Activities total '+result.minutes+' minutes, exceeding '+max+' minutes. Confirm anyway?'))return;
   if(studio.useLocations===true&&result.locations.length>1&&!confirm('Activities use different locations ('+result.locations.join(', ')+'). Confirm after checking travel feasibility?'))return;
   w.activityIds=ids;w.confirmedSession=true;saveSchedule();showToast('Week '+(i+1)+' activity sequence confirmed.');
  };
 });
}
const oldRenderScheduleForMulti=renderSchedule;
renderSchedule=function(){oldRenderScheduleForMulti();multiEnhanceSchedule()};
function nextPhaseInit(){
 const tab=$('#helpDesignTab');if(tab)tab.onclick=showHelp;
 const search=$('#helpSearch');if(search)search.oninput=helpRender;
 recoveryInit();helpRender();
}
document.addEventListener('DOMContentLoaded',()=>{
 let tries=0;
 const timer=setInterval(()=>{tries++;if(document.querySelector('#resetRecovery')&&typeof studio==='object'&&typeof requirements!=='undefined'&&requirements.length){clearInterval(timer);nextPhaseInit();renderSchedule()}else if(tries>200){clearInterval(timer);console.warn('OAS next-phase controls could not initialise')}},100);
});
