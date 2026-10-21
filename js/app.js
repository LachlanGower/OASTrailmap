/* OAS Trailmap — local-first prototype. No Scout records are sent to a server. */
const $ = (s) => document.querySelector(s);
const STREAMS = ['Camping','Bushwalking','Bushcraft'];
const STORE_KEY = 'oas-trailmap-v1';
let requirements = [];
let activities = [];
let scoutRecords = {};
let selectedScout = '__all__';
let selectedScoutNames = [];
let selectedPlannerTags = [];
let selectedRequirement = null;
let pendingImport = null;
let pendingBackupRestore = null;
const normalize = s => String(s ?? '').toLowerCase().normalize('NFKD').replace(/[’‘]/g,"'").replace(/[^a-z0-9]+/g,' ').trim().replace(/\s+/g,' ');
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const getKey = (scout, id) => `${scout}::${id}`;
const recordFor = (scout,id) => scoutRecords[getKey(scout,id)] || {completed:false,date:'',source:'manual'};
const isCompleted = (scout,id) => recordFor(scout,id).completed === true;
const showToast = msg => { const t=$('#toast'); t.textContent=msg; t.classList.add('show'); setTimeout(()=>t.classList.remove('show'),2400); };
function save(){ try{localStorage.setItem(STORE_KEY,JSON.stringify({version:1,scoutRecords,activities,scouts:scoutNames(),supplementalRequirements:requirements.filter(r=>r.supplemental),requirementsOverride:requirements}));}catch(e){showToast('Could not save locally. Export a backup before continuing.');} }
function scoutNames(){return [...new Set(Object.keys(scoutRecords).map(k=>k.split('::')[0]).filter(s=>s && s!=='__all__'))].sort((a,b)=>a.localeCompare(b));}
function load(){try{const x=JSON.parse(localStorage.getItem(STORE_KEY)||'{}');if(Array.isArray(x.requirementsOverride))requirements=x.requirementsOverride;scoutRecords=x.scoutRecords||{};activities=x.activities||[];for(const r of (x.supplementalRequirements||[]))if(!requirements.some(q=>q.id===r.id))requirements.push(r);}catch{scoutRecords={};activities=[];}}
function activityFor(id){return activities.filter(a=>(a.covers||[]).includes(id));}
function allScoutNames(){return scoutNames();}
function scopedScoutNames(){const all=allScoutNames();if(selectedScout==='__all__')return all;if(selectedScout==='__subset__')return selectedScoutNames.filter(n=>all.includes(n));return all.includes(selectedScout)?[selectedScout]:[];}
function groupScope(){return selectedScout==='__all__'||selectedScout==='__subset__';}
function plannerTagNames(){return [...new Set(requirements.flatMap(r=>r.tags||[]))].sort((a,b)=>a.localeCompare(b));}
function plannerRequirements(){if(!selectedPlannerTags.length)return [];return requirements.filter(r=>(r.tags||[]).some(t=>selectedPlannerTags.includes(t)));}
function blockedPrerequisites(req, scout){
  return (req.prerequisites||[]).filter(id=>{
    const prerequisite=requirements.find(r=>r.id===id);
    return !prerequisite || !isCompleted(scout,id);
  });
}
function readyScoutCount(req){
  return scopedScoutNames().filter(s=>!isCompleted(s,req.id)&&blockedPrerequisites(req,s).length===0).length;
}
function getStatus(req){
  const names=scopedScoutNames();
  if(!groupScope()){
    if(isCompleted(selectedScout,req.id))return 'complete';
    return blockedPrerequisites(req,selectedScout).length?'blocked':'ready';
  }
  if(!names.length)return 'ready';
  if(names.every(s=>isCompleted(s,req.id)))return 'complete';
  if(names.some(s=>!isCompleted(s,req.id)&&blockedPrerequisites(req,s).length===0))return 'ready';
  return 'blocked';
}
function visibleRequirements(){
  const stage=$('#stageFilter').value,stream=$('#streamFilter').value,status=$('#statusFilter').value,q=normalize($('#searchInput').value);
  const planned=plannerRequirements();
  return requirements.filter(r=>{
    if($('#plannerMode')?.checked&&selectedPlannerTags.length&&!planned.some(x=>x.id===r.id))return false;
    if($('#mainTagFilter')?.value&&!(r.tags||[]).includes($('#mainTagFilter').value))return false;if(stage!=='all'&&String(r.stage)!==stage)return false;
    if(stream!=='all'&&r.stream!==stream)return false;
    if(q&&!normalize(r.text+' '+r.stream+' stage '+r.stage+' '+r.tags.join(' ')).includes(q))return false;
    const st=getStatus(r);
    if(status==='complete'&&st!=='complete')return false;
    if(status==='activities'&&!activityFor(r.id).length)return false;
    if(status==='outstanding'&&st==='complete')return false;
    if(status==='ready'&&st!=='ready')return false;
    if($('#missingOnly')?.checked&&!groupScope()&&st==='complete')return false;
    return true;
  });
}
function renderSummary(){
  const names=allScoutNames(); const scope=scopedScoutNames();
  const total=requirements.length*Math.max(scope.length,1); let done=0;
  if(scope.length) for(const s of scope) for(const r of requirements) if(isCompleted(s,r.id))done++;
  const pct=total?Math.round(done/total*100):0;
  $('#progressPct').textContent=pct+'%';$('#progressBar').style.width=pct+'%';$('#completedCount').textContent=`${done} / ${total}`;
  $('#scopeNote').textContent=selectedScout==='__all__'?'Across all Scouts':selectedScout==='__subset__'?`${scope.length} selected Scouts`:selectedScout;
  $('#activityCount').textContent=activities.length;
  $('#nextCount').textContent=scope.length?Math.max(0,total-done):requirements.length;
  $('#totalReq').textContent=requirements.length;
}
function renderScoutSelect(){
 if(window.__oasVueScoutRefresh){
  const missing=$('#missingOnly');if(missing){missing.disabled=groupScope();if(missing.disabled)missing.checked=false;}
  window.__oasVueScoutRefresh();
  renderScoutSubsetOptions();return;
 }
 const select=$('#scoutSelect'),current=selectedScout;
 select.innerHTML='<option value="__all__">All Scouts · pack overview</option><option value="__subset__">Selected Scouts · subset</option>'+scoutNames().map(n=>`<option value="${esc(n)}">${esc(n)}</option>`).join('');
 select.value=[...select.options].some(o=>o.value===current)?current:'__all__';selectedScout=select.value;
 const missing=$('#missingOnly');if(missing){missing.disabled=groupScope();if(missing.disabled)missing.checked=false;}
 renderScoutSubsetOptions();
}
function renderScoutSubsetOptions(){
 if(window.__oasVueScoutSubsetRefresh){window.__oasVueScoutSubsetRefresh();return;}
 const box=$('#multiScoutOptions');if(!box)return;const names=scoutNames();
 box.innerHTML=names.length?names.map(n=>`<label class="scout-option"><input type="checkbox" value="${esc(n)}" ${selectedScoutNames.includes(n)?'checked':''}><span>${esc(n)}</span></label>`).join(''):'<p class="empty-inline">Import a workbook or add Scout progress first.</p>';
}
/** Vue gets read-only projections. Legacy remains the only writer to storage. */
window.__oasScoutPickerSnapshot=()=>({
 names:scoutNames(),selected:selectedScout,subset:[...selectedScoutNames],
 missingOnlyDisabled:groupScope()
});
window.__oasScoutCompletionSnapshot=()=>{
 const r=requirements.find(x=>x.id===selectedRequirement);if(!r)return null;
 const names=groupScope()?scopedScoutNames():[selectedScout];
 return {requirementId:r.id,group:groupScope(),entries:names.map(name=>{
  const old=recordFor(name,r.id);
  return {scout:name,completed:old.completed===true,date:old.date||''};
 })};
};
window.__oasScoutSelect=next=>{
 if(next==='__subset__'&&!selectedScoutNames.length){
  selectedScout='__all__';$('#scoutSelect').value='__all__';
  $('#multiScoutPanel').hidden=false;renderScoutSelect();return;
 }
 selectedScout=next;
 if(next==='__subset__')$('#multiScoutPanel').hidden=false;
 renderAll();
};
window.__oasScoutSaveCompletion=(name,id,checked)=>{
 const key=getKey(name,id),old=recordFor(name,id);
 scoutRecords[key]={...old,completed:checked,
  date:checked?(old.date||new Date().toISOString().slice(0,10)):'',
  source:'manual'};
 save();renderSummary();renderMap();renderDetail();renderPlanner();
};
window.__oasScoutSaveDate=(name,id,date)=>{
 const key=getKey(name,id),old=recordFor(name,id);
 scoutRecords[key]={...old,date,completed:old.completed,source:old.source||'manual'};
 save();renderSummary();renderMap();renderPlanner();
};
function renderPlanner(){
 const panel=$('#plannerPanel');if(!panel)return;panel.hidden=!$('#plannerMode').checked;
 const tagBox=$('#plannerTags');const tags=plannerTagNames();
 tagBox.innerHTML=tags.map(t=>`<label class="planner-tag"><input type="checkbox" value="${esc(t)}" ${selectedPlannerTags.includes(t)?'checked':''}><span>${esc(t)}</span></label>`).join('');
 const reqs=plannerRequirements(),scope=scopedScoutNames();let outstanding=0,readyPairs=0;const affected=new Set();
 for(const scout of scope)for(const r of reqs){if(isCompleted(scout,r.id))continue;outstanding++;affected.add(scout);if(blockedPrerequisites(r,scout).length===0)readyPairs++;}
 $('#plannerReqCount').textContent=selectedPlannerTags.length?reqs.length:'—';
 $('#plannerOutstandingCount').textContent=selectedPlannerTags.length?outstanding:'—';
 $('#plannerAffectedCount').textContent=selectedPlannerTags.length?affected.size:'—';
 $('#plannerReadyCount').textContent=selectedPlannerTags.length?readyPairs:'—';
 $('#plannerNote').textContent=!selectedPlannerTags.length?'Choose one or more tags. Matching requirements are counted once even when they carry several selected tags. Counts use the current Scout scope.':`${selectedPlannerTags.join(' + ')} · ${reqs.length} unique requirements across all matching stages and streams. ${outstanding} incomplete Scout-skill pairs remain; ${affected.size} Scouts have at least one outstanding requirement in this plan.`;
}
/**
 * Read-only projection of the *current* legacy app state for the Vue map.
 * Completion writes, date edits and workbook loading stay with legacy code.
 */
