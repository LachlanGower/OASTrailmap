/* Repeat-aware 40-week scheduler, projected Scout progress and replace-with-similar controls.
 * All projections are CONDITIONAL. A scheduled night never awards a requirement.
 */
function requiredTimes(r){const n=Number(r?.required_occurrences);return Number.isInteger(n)&&n>0&&n<=40?n:1;}
function occurrenceState(name,r){
 const record=recordFor(name,r.id),target=requiredTimes(r);
 if(record.completed)return target; // Imported Excel completions and existing manual completions remain authoritative.
 const evidence=Array.isArray(record.sessionEvidence)?new Set(record.sessionEvidence).size:0;
 return Math.min(target,Math.max(evidence,Number(record.occurrences)||0));
}
function scheduleOccurrenceCounts(weeks){
 const counts=new Map();
 for(const w of weeks)for(const id of new Set(w.requirementIds||[]))counts.set(id,(counts.get(id)||0)+1);
 return counts;
}
function forecastModel(weeks=studio.schedule,names=scheduleScope()){
 const marks=[],scouts=names.map(name=>{
  const counts=new Map(requirements.map(r=>[r.id,occurrenceState(name,r)]));
  const done=new Set(requirements.filter(r=>counts.get(r.id)>=requiredTimes(r)).map(r=>r.id));
  return {name,counts,done};
 });
 const initial=scouts.length?scouts.reduce((n,s)=>n+s.done.size,0)/scouts.length:0;
 const readiness=(s,r,weekSet)=> (r.prerequisites||[]).every(id=>s.done.has(id)||weekSet.has(id)&&s.counts.get(id)>=requiredTimes(byId(id)));
 for(let i=0;i<weeks.length;i++){
  const ids=[...new Set(weeks[i].requirementIds||[])];
  for(const s of scouts){
   for(const id of ids){
    const r=byId(id);if(!r||s.done.has(id))continue;
    s.counts.set(id,Math.min(requiredTimes(r),(s.counts.get(id)||0)+1));
   }
   // Resolve same-night prerequisites in topological passes, without assuming completion before the last occurrence.
   for(let pass=0;pass<ids.length;pass++){
    let changed=false;
    for(const id of ids){
     const r=byId(id);if(!r||s.done.has(id))continue;
     if((s.counts.get(id)||0)>=requiredTimes(r)&&readiness(s,r,new Set(ids))){s.done.add(id);changed=true;}
    }
    if(!changed)break;
   }
  }
  marks.push({week:i+1,mean:scouts.length?scouts.reduce((n,s)=>n+s.done.size,0)/scouts.length:0,scouts:scouts.length});
 }
 return {initial,marks,final:marks.length?marks[marks.length-1].mean:initial,scouts,limit:requirements.length};
}
function buildRepeatSchedule(keepLocks=false){
 const total=studio.weeks,names=scheduleScope(),prior=new Map();
 if(keepLocks)studio.schedule.forEach((w,i)=>{if(i<total&&w.locked)prior.set(i,structuredClone(w));});
 const reserved=scheduleOccurrenceCounts([...prior.values()]);
 const plan=Array.from({length:total},(_,i)=>prior.get(i)||{id:'week-'+(i+1),title:'',tags:[],capacity:studio.capacity,requirementIds:[],locked:false,activity:null,reviewed:false,sessionMinutes:90});
 const states=names.map(name=>({name,done:new Set(requirements.filter(r=>isCompleted(name,r.id)).map(r=>r.id)),counts:new Map(requirements.map(r=>[r.id,occurrenceState(name,r)]))}));
 const used=new Map(reserved);
 function applyWeek(ids){
  for(const state of states){
   for(const id of new Set(ids)){
    const r=byId(id);if(r&&!state.done.has(id))state.counts.set(id,Math.min(requiredTimes(r),(state.counts.get(id)||0)+1));
   }
   for(let pass=0;pass<ids.length;pass++){
    let changed=false;
    for(const id of ids){
     const r=byId(id);if(!r||state.done.has(id)||state.counts.get(id)<requiredTimes(r))continue;
     if((r.prerequisites||[]).every(p=>state.done.has(p))){state.done.add(id);changed=true;}
    }
    if(!changed)break;
   }
  }
 }
 for(let i=0;i<total;i++){
  const w=plan[i];if(w.locked){applyWeek(w.requirementIds||[]);continue;}
  const capacity=Math.max(1,Math.min(12,Number(w.capacity)||studio.capacity));
  const chosen=[],tags=new Set();
  for(let slot=0;slot<capacity;slot++){
   let best=null,bestScore=-Infinity;
   for(const r of requirements){
    const target=requiredTimes(r),previous=used.get(r.id)||0;
    if(previous>=target||chosen.includes(r.id))continue;
    const missing=(r.prerequisites||[]).filter(p=>!states.every(s=>s.done.has(p)||chosen.includes(p)&&requiredTimes(byId(p))===1));
    const remaining=names.length?states.filter(s=>!s.done.has(r.id)).length:1;
    const ready=names.length?states.filter(s=>!s.done.has(r.id)&&(r.prerequisites||[]).every(p=>s.done.has(p)||chosen.includes(p)&&requiredTimes(byId(p))===1)).length:1;
    const tagOverlap=(r.tags||[]).filter(t=>tags.has(t)).length;
    const locs=[r.locations?.preferred,...(r.locations?.alternatives||[])].filter(Boolean);
    const selectedLocs=chosen.map(id=>byId(id)?.locations?.preferred).filter(Boolean);
    const shared=selectedLocs.length?locs.some(x=>selectedLocs.includes(x)):false;
    const external=locs.some(x=>x.toLowerCase().includes('external'));
    const externalPoints=external?((studio.externalWeeks||[]).includes(i+1)?26:-15):0;
    const progress=remaining*8+ready*5+descendantsCount(r.id)*2;
    const progressWeight=studio.strategy==='location'?.35:studio.strategy==='balanced'?.7:1;
    const locationPoints=selectedLocs.length?(shared?22:-9):0;
    const locationWeight=studio.strategy==='location'?3:studio.strategy==='balanced'?1.8:.2;
    const score=progress*progressWeight+tagOverlap*9+locationPoints*locationWeight+externalPoints-missing.length*35+(previous>0?5:0)-(r.stage||1)*.01;
    if(score>bestScore){best=r;bestScore=score;}
   }
   if(!best)break;
   chosen.push(best.id);best.tags?.forEach(t=>tags.add(t));used.set(best.id,(used.get(best.id)||0)+1);
  }
  w.requirementIds=orderSession(chosen);
  w.tags=uniq(chosen.flatMap(id=>byId(id)?.tags||[])).slice(0,5);
  w.title=w.tags[0]||'Week '+(i+1);
  w.location=chosen.map(id=>byId(id)?.locations?.preferred).filter(Boolean)[0]||'Flexible / anywhere';
  w.activity=null;w.activityIds=undefined;w.confirmedSession=false;w.reviewed=false;
  applyWeek(w.requirementIds);
 }
 return plan;
}
buildSchedule=buildRepeatSchedule;
function similarCandidates(index,id){
 const week=studio.schedule[index],reference=byId(id),used=scheduleOccurrenceCounts(studio.schedule);
 if(!reference||!week)return [];
 const usedElsewhere=new Map(used);usedElsewhere.set(id,(usedElsewhere.get(id)||0)-1);
 const otherIds=new Set((week.requirementIds||[]).filter(x=>x!==id));
 const earlier=new Set(studio.schedule.slice(0,index).flatMap(w=>w.requirementIds||[]));
 const refTags=new Set(reference.tags||[]),locs=[reference.locations?.preferred,...(reference.locations?.alternatives||[])].filter(Boolean);
 return requirements.filter(r=>r.id!==id&&!otherIds.has(r.id)&&(usedElsewhere.get(r.id)||0)<requiredTimes(r))
 .map(r=>{
  const sharedTags=(r.tags||[]).filter(t=>refTags.has(t)).length;
  const locations=[r.locations?.preferred,...(r.locations?.alternatives||[])].filter(Boolean);
  const shareLocation=locs.some(x=>locations.includes(x));
  const sameStream=r.stream===reference.stream;
  const prereqs=(r.prerequisites||[]).every(p=>isCompletedInScope(p)||earlier.has(p)||otherIds.has(p));
  return {r,score:sharedTags*5+(sameStream?7:0)+(shareLocation?5:0)+(r.stage===reference.stage?2:0)+(prereqs?4:-15),ready:prereqs};
 }).sort((a,b)=>b.score-a.score||a.r.text.localeCompare(b.r.text)).slice(0,25);
}
function isCompletedInScope(id){const names=scheduleScope();return names.length>0&&names.every(name=>isCompleted(name,id));}
function swapPanel(index,id){
 const candidates=similarCandidates(index,id);
 return '<div class="swap-selector"><p class="tiny">Replace this requirement with a similar skill. Selecting a replacement locks this week to protect your change during regeneration.</p>'+
 '<label>Replacement skill <select data-swap-choice><option value="">Choose a similar requirement…</option>'+
 candidates.map(c=>'<option value="'+esc(c.r.id)+'">'+esc(c.r.text.slice(0,105))+' · '+(c.ready?'Prerequisites planned':'Check prerequisites')+' · '+requiredTimes(c.r)+' night(s)</option>').join('')+'</select></label>'+
 '<button type="button" class="button primary" data-swap-apply="'+index+'">Apply replacement</button><button type="button" class="button secondary" data-swap-cancel>Cancel</button></div>';
}
function enhanceRequirementSwaps(){
 const grid=$('#scheduleWeeksGrid');if(!grid)return;
 grid.querySelectorAll('.week-card').forEach((card,i)=>{
  const w=studio.schedule[i];if(!w)return;
  const list=card.querySelector('ol');if(!list)return;
  const items=list.querySelectorAll('li');
  items.forEach((li,j)=>{
   const id=w.requirementIds[j],r=byId(id);if(!r)return;
   const count=requiredTimes(r),total=scheduleOccurrenceCounts(studio.schedule).get(id)||0;
   li.insertAdjacentHTML('beforeend',' <small class="repeat-count">'+(count>1?'Needs '+count+' separate nights · planned '+total+'/'+count+' ('+esc(r.occurrence_basis||'inferred')+')':'1 night')+'</small> <button type="button" class="button secondary swap-open" '+(w.locked?'disabled title="Unlock the week before replacing requirements"':'')+' data-swap-open="'+j+'">Swap similar</button>');
  });
  card.querySelectorAll('[data-swap-open]').forEach(b=>b.onclick=()=>{
   const li=b.closest('li'),j=Number(b.dataset.swapOpen),id=w.requirementIds[j];
   card.querySelectorAll('.swap-selector').forEach(p=>p.remove());
   li.insertAdjacentHTML('beforeend',swapPanel(i,id));
   const panel=li.querySelector('.swap-selector');
   panel.querySelector('[data-swap-cancel]').onclick=()=>panel.remove();
   panel.querySelector('[data-swap-apply]').onclick=()=>{
    const replacement=panel.querySelector('[data-swap-choice]').value;
    if(!replacement)return;
    const candidate=similarCandidates(i,id).find(c=>c.r.id===replacement);
    if(!candidate)return;
    if(!candidate.ready&&!confirm('The replacement may need prerequisite skills that are not completed or scheduled earlier. Continue?'))return;
    if(typeof dataCheckpoint==='function')dataCheckpoint('Before swapping a scheduled requirement',['schedule']);
    w.requirementIds[j]=replacement;w.requirementIds=orderSession(w.requirementIds);
    w.tags=uniq(w.requirementIds.flatMap(x=>byId(x)?.tags||[])).slice(0,5);
    w.locked=true;w.confirmedSession=false;w.activityIds=undefined;w.reviewed=false;
    saveSchedule();showToast('Requirement replaced; week locked to preserve your choice.');
   };
  });
 });
}
function forecastMarkup(){
 const names=scheduleScope(),model=forecastModel();
 if(!studio.schedule.length)return '<p class="muted">Generate a schedule to see forecasted requirement progress.</p>';
 const W=920,H=250,left=58,right=28,top=22,bottom=43,maxY=Math.max(10,requirements.length);
 const x=i=>left+i*(W-left-right)/Math.max(1,studio.schedule.length);
 const y=value=>H-bottom-(value/maxY)*(H-top-bottom);
 const points=[[x(0),y(model.initial)],...model.marks.map(m=>[x(m.week),y(m.mean)])];
 const path=points.map((p,i)=>(i?'L':'M')+p.map(n=>n.toFixed(1)).join(' ')).join(' ');
 const ticks=[0,.25,.5,.75,1].map(f=>Math.round(maxY*f)).map(v=>'<line x1="'+left+'" y1="'+y(v)+'" x2="'+(W-right)+'" y2="'+y(v)+'" stroke="#dbe6dc"/><text x="'+(left-10)+'" y="'+(y(v)+4)+'" text-anchor="end" font-size="11" fill="#466354">'+v+'</text>').join('');
 const scheduled=scheduleOccurrenceCounts(studio.schedule),unmet=requirements.filter(r=>requiredTimes(r)>1&&(scheduled.get(r.id)||0)<requiredTimes(r));
 return '<section class="forecast-panel"><h3>Forecasted Scout requirement progress</h3><p class="muted tiny">Conditional projection: assumes selected Scouts attend all planned sessions, demonstrate the requirements, and a leader confirms each achievement. No progress is recorded by this chart. Existing Excel/manual completions are treated as achieved.</p>'+
 '<div class="forecast-summary"><span><strong>'+model.initial.toFixed(1)+'</strong> average requirements already completed per Scout</span><span><strong>'+model.final.toFixed(1)+'</strong> forecast after '+studio.schedule.length+' weeks</span><span><strong>'+names.length+'</strong> Scouts in forecast</span></div>'+
 (!names.length?'<p>Select Scouts above to see an individual progress forecast; curriculum-only planning shows no Scout forecast.</p>':
 '<svg viewBox="0 0 '+W+' '+H+'" role="img" aria-label="Line chart: average projected completed requirements per Scout, week zero through the final week."><title>Forecast of Scout requirement completion by week</title>'+
 ticks+'<line x1="'+left+'" y1="'+(H-bottom)+'" x2="'+(W-right)+'" y2="'+(H-bottom)+'" stroke="#466354"/>'+
 '<path d="'+path+'" fill="none" stroke="#276b50" stroke-width="3" stroke-linejoin="round"/>'+
 '<circle cx="'+x(0)+'" cy="'+y(model.initial)+'" r="4" fill="#276b50"/><circle cx="'+x(model.marks.length)+'" cy="'+y(model.final)+'" r="4" fill="#276b50"/>'+
 '<text x="'+left+'" y="'+(H-12)+'" font-size="12">Week 0</text><text x="'+(W-right)+'" y="'+(H-12)+'" text-anchor="end" font-size="12">Week '+studio.schedule.length+'</text>'+
 '<text x="8" y="13" font-size="11">Requirements completed (average)</text></svg>')+
 '<details><summary>Repeat requirements needing more scheduled nights ('+unmet.length+')</summary>'+(!unmet.length?'<p>All repeated requirements have enough planned sessions.</p>':'<ul>'+unmet.map(r=>'<li>'+esc(r.text)+' — '+(scheduled.get(r.id)||0)+' / '+requiredTimes(r)+' '+esc(r.occurrence_unit||'sessions')+' ('+esc(r.occurrence_basis||'inferred')+')</li>').join('')+'</ul>')+'</details></section>';
}
function enhanceForecast(){
 const node=$('#forecastProgress');if(node)node.innerHTML=forecastMarkup();
 enhanceRequirementSwaps();
}
const forecastPriorRender=renderSchedule;
renderSchedule=function(){forecastPriorRender();enhanceForecast()};
function reviewWeekWithOccurrences(index){
 const week=studio.schedule[index],box=$('#week-review-'+index);if(!week||!box)return;
 box.hidden=!box.hidden;if(box.hidden)return;
 const names=scopedScoutNames(),reqs=(week.requirementIds||[]).map(byId).filter(Boolean),key=week.id||('week-'+(index+1));
 box.innerHTML='<div class="review-panel"><h4>Leader review · Week '+(index+1)+'</h4><p class="tiny muted">A tick records evidence from this particular night, not an immediate completion for requirements that need multiple separate nights. Previously imported achievements remain intact.</p>'+
 (!names.length?'<p>Import or select Scouts to review completions.</p>':reqs.map(r=>'<div class="review-skill"><strong>'+esc(r.text)+'</strong><p class="tiny">Needs '+requiredTimes(r)+' '+esc(r.occurrence_unit||'session(s)')+' · '+esc(r.occurrence_basis||'inferred')+'</p>'+
 names.map(n=>{const v=recordFor(n,r.id),seen=(v.sessionEvidence||[]).includes(key);return '<label><input type="checkbox" data-review-scout="'+esc(n)+'" data-review-req="'+esc(r.id)+'" '+(seen?'checked':'')+'>'+esc(n)+' · '+occurrenceState(n,r)+' / '+requiredTimes(r)+' evidence opportunities</label>'}).join('')+'</div>').join(''))+
 '<button type="button" class="button primary" id="forecastSaveReview">Save this night’s evidence</button></div>';
 $('#forecastSaveReview').onclick=()=>{
  for(const input of box.querySelectorAll('[data-review-req]')){
   const name=input.dataset.reviewScout,id=input.dataset.reviewReq,r=byId(id),k=getKey(name,id),prev=recordFor(name,id);
   const evidence=new Set(prev.sessionEvidence||[]);
   if(input.checked)evidence.add(key);else evidence.delete(key);
   const baseline=prev.completed&&prev.source!=='session-review';
   const initialCount=Number(prev.occurrences)||0;
   const otherCount=Math.max(0,initialCount-(Array.isArray(prev.sessionEvidence)?prev.sessionEvidence.length:0));
   const count=Math.min(requiredTimes(r),otherCount+evidence.size);
   const completed=baseline||count>=requiredTimes(r);
   scoutRecords[k]={...prev,sessionEvidence:[...evidence],occurrences:count,completed,date:completed?(prev.date||new Date().toISOString().slice(0,10)):'',source:baseline?prev.source:'session-review'};
  }
  week.reviewed=true;save();saveSchedule();renderAll();showToast('Evidence from Week '+(index+1)+' saved. Repeated requirements complete only after all required nights.');
 };
}
reviewWeek=reviewWeekWithOccurrences;
