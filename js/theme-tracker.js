/* Week theme regeneration and requirement coverage tracking.
 * Browser-only operational planning; no achievements are created by planning.
 */
function currentTagTheme(w){return w.theme||w.tags?.[0]||''}
function useLocationGrouping(){return studio.useLocations===true}
function themedCandidates(weekIndex,theme){
 const w=studio.schedule[weekIndex],others=studio.schedule.filter((x,i)=>i!==weekIndex);
 const occurrenceCounts=scheduleOccurrenceCounts(others);
 return requirements.filter(r=>(r.tags||[]).includes(theme)&&
 (occurrenceCounts.get(r.id)||0)<requiredTimes(r))
 .map(r=>({r,elsewhere:occurrenceCounts.get(r.id)||0}));
}
function themeScore(r,weekIndex,chosen,occurrenceCounts){
 const scope=scheduleScope(),prior=new Set(studio.schedule.slice(0,weekIndex).flatMap(w=>w.requirementIds||[]));
 const selected=new Set(chosen.map(x=>x.id)),pre=r.prerequisites||[];
 const readyInPlan=pre.every(id=>prior.has(id)||selected.has(id)||isCompletedInScope(id));
 const affected=scope.length?scope.filter(name=>!isCompleted(name,r.id)).length:1;
 const readyScouts=scope.length?scope.filter(name=>!isCompleted(name,r.id)&&pre.every(id=>isCompleted(name,id)||prior.has(id)||selected.has(id))).length:1;
 const overlap=chosen.length?(r.tags||[]).filter(tag=>chosen.some(s=>(s.tags||[]).includes(tag))).length:0;
 const compatible=chosen.some(s=>[s.locations?.preferred,...(s.locations?.alternatives||[])].filter(Boolean).some(l=>[r.locations?.preferred,...(r.locations?.alternatives||[])].includes(l)));
 const locationScore=useLocationGrouping()&&chosen.length?(compatible?18:-8):0;
 const repeatNeeded=requiredTimes(r)>1?(occurrenceCounts.get(r.id)||0)*3:0;
 return affected*7+readyScouts*6+descendantsCount(r.id)*2+overlap*4+(readyInPlan?18:-35)+locationScore+repeatNeeded;
}
function regenerateThemeWeek(i,theme,mode){
 const w=studio.schedule[i];if(!w)return;
 const previous=currentTagTheme(w),strategy=mode||w.themeMode||'progression';
 if(w.locked&&!confirm('Week '+(i+1)+' is locked. Unlock and regenerate its requirements for '+(theme||'an unthemed week')+'?')){renderSchedule();return}
 if(!theme){
  if(!confirm('Clear the planned requirements for Week '+(i+1)+'? This will also remove its activity confirmations. Cancel keeps the week unchanged.')){renderSchedule();return;}
  if(typeof dataCheckpoint==='function')dataCheckpoint('Before clearing Week '+(i+1)+' theme',['schedule']);
  w.theme='';w.tags=[];w.title='Week '+(i+1);
  w.requirementIds=[];w.locked=true;w.activity=null;w.activityIds=undefined;w.confirmedSession=false;w.reviewed=false;
  saveSchedule();return;
 }
 const candidates=themedCandidates(i,theme);
 if(!candidates.length){alert('No eligible requirements match the '+theme+' theme. Try another tag or add tags to skills.');renderSchedule();return}
 if((w.activity||w.activityIds?.length||w.confirmedSession)&&!confirm('Regenerating Week '+(i+1)+' will invalidate its existing activity attachment or confirmation. Continue?')){renderSchedule();return;}
 const cap=Math.max(1,Math.min(12,Number(w.capacity)||studio.capacity||4));
 const chosen=[],pool=[...candidates];
 while(chosen.length<cap&&pool.length){
  const chosenIds=chosen.map(r=>r.id),counts=scheduleOccurrenceCounts(studio.schedule.filter((x,k)=>k!==i));
  let pick;
  if(strategy==='random'){
   // Keep a random but theme-matching selection. Prerequisites remain visible as review warnings.
   pick=Math.floor(Math.random()*pool.length);
  }else{
   let score=-Infinity;pick=0;
   for(let j=0;j<pool.length;j++){
    const value=themeScore(pool[j].r,i,chosen,counts);
    if(value>score){score=value;pick=j}
   }
  }
  chosen.push(pool.splice(pick,1)[0].r);
 }
 if(typeof dataCheckpoint==='function')dataCheckpoint('Before changing Week '+(i+1)+' theme',['schedule']);
 w.theme=theme;w.themeMode=strategy;w.tags=uniq([theme,...chosen.flatMap(r=>r.tags||[])]).slice(0,5);w.title=theme+' · Week '+(i+1);
 w.requirementIds=orderSession(chosen.map(r=>r.id));w.locked=true;w.confirmedSession=false;w.activity=null;w.activityIds=undefined;w.reviewed=false;
 if(useLocationGrouping())w.location=chosen.find(r=>r.locations?.preferred)?.locations?.preferred||'Flexible / anywhere';
 else w.location='Flexible / anywhere';
 saveSchedule();
 showToast('Week '+(i+1)+' regenerated with '+chosen.length+' '+theme+' requirements ('+strategy+').');
}
window.__oasEnhanceScheduleWeeks=()=>{themeWeekUI(); if(typeof enhanceRequirementSwaps==='function')enhanceRequirementSwaps();};
function themeWeekUI(){
 const root=$('#scheduleWeeksGrid');if(!root)return;
 root.querySelectorAll('.week-card').forEach((card,i)=>{
  const w=studio.schedule[i];if(!w)return;
  const themeSelect=card.querySelector('[data-week-tag]');
  if(themeSelect){themeSelect.value=currentTagTheme(w);}
  const target=themeSelect?.closest('label');if(!target)return;
  if(card.querySelector('[data-theme-reroll]'))return;
  const controls=document.createElement('div');
  controls.className='theme-regeneration';
  controls.innerHTML='<label>Choose how to regenerate <select data-theme-method="'+i+'"><option value="progression">Best for progression</option><option value="random">Random within theme</option></select></label><button type="button" class="button secondary" data-theme-reroll="'+i+'">Regenerate themed week</button>';
  target.insertAdjacentElement('afterend',controls);
  const select=controls.querySelector('[data-theme-method]');
  select.value=w.themeMode||'progression';
  select.onchange=()=>{w.themeMode=select.value;writeStudio()};
  controls.querySelector('[data-theme-reroll]').onclick=()=>regenerateThemeWeek(i,currentTagTheme(w),select.value);
 });
}
function coverageRows(){
 const names=scheduleScope(),weeks=studio.schedule;
 const plans=scheduleOccurrenceCounts(weeks);
 return requirements.map(r=>{
  const needed=requiredTimes(r),times=plans.get(r.id)||0;
  const matching=activities.filter(a=>Array.isArray(a.covers)&&a.covers.includes(r.id));
  const scoutsDone=names.filter(name=>isCompleted(name,r.id)).length;
  const evidence=names.reduce((sum,name)=>sum+occurrenceState(name,r),0);
  let state;
  if(names.length&&scoutsDone===names.length)state='complete';
  else if(times>=needed)state='planned';
  else if(times>0||matching.length||evidence>0)state='partial';
  else state='unaddressed';
  return {r,needed,times,matching,scoutsDone,evidence,names:names.length,state,weeks:weeks.flatMap((w,i)=>(w.requirementIds||[]).includes(r.id)?[i+1]:[])};
 });
}
function csvCell(x){return '"'+String(x??'').replace(/"/g,'""')+'"'}
function exportCoverage(){
 const rows=coverageRows();
 const header=['Requirement ID','Requirement','Stage','Stream','Tags','Required separate opportunities','Count basis','Planned weeks','Weeks scheduled','Studio activities','Scouts completed','Scouts selected','Evidence opportunity totals','Status'];
 const records=rows.map(o=>[o.r.id,o.r.text,o.r.stage,o.r.stream,(o.r.tags||[]).join('; '),o.needed,o.r.occurrence_basis||'inferred',o.times,o.weeks.join('; '),o.matching.map(a=>a.title||a.id).join('; '),o.scoutsDone,o.names,o.evidence,o.state]);
 const text=[header,...records].map(row=>row.map(csvCell).join(',')).join('\r\n');
 download('oas-requirement-coverage.csv',text,'text/csv');
}
function trackerRender(){
 const area=$('#requirementsTrackerRows');if(!area)return;
 const rows=coverageRows(),q=($('#requirementsTrackerSearch')?.value||'').trim().toLowerCase(),filter=$('#requirementsTrackerStatus')?.value||'all';
 const filtered=rows.filter(o=>(filter==='all'||o.state===filter)&&(!q||(o.r.text+' '+o.r.id+' '+(o.r.tags||[]).join(' ')+' '+o.r.stream).toLowerCase().includes(q)));
 const counts=Object.fromEntries(['unaddressed','partial','planned','complete'].map(s=>[s,rows.filter(o=>o.state===s).length]));
 const snapshot={counts,rows:filtered.map(o=>({id:o.r.id,text:o.r.text,stage:o.r.stage,stream:o.r.stream,linked:o.matching.length,activityNames:o.matching.map(a=>a.title||a.id),planned:o.times,needed:o.needed,weeks:o.weeks,scoutsDone:o.scoutsDone,scoutsTotal:o.names,evidence:o.evidence,status:o.state}))};
 if(window.__oasVueCoverageRender?.(snapshot))return;
 $('#requirementsTrackerSummary').innerHTML=Object.entries(counts).map(([s,n])=>'<div class="data-stat"><strong>'+n+'</strong><span>'+esc(s==='partial'?'Partially addressed':s==='planned'?'Fully planned':s==='complete'?'Completed for selected Scouts':'Unaddressed')+'</span></div>').join('');
 area.innerHTML=filtered.map(o=>'<tr><td><strong>'+esc(o.r.text)+'</strong><small>'+esc(o.r.id)+'</small></td><td>Stage '+esc(o.r.stage)+' · '+esc(o.r.stream)+'</td><td>'+o.matching.length+' linked'+(o.matching.length?'<small>'+esc(o.matching.map(a=>a.title||a.id).slice(0,2).join('; '))+'</small>':'')+'</td><td>'+o.times+'/'+o.needed+'<small>'+esc(o.weeks.join(', ')||'Not scheduled')+'</small></td><td>'+o.scoutsDone+'/'+o.names+' Scouts complete'+(o.names?'<small>'+o.evidence+' total evidence credits</small>':'')+'</td><td><span class="tracker-status '+o.state+'">'+esc(o.state)+'</span></td></tr>').join('')||'<tr><td colspan="6">No requirements match these filters.</td></tr>';
}
const themeTrackerPreviousRender=renderSchedule;
renderSchedule=function(){themeTrackerPreviousRender();themeWeekUI();trackerRender()};
function setupThemeAndTracker(){
 const loc=$('#useLocations');
 if(loc){loc.checked=studio.useLocations===true;loc.onchange=()=>{studio.useLocations=loc.checked;writeStudio();renderSchedule();showToast(loc.checked?'Location matching enabled.':'Locations removed from recommendations and scheduling scores.')};}
 const search=$('#requirementsTrackerSearch'),state=$('#requirementsTrackerStatus'),exporter=$('#exportRequirementsTracker');
 if(search)search.oninput=trackerRender;
 if(state)state.onchange=trackerRender;
 if(exporter)exporter.onclick=exportCoverage;
 const detail=HELP_TOPICS.find(t=>t.id==='scheduling');
 if(detail)detail.text+='\n\nChanging a weekly Theme dropdown now regenerates matching skills for that week. Choose Best for progression or Random within theme; use Regenerate themed week to reroll. The week is locked after a change. Switch off Consider locations if Scout Hall versus external venue should not influence suggestions. Plan 1 to 60 weeks.';
  const roadmap=HELP_TOPICS.find(t=>t.id==='future');
 if(roadmap)roadmap.text+='\n\nNEW BRAINSTORM — STAGE REWORK (NOT APPROVED): Plan approximately four requirements per stage per night, strongly organised by coherent themes. Treat stages as soft prerequisites again; some requirements may need repeating across stage-focused nights. Discover how mixed-readiness groups and evidence counts should work before committing.\n\nNEW BRAINSTORM — CODEBASE REWRITE (NOT APPROVED): Restructure the app into clear, human-readable modules with central configuration for stage policy, location rules, schedule scoring and repeat counts; add tests, migrations and contributor documentation. Preserve local-first Scout privacy and the original Excel importer.';
 HELP_TOPICS.push({id:'tracker',group:'Everyday workflows',title:'Current requirements tracker',text:'Open Scheduler → Current Requirements Tracker. It shows every requirement, its confirmed Activity Studio coverage, all weeks where it is scheduled, the number of separate opportunities needed, and Scout completion evidence. Search by ID, text or tag, or filter to unaddressed, partially planned, fully planned and complete-for-selected-Scouts. Export a CSV to review the full table with other leaders.\n\nActivity matching alone is not a completion. Fully planned means enough distinct weekly opportunities exist; actual completion still requires leader evidence.'});
 // Publish help only after async tracker setup adds its final topic and edits.
 window.__oasPublicHelpTopics=HELP_TOPICS.map(t=>({...t}));
 window.dispatchEvent(new Event('oas:help-topics-ready'));
 if($('#helpTopics'))helpRender();
 renderSchedule();
}
document.addEventListener('DOMContentLoaded',()=>{let n=0;const timer=setInterval(()=>{n++;if(typeof studio!=='undefined'&&requirements.length&&$('#requirementsTrackerRows')&&studio.trees.length){clearInterval(timer);setupThemeAndTracker()}else if(n>150)clearInterval(timer)},100)});