function trailmapMapSnapshot(visible=visibleRequirements()){
  return {
    plannerMode:!!$('#plannerMode')?.checked,
    selectedPlannerTags:[...selectedPlannerTags],
    groupScope:groupScope(),
    nodes:visible.map(r=>{
      const status=getStatus(r);
      return {
        id:r.id,stage:r.stage,stream:r.stream,text:r.text,
        workflow:r.workflow||'',tags:[...(r.tags||[])],
        status,readyCount:readyScoutCount(r),
        missingPrerequisites:groupScope()?0:blockedPrerequisites(r,selectedScout).length,
        hasActivity:activityFor(r.id).length>0,
        selected:selectedRequirement===r.id
      };
    })
  };
}
function renderMap(){
  const visible=visibleRequirements(); const canvas=$('#mapCanvas');
  // Once Vue owns the map, never overwrite its nodes with innerHTML.
  // Keep the original renderer ready for ?trailmapRenderer=legacy and errors.
  if(typeof window.__oasTrailmapVueRender==='function'){
    $('#emptyMap').hidden=visible.length>0;
    try {
      if(window.__oasTrailmapVueRender(trailmapMapSnapshot(visible)))return;
    } catch(error) {
      console.warn('Vue Trailmap update failed; falling back to original map.',error);
      window.__oasTrailmapVueRender=undefined;
      delete document.documentElement.dataset.oasTrailmapRenderer;
    }
  }
  if(!visible.length){canvas.innerHTML='';$('#emptyMap').hidden=false;return;} $('#emptyMap').hidden=true;
  const priority=$('#plannerMode')?.checked;
  let html='<div class="map-grid">';
  for(let stage=1;stage<=3;stage++){
    const group=visible.filter(r=>r.stage===stage);
    html+=`<section class="stage-column"><div class="stage-title"><h3>Stage ${stage}</h3><span>${group.length} skills shown</span></div>`;
    for(const stream of STREAMS){let items=group.filter(r=>r.stream===stream);if(priority)items=items.slice().sort((a,b)=>{const at=(a.tags||[]).filter(t=>selectedPlannerTags.includes(t)).length,bt=(b.tags||[]).filter(t=>selectedPlannerTags.includes(t)).length;return bt-at||readyScoutCount(b)-readyScoutCount(a)||a.text.localeCompare(b.text);});if(!items.length)continue;
      html+=`<div class="stream-block"><h4 class="stream-title">${stream}</h4>`;
      for(const r of items){const st=getStatus(r),done=st==='complete',blocked=st==='blocked',acts=activityFor(r.id),sel=selectedRequirement===r.id,ready=st==='ready',readyN=readyScoutCount(r);
        const mark=done?'✓':blocked?'!':'→';
        const blockerText=groupScope()?'Prerequisites outstanding for remaining Scouts':`${blockedPrerequisites(r,selectedScout).length} prerequisite(s) missing`;
        const label=done?'Complete':blocked?blockerText:'Ready to work on';
        const priorityBadge=priority&&selectedPlannerTags.length&&(r.tags||[]).some(t=>selectedPlannerTags.includes(t))?`<span class="node-badge priority-badge" title="${readyN} Scouts can work on this now">${readyN} READY</span>`:'';
        html+=`<button class="requirement-node state-${st} ${acts.length?'has-activity':''} ${sel?'selected':''}" data-id="${esc(r.id)}" title="${esc(r.text)}"><span class="node-mark">${mark}</span><span class="node-copy">${esc(r.text)}<span class="node-meta">${r.workflow?esc(r.workflow+' · '):''}${label}${groupScope()&&ready?` · ${readyN} ready`:''}</span></span>${priorityBadge}${acts.length?'<span class="node-badge activity-badge">ACTIVITY</span>':''}</button>`;
      }
      html+='</div>';
    }
    html+='</section>';
  }
  html+='</div>';canvas.innerHTML=html;
  canvas.querySelectorAll('[data-id]').forEach(b=>b.addEventListener('click',()=>{selectedRequirement=b.dataset.id;renderMap();renderDetail();}));
  drawRelatedEdges();
}
function drawRelatedEdges(){
 const canvas=$('#mapCanvas');const old=canvas.querySelector('.related-overlay');if(old)old.remove();
 if(!$('#showRelated').checked||!selectedRequirement)return;
 const source=canvas.querySelector(`[data-id="${CSS.escape(selectedRequirement)}"]`);if(!source)return;
 const r=requirements.find(x=>x.id===selectedRequirement);if(!r)return;
 const targets=(r.suggested_links||[]).map(l=>canvas.querySelector(`[data-id="${CSS.escape(l.id)}"]`)).filter(Boolean).slice(0,10);if(!targets.length)return;
 const w=canvas.scrollWidth,h=canvas.scrollHeight,base=canvas.getBoundingClientRect();
 const pos=el=>{const b=el.getBoundingClientRect();return {x:b.left-base.left+canvas.scrollLeft,y:b.top-base.top+canvas.scrollTop,w:b.width,h:b.height};};
 const a=pos(source);let lines='';for(const t of targets){const b=pos(t);const x1=a.x+a.w/2,y1=a.y+a.h/2,x2=b.x+b.w/2,y2=b.y+b.h/2;lines+=`<path d="M ${x1} ${y1} C ${x1+35} ${y1}, ${x2-35} ${y2}, ${x2} ${y2}" fill="none" stroke="#c19b45" stroke-width="1.7" stroke-dasharray="5 4" opacity=".78"/>`;}
 canvas.insertAdjacentHTML('beforeend',`<svg class="related-overlay" aria-hidden="true" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}" style="position:absolute;left:0;top:0;pointer-events:none;overflow:visible;z-index:2">${lines}</svg>`);
}
function renderDetail(){
 window.__oasVueCompletionUnmount?.();
 const panel=$('#detailPanel'),r=requirements.find(x=>x.id===selectedRequirement);
 if(!r){panel.innerHTML='<div class="detail-empty"><div class="compass-icon">✦</div><h3>Choose a requirement</h3><p>Select any node on the map to view its details, update completion, and see related activities.</p></div>';return;}
 const acts=activityFor(r.id); const rel=(r.suggested_links||[]).map(l=>requirements.find(x=>x.id===l.id)).filter(Boolean).slice(0,8);
 let completionHtml='';
 if(groupScope()){
   const names=scopedScoutNames();completionHtml=names.length?names.map(n=>{const rec=recordFor(n,r.id);return `<div class="completion-control"><input type="checkbox" data-complete-scout="${esc(n)}" ${rec.completed?'checked':''}><label>${esc(n)}</label></div>`;}).join(''):'<p class="empty-inline">Import a workbook to add Scouts, or select an individual Scout after importing.</p>';
 }else{const rec=recordFor(selectedScout,r.id);completionHtml=`<div class="completion-control"><input id="detailComplete" type="checkbox" ${rec.completed?'checked':''}><label for="detailComplete">Mark requirement complete</label></div><label class="detail-label" for="completionDate">Completion date (optional)</label><input id="completionDate" class="date-input" type="date" value="${esc(rec.date||'')}"><p class="tiny">Manually marked changes are saved in this browser.</p>`;}
 panel.innerHTML=`<div class="detail-content"><div class="detail-top"><div><p class="eyebrow">STAGE ${r.stage} · ${esc(r.stream.toUpperCase())}</p><h3>${esc(r.text)}</h3></div><button class="close-detail" id="closeDetail" aria-label="Close details">×</button></div><div class="chips"><span class="chip">${esc(r.stream)}</span><span class="chip">Stage ${r.stage}</span>${r.workflow?`<span class="chip">${esc(r.workflow)}</span>`:''}${r.tags.slice(0,3).map(t=>`<span class="chip">${esc(t)}</span>`).join('')}</div><div class="detail-label">Completion</div><div id="scoutCompletionHost">${completionHtml}</div><div class="detail-label">Prerequisites (${(r.prerequisites||[]).length})</div>${(r.prerequisites||[]).length?(r.prerequisites||[]).map(id=>{const pr=requirements.find(x=>x.id===id);const done=!groupScope()&&isCompleted(selectedScout,id);const readyNames=scopedScoutNames().filter(n=>isCompleted(n,id)).length;return `<div class="prerequisite-item ${done?'prereq-done':''}"><span>${done?'✓':groupScope()?`${readyNames}/${scopedScoutNames().length}`:'!'}</span><div><strong>${esc(pr?.text||id)}</strong><p>${pr?`Stage ${pr.stage} · ${esc(pr.stream)}`:'Requirement not found in current data'}${!groupScope()&&!done?' · Outstanding for this Scout':''}</p></div>${pr?`<button data-related="${esc(pr.id)}">Open</button>`:''}</div>`;}).join(''):'<p class="empty-inline">No prerequisite blockers are defined for this requirement.</p>'}<div class="detail-label">Linked activities (${acts.length})</div>${acts.length?acts.map(a=>`<div class="activity-item"><strong>${esc(a.title)}</strong><p>${esc(a.description||'No description supplied.')}${a.duration_minutes?` · ${a.duration_minutes} min`:''}</p>${a.tags?.length?`<p>${a.tags.map(t=>'#'+esc(t)).join(' ')}</p>`:''}</div>`).join(''):'<p class="empty-inline">No activity is linked yet. Load an activity bank or add this requirement ID to an activity’s <code>covers</code> list. Activities suggest opportunities; they do not mark completion.</p>'}<div class="detail-label">Related skills · advisory</div>${rel.length?rel.map(x=>`<div class="related-item"><strong>${esc(x.text)}</strong><p>Stage ${x.stage} · ${esc(x.stream)}</p><button data-related="${esc(x.id)}">Open related skill →</button></div>`).join(''):'<p class="empty-inline">No suggested related links recorded. Formal blockers are listed separately under Prerequisites.</p>'}<p class="tiny">Requirement ID: <code>${esc(r.id)}</code><br>Source: ${esc(r.source||'OAS-Requirements.txt')}</p></div>`;
 $('#closeDetail').addEventListener('click',()=>{selectedRequirement=null;renderMap();renderDetail();});
 const comp=$('#detailComplete');if(comp){comp.addEventListener('change',()=>{window.__oasScoutSaveCompletion(selectedScout,r.id,comp.checked);});$('#completionDate').addEventListener('change',e=>{window.__oasScoutSaveDate(selectedScout,r.id,e.target.value);});}
 panel.querySelectorAll('[data-complete-scout]').forEach(input=>input.addEventListener('change',()=>{window.__oasScoutSaveCompletion(input.dataset.completeScout,r.id,input.checked);}));
 panel.querySelectorAll('[data-related]').forEach(b=>b.addEventListener('click',()=>{selectedRequirement=b.dataset.related;renderMap();renderDetail();}));
 window.__oasVueCompletionMount?.();
}
// Explicit bridge: the Vue island renders nodes, the original application
// remains authoritative for selection, detail changes and relationship lines.
window.__oasTrailmapSnapshot=trailmapMapSnapshot;
window.__oasTrailmapSelect=id=>{selectedRequirement=id;renderMap();renderDetail();};
window.__oasTrailmapDrawRelated=drawRelatedEdges;
window.__oasTrailmapLegacyRender=renderMap;
function renderAll(){renderScoutSelect();renderSummary();renderPlanner();renderMap();renderDetail();}
function fileRead(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onload=()=>resolve(r.result);r.onerror=reject;r.readAsArrayBuffer(file);});}
function parseDateCell(cell){if(!cell)return ''; if(cell.v instanceof Date)return cell.v.toISOString().slice(0,10);if(typeof cell.v==='number'&&window.XLSX?.SSF){const d=XLSX.SSF.parse_date_code(cell.v);if(d)return `${d.y}-${String(d.m).padStart(2,'0')}-${String(d.d).padStart(2,'0')}`;}
 const s=String(cell.w??cell.v??'').trim(); if(!s)return '';let m=s.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{4})$/);if(m){let a=+m[1],b=+m[2],y=m[3];return `${y}-${String(b).padStart(2,'0')}-${String(a).padStart(2,'0')}`;}m=s.match(/^(\d{4})-(\d{2})-(\d{2})/);return m?m[0]:'';}
function cellHighlighted(cell){const fill=cell?.s?.fill;if(!fill)return false;const pattern=fill.patternType||fill.pattern||'';if(!pattern||String(pattern).toLowerCase()==='none')return false;const c=fill.fgColor||fill.bgColor;if(!c)return false;const rgb=String(c.rgb||'').replace(/^FF/i,'').toUpperCase();return !['FFFFFF','FFFFF2','F2F2F2','000000',''].includes(rgb);}
function findReq(stage,stream,text){const key=normalize(text);let matches=requirements.filter(r=>r.stage===stage&&r.stream===stream&&normalize(r.text)===key);if(matches.length)return matches[0];
 // Only allow a close match when the source differs by punctuation/typography; never silently map unrelated requirements.
 matches=requirements.filter(r=>r.stage===stage&&r.stream===stream&&(normalize(r.text).includes(key)||key.includes(normalize(r.text)))&&Math.min(normalize(r.text).length,key.length)/Math.max(normalize(r.text).length,key.length)>.86);return matches.length===1?matches[0]:null;}
function parseWorkbook(wb){const rows=[],scouts=new Set(),unmatched=[];const extraReqs=[];
 for(const sheetName of wb.SheetNames){const m=sheetName.match(/Stage\s*(\d).*?(Camping|Bushwalking|Bushcraft)/i);if(!m)continue;const stage=+m[1],stream=m[2].replace(/^./,c=>c.toUpperCase()),ws=wb.Sheets[sheetName];
  // The supplied pack template has titles above the roster; discover the row containing Scout names.
  const range=XLSX.utils.decode_range(ws['!ref']||'A1:A1');let headerRow=-1;
  for(let rr=range.s.r;rr<=Math.min(range.e.r,12);rr++){let count=0;for(let cc=2;cc<=range.e.c;cc++){const v=ws[XLSX.utils.encode_cell({r:rr,c:cc})]?.v;if(typeof v==='string'&&v.trim()&& !/stage|cub pack|in progress|1st hoppers/i.test(v.toLowerCase()))count++;}if(count>=2){headerRow=rr;break;}}
  if(headerRow<0)continue;
  const roster=[];for(let cc=2;cc<=range.e.c;cc++){const v=ws[XLSX.utils.encode_cell({r:headerRow,c:cc})]?.v;if(typeof v==='string'&&v.trim()){roster.push({col:cc,name:v.trim()});scouts.add(v.trim());}}
  let workflow='Plan';
  for(let rr=headerRow+1;rr<=range.e.r;rr++){
   const a=String(ws[XLSX.utils.encode_cell({r:rr,c:0})]?.v??'').trim();const b=String(ws[XLSX.utils.encode_cell({r:rr,c:1})]?.v??'').trim();if(['Plan','Do','Review','Verify'].includes(a))workflow=a;
   if(!b)continue;
   let req=findReq(stage,stream,b);let supplemental=false;
   if(!req){const id=`s${stage}-${stream.toLowerCase()}-${normalize(b).replace(/[^a-z0-9]+/g,'-').slice(0,48)}`;req={id,stage,stream,text:b,workflow,prerequisites:[],suggested_links:[],tags:[],source:`${sheetName} · row ${rr+1}`,supplemental:true};extraReqs.push(req);unmatched.push({sheet:sheetName,row:rr+1,text:b,workflow});}
   if(!req.workflow)req.workflow=workflow;
   for(const scout of roster){const cell=ws[XLSX.utils.encode_cell({r:rr,c:scout.col})];if(!cell)continue;const date=parseDateCell(cell);const highlighted=cellHighlighted(cell);if(date||highlighted){rows.push({scout:scout.name,id:req.id,completed:true,date,source:'workbook',sourceSheet:sheetName,sourceRow:rr+1,workflow,highlighted:!!highlighted});}}
  }
 }
 return {rows,scouts:[...scouts].sort(),unmatched,extraReqs};
}
function showWorkbookPreview(parsed,fileName){pendingImport=parsed;const panel=$('#previewPanel');const unique=new Set(parsed.rows.map(r=>getKey(r.scout,r.id)));panel.hidden=false;panel.innerHTML=`<h3>Workbook import preview</h3><p><b>${esc(fileName)}</b> · ${parsed.scouts.length} Scouts · ${parsed.rows.length} completed cells across ${unique.size} Scout/requirement pairs · ${parsed.unmatched.length} workbook rows not found verbatim in the requirements source.</p><p>Import adds completion evidence and will not clear existing manual records. Where a cell has both a date and a highlight, the date is retained. Unmatched rows are added as clearly labelled workbook-specific requirements so their evidence is not lost.</p>${parsed.unmatched.length?`<div class="preview-table-wrap"><table class="preview-table"><thead><tr><th>Sheet</th><th>Row</th><th>Workflow</th><th>Requirement text</th></tr></thead><tbody>${parsed.unmatched.slice(0,80).map(x=>`<tr><td>${esc(x.sheet)}</td><td>${x.row}</td><td>${esc(x.workflow)}</td><td><span class="tag-warning">Workbook-only</span> ${esc(x.text)}</td></tr>`).join('')}</tbody></table></div>`:'<p>No unmatched requirement rows found.</p>'}<div class="preview-actions"><button id="applyWorkbook" class="button primary">Apply import</button><button id="cancelWorkbook" class="button secondary">Cancel</button></div>`;
 $('#applyWorkbook').addEventListener('click',()=>{for(const r of parsed.extraReqs)if(!requirements.some(x=>x.id===r.id))requirements.push(r);for(const s of parsed.scouts)if(!scoutRecords[getKey(s,'__roster__')])scoutRecords[getKey(s,'__roster__')]={completed:false,date:'',source:'workbook-roster'};for(const r of parsed.rows){const key=getKey(r.scout,r.id),old=recordFor(r.scout,r.id);scoutRecords[key]={...old,completed:true,date:r.date||old.date||'',source:'workbook',sourceSheet:r.sourceSheet,sourceRow:r.sourceRow,workflow:r.workflow,highlighted:r.highlighted||false};}save();panel.hidden=true;$('#importStatus').textContent=`Imported ${parsed.rows.length} completed cells for ${parsed.scouts.length} Scouts.`;selectedScout='__all__';renderAll();showToast('Workbook progress imported.');pendingImport=null;});
 $('#cancelWorkbook').addEventListener('click',()=>{panel.hidden=true;pendingImport=null;});
}
async function handleWorkbook(file){if(!window.XLSX){$('#importStatus').textContent='Excel reader is still loading. Check your internet connection and try again.';return;}try{const data=await fileRead(file);const wb=XLSX.read(data,{type:'array',cellDates:true,cellStyles:true});const parsed=parseWorkbook(wb);if(!parsed.scouts.length)throw new Error('No Scout roster found. Check that this is an OAS progress workbook.');showWorkbookPreview(parsed,file.name);$('#importStatus').textContent='Preview ready — review the unmatched rows before applying.';}catch(e){$('#importStatus').textContent='Could not read workbook: '+e.message;}}
function parseCsv(text){const rows=[];let row=[],cell='',quoted=false;for(let i=0;i<text.length;i++){const c=text[i];if(c==='"'&&quoted&&text[i+1]==='"'){cell+='"';i++;}else if(c==='"'){quoted=!quoted;}else if(c===','&&!quoted){row.push(cell);cell='';}else if((c==='\n'||c==='\r')&&!quoted){if(c==='\r'&&text[i+1]==='\n')i++;row.push(cell);if(row.some(x=>x.trim()))rows.push(row);row=[];cell='';}else cell+=c;}if(cell||row.length){row.push(cell);rows.push(row);}const headers=(rows.shift()||[]).map(x=>x.trim().toLowerCase());return rows.map(r=>Object.fromEntries(headers.map((h,i)=>[h,(r[i]||'').trim()])));}
function parseActivities(text,ext){if(ext==='csv'){return parseCsv(text).map((x,i)=>({id:x.id||`activity-${i+1}`,title:x.title||x.name||`Activity ${i+1}`,description:x.description||'',duration_minutes:Number(x.duration_minutes)||undefined,tags:(x.tags||'').split(/[;,|]/).map(t=>t.trim()).filter(Boolean),covers:(x.covers||x.requirement_ids||'').split(/[;,|]/).map(t=>t.trim()).filter(Boolean)}));}
 let data;if(ext==='json')data=JSON.parse(text);else{if(!window.jsyaml)throw new Error('YAML parser is not loaded. Try JSON or reconnect to the internet.');data=jsyaml.load(text);}const list=Array.isArray(data)?data:data.activities;if(!Array.isArray(list))throw new Error('Expected an activities list.');return list.map((a,i)=>({...a,id:String(a.id||`activity-${i+1}`),title:String(a.title||a.name||`Activity ${i+1}`),covers:Array.isArray(a.covers)?a.covers:Array.isArray(a.requirement_ids)?a.requirement_ids:[],tags:Array.isArray(a.tags)?a.tags:[]}));}
async function handleActivities(file){try{const text=await file.text(),ext=file.name.split('.').pop().toLowerCase();let imported=parseActivities(text,ext);const known=new Set(requirements.map(r=>r.id));const invalid=imported.flatMap(a=>(a.covers||[]).filter(id=>!known.has(id)).map(id=>({activity:a.title,id})));if(invalid.length){$('#activityStatus').textContent=`Loaded with ${invalid.length} unknown requirement ID(s); check spelling/IDs. Unknown links will not appear on the map.`;imported=imported.map(a=>({...a,covers:a.covers.filter(id=>known.has(id))}));}else $('#activityStatus').textContent=`Read ${imported.length} activities.`;activities=imported;save();renderAll();showToast(`Loaded ${activities.length} activities.`);}catch(e){$('#activityStatus').textContent='Could not load activity bank: '+e.message;}}
function download(name,text,type='application/json'){const blob=new Blob([text],{type}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();URL.revokeObjectURL(url);}
function backup(){download('oas-trailmap-backup.json',JSON.stringify({format:'oas-trailmap-backup',version:1,exportedAt:new Date().toISOString(),requirements,scoutRecords,activities},null,2));}
function restoreBackup(data){if(!data||data.format!=='oas-trailmap-backup'||!data.scoutRecords)throw new Error('This does not look like an OAS Trailmap backup.');scoutRecords=data.scoutRecords;activities=Array.isArray(data.activities)?data.activities:[];if(Array.isArray(data.requirements))requirements=data.requirements;save();renderAll();showToast('Backup restored.');}
async function init(){
 const res=await fetch('data/requirements.json');const data=await res.json();requirements=data.requirements||[];load();renderAll();const tagFilter=$('#mainTagFilter');tagFilter.innerHTML='<option value="">All tags</option>'+plannerTagNames().map(t=>'<option value="'+esc(t)+'">'+esc(t)+'</option>').join('');tagFilter.onchange=renderMap;
 for(const id of ['scoutSelect','stageFilter','streamFilter','statusFilter'])$('#'+id).addEventListener('change',()=>{if(id==='scoutSelect')window.__oasScoutSelect($('#scoutSelect').value);else renderAll();});
 $('#multiScoutBtn').addEventListener('click',()=>{$('#multiScoutPanel').hidden=!$('#multiScoutPanel').hidden;renderScoutSubsetOptions();});
 $('#applyScoutSubset').addEventListener('click',()=>{selectedScoutNames=[...$('#multiScoutOptions').querySelectorAll('input:checked')].map(x=>x.value);if(!selectedScoutNames.length){showToast('Choose at least one Scout.');return;}selectedScout='__subset__';$('#scoutSelect').value='__subset__';$('#multiScoutPanel').hidden=true;renderAll();});
 $('#cancelScoutSubset').addEventListener('click',()=>{$('#multiScoutPanel').hidden=true;});
 $('#searchInput').addEventListener('input',renderMap);$('#showRelated').addEventListener('change',()=>drawRelatedEdges());$('#missingOnly').addEventListener('change',renderMap);$('#plannerMode').addEventListener('change',()=>{renderPlanner();renderMap();});
 $('#plannerTags').addEventListener('change',e=>{if(e.target.matches('input[type=checkbox]')){const tag=e.target.value;if(e.target.checked&&!selectedPlannerTags.includes(tag))selectedPlannerTags.push(tag);else selectedPlannerTags=selectedPlannerTags.filter(t=>t!==tag);renderPlanner();renderMap();}});
 $('#workbookFile').addEventListener('change',e=>{if(e.target.files[0])handleWorkbook(e.target.files[0]);e.target.value='';});
 $('#exportBtn').addEventListener('click',backup);$('#importBackupBtn').addEventListener('click',()=>$('#backupFile').click());$('#backupFile').addEventListener('change',async e=>{const f=e.target.files[0];if(!f)return;try{restoreBackup(JSON.parse(await f.text()));}catch(err){showToast('Backup restore failed: '+err.message);}e.target.value='';});
 window.__oasScoutControlsReady=true;
}
init().catch(e=>{console.error(e);$('#mapCanvas').innerHTML=`<p class="empty-inline">Could not load the requirement data. Serve this folder from a local web server or GitHub Pages rather than opening index.html directly. (${esc(e.message)})</p>`;});