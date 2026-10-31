/* Local-only mapper + schedule studio. Uses app.js shared data, never sends records anywhere. */
const STUDIO_KEY='oas-studio-v1';
let studio={trees:[],order:{},tags:[],schedule:[],history:[],strategy:'progress',weeks:40,capacity:4,treeGraphs:{},externalWeeks:[]};
let activeTree='', editingReq='',studioMode='trail';
const byId=id=>requirements.find(r=>r.id===id);
const uniq=a=>[...new Set(a)];
function readStudio(){try{const old=JSON.parse(localStorage.getItem(STUDIO_KEY)||'{}');studio={...studio,...old};studio.treeGraphs=studio.treeGraphs||{};}catch{};studio.trees=uniq([...studio.trees,...requirements.map(r=>r.tree||r.stream||'Other')]);studio.tags=uniq([...studio.tags,...requirements.flatMap(r=>r.tags||[])]).sort();activeTree=activeTree||studio.trees[0]||'Other';}
function writeStudio(){try{localStorage.setItem(STUDIO_KEY,JSON.stringify(studio));const status=$('#localSaveStatus');if(status)status.textContent='Saved locally · '+new Date().toLocaleTimeString();}catch{showToast('Could not save studio state; export a backup.');}}
function snapshot(title='Automatic checkpoint'){studio.history.unshift({title,at:new Date().toISOString(),requirements:JSON.parse(JSON.stringify(requirements)),trees:[...studio.trees],tags:[...studio.tags],order:structuredClone(studio.order),treeGraphs:structuredClone(studio.treeGraphs)});studio.history=studio.history.slice(0,20);writeStudio();}
function setReqData(){save();writeStudio();renderAll();renderTree();renderSchedule();}
function treeFor(r){return r.tree||r.stream||'Other';}
function setMode(mode){if($('#weeklyThemes'))$('#weeklyThemes').hidden=true;if($('#requirementsWorkspace'))$('#requirementsWorkspace').hidden=true;if(typeof dataView==='function')dataView('regular');studioMode=mode;$('#trailWorkspace').hidden=mode!=='trail';$('#treeStudio').hidden=mode!=='tree';$('#scheduleStudio').hidden=mode!=='schedule';document.querySelectorAll('[data-mode]').forEach(b=>{b.classList.toggle('primary',b.dataset.mode===mode);b.classList.toggle('secondary',b.dataset.mode!==mode);});if(mode==='tree')renderTree();if(mode==='schedule')renderSchedule();}
function treeOrder(rs){
 const key=activeTree;const order=studio.order[key]||[];
 return [...rs].sort((a,b)=>{const ai=order.indexOf(a.id),bi=order.indexOf(b.id);return (ai<0?99999:ai)-(bi<0?99999:bi)||a.text.localeCompare(b.text);});
}
// Per-tree relationship layers are optional; the master remains authoritative for Scout progress.
function customGraphActive(){return !activeTree.startsWith('tag::') && studio.treeGraphs?.[activeTree]?.mode==='custom';}
function mapperLinks(r){
 const override=customGraphActive()?studio.treeGraphs[activeTree].nodes?.[r.id]:null;
 return override ? {prerequisites:override.prerequisites||[],suggested_links:override.suggested_links||[]} : {prerequisites:r.prerequisites||[],suggested_links:r.suggested_links||[]};
}
function setTreeGraphMode(mode){
 if(activeTree.startsWith('tag::'))return;
 if(mode==='custom'&&!studio.treeGraphs[activeTree]?.nodes){
  snapshot('Before creating custom links for '+activeTree);
  studio.treeGraphs[activeTree]={mode:'custom',nodes:Object.fromEntries(treeSelectionRequirements().map(r=>[r.id,structuredClone(mapperLinks(r))]))};
 }else if(mode==='master'){
  studio.treeGraphs[activeTree]=studio.treeGraphs[activeTree]||{nodes:{}};
  studio.treeGraphs[activeTree].mode='master';
 }else studio.treeGraphs[activeTree].mode='custom';
 writeStudio();renderTree();
}
function mapperCycle(id,parents){
 const visiting=new Set(),done=new Set();
 function visit(n){if(visiting.has(n))return true;if(done.has(n))return false;visiting.add(n);
  const r=byId(n), links=n===id?parents:(r?mapperLinks(r).prerequisites:[]);
  for(const p of links)if(visit(p))return true;
  visiting.delete(n);done.add(n);return false;
 }
 return requirements.some(r=>visit(r.id));
}
function saveMapperLinks(id,parents,recommended){
 const r=byId(id);if(!r)return false;
 const previous=mapperLinks(r).prerequisites||[];
 const hasAdditions=parents.some(parent=>!previous.includes(parent));
 if(parents.includes(id)||(hasAdditions&&mapperCycle(id,parents))){showToast('Cannot add this link: it would create a prerequisite cycle.');return false;}
 snapshot('Before editing '+(customGraphActive()?activeTree+' tree':'master')+' links for '+id);
 const payload={prerequisites:uniq(parents),suggested_links:uniq(recommended).filter(p=>p!==id).map(p=>({id:p,reason:'Recommended learning path'}))};
 if(customGraphActive())studio.treeGraphs[activeTree].nodes[id]=payload;
 else {r.prerequisites=payload.prerequisites;r.suggested_links=payload.suggested_links;}
 setReqData();return true;
}
// The prerequisite edge belongs to the child, including when editing incoming links.
function disconnectLink(childId,parentId,type='mandatory'){
 const child=byId(childId),parent=byId(parentId);
 if(!child||!parent)return;
 const links=mapperLinks(child);
 const present=type==='recommended'?links.suggested_links.some(x=>x.id===parentId):links.prerequisites.includes(parentId);
 if(!present)return;
 const parents=type==='mandatory'?links.prerequisites.filter(id=>id!==parentId):links.prerequisites;
 const recommended=type==='recommended'?links.suggested_links.filter(x=>x.id!==parentId).map(x=>x.id):links.suggested_links.map(x=>x.id);
 if(saveMapperLinks(childId,parents,recommended))showToast('Connection removed from '+(customGraphActive()?'this tree':'the master')+'.');
}
function quickLink(targetId,action){
 const selected=byId(editingReq),target=byId(targetId);if(!selected||!target||selected.id===target.id)return;
 const child=action.endsWith('parent')?selected:target,parent=action.endsWith('parent')?target:selected;
 if(action.startsWith('remove-')){disconnectLink(child.id,parent.id);return;}
 const links=mapperLinks(child);
 if(links.prerequisites.includes(parent.id)){showToast('This mandatory prerequisite is already linked.');return;}
 saveMapperLinks(child.id,[...links.prerequisites,parent.id],links.suggested_links.map(x=>x.id));
}

function validateTreeGraphs(graphs,list){
 if(!graphs||typeof graphs!=='object'||Array.isArray(graphs))throw Error('Malformed tree graph data');
 const ids=new Set(list.map(r=>r.id));
 for(const [tree,g] of Object.entries(graphs)){
  if(!g||!['master','custom'].includes(g.mode)||!g.nodes||typeof g.nodes!=='object')throw Error('Invalid tree graph '+tree);
  for(const [id,links] of Object.entries(g.nodes)){
   if(!ids.has(id)||!Array.isArray(links.prerequisites)||!Array.isArray(links.suggested_links))throw Error('Invalid tree link node '+id);
   for(const parent of links.prerequisites)if(!ids.has(parent))throw Error('Unknown tree prerequisite '+parent);
   for(const link of links.suggested_links)if(!ids.has(link.id))throw Error('Unknown recommended link');
  }
 }
}
function treeLevels(rs){
 // The depth is calculated from the complete prerequisite network, so a tag view
 // does not make a later skill appear foundational just because its parent is hidden.
 const cache=new Map(),visiting=new Set();
 function depth(id){if(cache.has(id))return cache.get(id);if(visiting.has(id))return 0;visiting.add(id);const r=byId(id);const d=Math.min(20,Math.max(0,...(r?mapperLinks(r).prerequisites:[]).map(x=>depth(x)+1)));visiting.delete(id);cache.set(id,d);return d;}
 rs.forEach(r=>depth(r.id));return cache;
}
function treeSelectionRequirements(){return activeTree.startsWith('tag::')?requirements.filter(r=>(r.tags||[]).includes(activeTree.slice(5))):requirements.filter(r=>treeFor(r)===activeTree);}
// All business rules and administration writes stay in the original mapper.
window.__oasTreeAdminSnapshot=()=>({
 trees:[...studio.trees],tags:[...studio.tags],active:activeTree,
 isTag:activeTree.startsWith('tag::'),
 graphMode:customGraphActive()?'custom':'master',
 graphHint:activeTree.startsWith('tag::')?'Tag views show the master relationship graph.':
  customGraphActive()?'Editing this tree’s own prerequisite links; the master and Scout progress stay unchanged.':
   'Editing shared master links, which drive Scout progress and scheduling.'
});
function treeSelectorOptions(){return `<optgroup label="Skill trees">${studio.trees.map(t=>`<option value="${esc(t)}">${esc(t)}</option>`).join('')}</optgroup><optgroup label="Tag views">${studio.tags.map(t=>`<option value="tag::${esc(t)}"># ${esc(t)}</option>`).join('')}</optgroup>`;}
function renderTree(){
 const viewport=document.querySelector('.tree-canvas-wrap'),oldX=viewport?.scrollLeft||0,oldY=viewport?.scrollTop||0;
 if(!studio.trees.includes(activeTree)&&!activeTree.startsWith('tag::'))activeTree=studio.trees[0];
 if(activeTree.startsWith('tag::')&&!studio.tags.includes(activeTree.slice(5)))activeTree=studio.trees[0];
 const isTag=activeTree.startsWith('tag::');
 if(window.__oasTreeAdminRefresh){
  window.__oasTreeAdminRefresh();
 }else{
  $('#treeSelect').innerHTML=treeSelectorOptions();$('#treeSelect').value=activeTree;
  $('#renameTree').disabled=isTag;$('#newTree').disabled=false;$('#treeGraphMode').disabled=isTag;$('#treeGraphMode').value=customGraphActive()?'custom':'master';$('#treeGraphHint').textContent=isTag?'Tag views show the master relationship graph.':customGraphActive()?'Editing this tree’s own prerequisite links; the master and Scout progress stay unchanged.':'Editing shared master links, which drive Scout progress and scheduling.';
 }
 let rs=treeOrder(treeSelectionRequirements());
 if($('#treeFocus')?.checked&&editingReq){
  const visible=new Set([editingReq]),todo=[editingReq];
  while(todo.length){const id=todo.pop(),r=byId(id);if(!r)continue;const related=[...mapperLinks(r).prerequisites,...requirements.filter(x=>mapperLinks(x).prerequisites.includes(id)).map(x=>x.id)];for(const other of related)if(!visible.has(other)){visible.add(other);todo.push(other);}}
  rs=rs.filter(r=>visible.has(r.id));
 }
 const levels=treeLevels(rs);
 // Within a depth, show related parents and children close to one another.
 const columns=new Map();rs.forEach(r=>{const n=levels.get(r.id)||0;if(!columns.has(n))columns.set(n,[]);columns.get(n).push(r);});
 const ordered=[...columns].sort((a,b)=>a[0]-b[0]);const position=new Map();
 ordered.forEach(([level,items],index)=>{
   const explicit=studio.order[activeTree];
   if(!explicit?.length&&index>0)items.sort((a,b)=>{
     const bary=r=>{const ps=mapperLinks(r).prerequisites.filter(id=>position.has(id));return ps.length?ps.reduce((sum,id)=>sum+position.get(id),0)/ps.length:999;};
     return bary(a)-bary(b)||a.text.localeCompare(b.text);
   });
   items.forEach((r,i)=>position.set(r.id,i));
 });
 // Vue only renders cards; legacy remains the authority for graph links and ordering.
 const viewSnapshot={
  isTag,name:isTag?activeTree.slice(5):activeTree,count:rs.length,
  lanes:ordered.map(([depth,items])=>({depth,cards:items.map(r=>{
   const links=mapperLinks(r),selected=!!editingReq&&editingReq!==r.id;
   const selectedLinks=selected?mapperLinks(byId(editingReq)):null;
   const isParent=!!selectedLinks?.prerequisites.includes(r.id);
   const isChild=!!selected&&links.prerequisites.includes(editingReq);
   return {
    id:r.id,text:r.text,tree:treeFor(r),stage:r.stage,depth,
    readyCount:readyScoutCount(r),prerequisites:links.prerequisites.length,
    recommended:links.suggested_links.length,active:editingReq===r.id,
    actions:!selected?null:[
     {action:isParent?'remove-parent':'parent',
      label:(isParent?'Remove as parent of':'Add as parent of')+' selected skill',
      title:isParent?'Break parent link':'Add as parent',
      symbol:isParent?'×':'↑',unlink:isParent},
     {action:isChild?'remove-child':'child',
      label:(isChild?'Remove as child of':'Add as child of')+' selected skill',
      title:isChild?'Break child link':'Add as child',
      symbol:isChild?'×':'↓',unlink:isChild}
    ]
   };
  })}))
 };
 window.__oasTreeLatestSnapshot=viewSnapshot;
 if(typeof window.__oasVueTreeRender==='function'){
  try{
   if(window.__oasVueTreeRender(viewSnapshot)){
    if(viewport){viewport.scrollLeft=oldX;viewport.scrollTop=oldY;}
    renderTreeEditor();return;
   }
  }catch(error){
   console.warn('Vue tree update failed; retaining legacy tree canvas.',error);
   window.__oasVueTreeRender=undefined;
   delete document.documentElement.dataset.oasTreeRenderer;
  }
 }
 let html=`<div class="tree-view-note">${isTag?`<b>Tag view:</b> ${esc(activeTree.slice(5))} · ${rs.length} matching skills across all trees.`:`<b>Skill tree:</b> ${esc(activeTree)} · ${rs.length} skills.`} <span>Solid green = mandatory; dashed amber = recommended. Select a skill, then use ↑ or ↓ to connect another node, or × to break an existing link. Drag to reorder within a column.</span></div><div class="tree-lanes">`;
 for(const [level,items] of ordered){html+=`<div class="tree-lane" data-depth="${level}"><h3>${level===0?'Foundations':`Depth ${level+1}`}</h3>`;
 for(const r of items){const n=readyScoutCount(r),ln=mapperLinks(r),selected=editingReq&&editingReq!==r.id;html+=`<div role="button" tabindex="0" draggable="true" class="tree-node ${editingReq===r.id?'active':''}" data-tree-id="${esc(r.id)}" aria-label="Select skill: ${esc(r.text)}" title="${esc(r.text)}"><strong>${esc(r.text)}</strong><small>${esc(treeFor(r))} · Stage ${esc(r.stage)} · ${n} ready</small><small>${ln.prerequisites.length} mandatory · ${ln.suggested_links.length} recommended</small>${selected?(()=>{const selectedLinks=mapperLinks(byId(editingReq)),isParent=selectedLinks.prerequisites.includes(r.id),isChild=ln.prerequisites.includes(editingReq);return `<div class="tree-quick-actions"><button type="button" class="tree-quick-link ${isParent?'unlink':''}" data-quick-link="${isParent?'remove-parent':'parent'}" aria-label="${isParent?'Remove as parent of':'Add as parent of'} selected skill" title="${isParent?'Break parent link':'Add as parent'}">${isParent?'×':'↑'}</button><button type="button" class="tree-quick-link ${isChild?'unlink':''}" data-quick-link="${isChild?'remove-child':'child'}" aria-label="${isChild?'Remove as child of':'Add as child of'} selected skill" title="${isChild?'Break child link':'Add as child'}">${isChild?'×':'↓'}</button></div>`;})():''}</div>`;}html+='</div>';
 }html+='</div><svg id="treeEdges" class="tree-edges" aria-hidden="true"></svg>';
 $('#treeCanvas').innerHTML=html;
 if(viewport){viewport.scrollLeft=oldX;viewport.scrollTop=oldY;}
 $('#treeCanvas').querySelectorAll('.tree-node').forEach(b=>{
  b.addEventListener('click',e=>{if(e.target.closest('[data-quick-link]'))return;editingReq=b.dataset.treeId;renderTree();});b.addEventListener('keydown',e=>{if((e.key==='Enter'||e.key===' ')&&e.target===b){e.preventDefault();editingReq=b.dataset.treeId;renderTree();}});b.querySelectorAll('[data-quick-link]').forEach(btn=>btn.addEventListener('click',e=>{e.stopPropagation();quickLink(b.dataset.treeId,btn.dataset.quickLink);}));
  b.addEventListener('dragstart',e=>{e.dataTransfer.setData('text/plain',b.dataset.treeId);e.dataTransfer.effectAllowed='move';});
  b.addEventListener('dragover',e=>e.preventDefault());
  b.addEventListener('drop',e=>{e.preventDefault();const id=e.dataTransfer.getData('text/plain'),target=b.dataset.treeId;if(!id||id===target||!byId(id))return;
    const level1=levels.get(id),level2=levels.get(target);if(level1!==level2){showToast('Reorder within the same depth; prerequisite arrows determine depth.');return;}
    const all=treeOrder(treeSelectionRequirements()).map(r=>r.id);all.splice(all.indexOf(id),1);all.splice(all.indexOf(target),0,id);studio.order[activeTree]=all;writeStudio();renderTree();
  });
 });requestAnimationFrame(drawTreeEdges);renderTreeEditor();
}
function drawTreeEdges(){
 const svg=$('#treeEdges'),box=$('#treeCanvas');if(!svg||!box||studioMode!=='tree')return;
 const root=box.getBoundingClientRect(),width=box.scrollWidth,height=box.scrollHeight;svg.setAttribute('viewBox',`0 0 ${width} ${height}`);svg.setAttribute('width',width);svg.setAttribute('height',height);
 const lookup=new Map([...box.querySelectorAll('[data-tree-id]')].map(b=>[b.dataset.treeId,b]));
 const pos=id=>{const b=lookup.get(id);if(!b)return null;const r=b.getBoundingClientRect();return {x:r.left-root.left+box.scrollLeft,y:r.top-root.top+box.scrollTop,w:r.width,h:r.height};};
 const selected=byId(editingReq), related=new Set(selected?[editingReq,...mapperLinks(selected).prerequisites,...mapperLinks(selected).suggested_links.map(x=>x.id),...requirements.filter(r=>mapperLinks(r).prerequisites.includes(editingReq)||mapperLinks(r).suggested_links.some(x=>x.id===editingReq)).map(r=>r.id)]:[]);
 lookup.forEach((el,id)=>{el.classList.toggle('tree-connected',!!selected&&related.has(id));el.classList.toggle('tree-dimmed',!!selected&&!related.has(id));});
 let paths='<defs><marker id="mapperArrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#237247" stroke-width="1.6" stroke-linejoin="round"/></marker><marker id="mapperRecommended" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="userSpaceOnUse"><path d="M1 1 L7 4 L1 7" fill="none" stroke="#b07b24" stroke-width="1.5"/></marker></defs>';
 for(const r of treeSelectionRequirements()){
   const end=pos(r.id);if(!end)continue;
   for(const [ids,dashed] of [[mapperLinks(r).prerequisites,false],[mapperLinks(r).suggested_links.map(x=>x.id),true]])for(const id of ids){
      if(dashed&&!$('#showRecommendedMapperLinks')?.checked)continue;
      const start=pos(id);if(!start)continue;
      const emphasis=!!selected&&(id===editingReq||r.id===editingReq);
      // Four-segment orthogonal connectors align naturally with depth columns.
      const x=start.x+start.w+4,y=start.y+start.h/2,x2=end.x-6,y2=end.y+end.h/2;
      const middle=x+(x2-x)*.50;
      let d;
      if(x2>x+18)d=`M${x} ${y} H${middle} V${y2} H${x2}`;
      else {const bend=start.x+start.w+14;d=`M${x} ${y} H${bend} V${y2} H${x2}`;}
      paths+=`<path d="${d}" class="tree-edge ${dashed?'recommended':'mandatory'} ${emphasis?'emphasized':''} ${selected&&!emphasis?'faded':''}" marker-end="url(#${dashed?'mapperRecommended':'mapperArrow'})"/>`;
   }
 }
 svg.innerHTML=paths;
}
// The original mapper remains the single authority for graph writes.
window.__oasTreeSnapshot=()=>window.__oasTreeLatestSnapshot;
window.__oasTreeSelect=id=>{editingReq=id;renderTree();};
window.__oasTreeQuickLink=(id,action)=>quickLink(id,action);
window.__oasTreeDrop=(id,target)=>{
 if(!id||id===target||!byId(id))return;
 const depths=treeLevels(treeSelectionRequirements());
 if(depths.get(id)!==depths.get(target)){
  showToast('Reorder within the same depth; prerequisite arrows determine depth.');
  return;
 }
 const all=treeOrder(treeSelectionRequirements()).map(r=>r.id);
 const i=all.indexOf(id),j=all.indexOf(target);
 if(i<0||j<0)return;
 all.splice(i,1);all.splice(all.indexOf(target),0,id);
 studio.order[activeTree]=all;writeStudio();renderTree();
};
window.__oasTreeEdges=drawTreeEdges;
window.__oasTreeLegacyRender=renderTree;
function wouldCycle(id,prereqs){const graph=new Map(requirements.map(r=>[r.id,r.id===id?prereqs:r.prerequisites||[]]));const visiting=new Set(),done=new Set();function visit(n){if(visiting.has(n))return true;if(done.has(n))return false;visiting.add(n);for(const child of graph.get(n)||[])if(visit(child))return true;visiting.delete(n);done.add(n);return false;}return [...graph.keys()].some(visit);}
function validateReqs(list){if(!Array.isArray(list)||!list.length)throw Error('No requirements found');const ids=new Set();for(const r of list){if(typeof r.id!=='string'||!r.id||ids.has(r.id))throw Error('Missing or duplicated requirement ID: '+r.id);ids.add(r.id);if(!Array.isArray(r.tags)||!Array.isArray(r.prerequisites)||typeof r.text!=='string')throw Error('Malformed requirement '+r.id);}for(const r of list)for(const p of r.prerequisites)if(!ids.has(p))throw Error(`Missing prerequisite ${p} used by ${r.id}`);const done=new Set(),visiting=new Set(),map=new Map(list.map(r=>[r.id,r.prerequisites]));function visit(n){if(visiting.has(n))throw Error('Circular mandatory prerequisite at '+n);if(done.has(n))return;visiting.add(n);map.get(n).forEach(visit);visiting.delete(n);done.add(n);}ids.forEach(visit);}
// Save paths are shared by the original and Vue editor. This is the exact
// original change transaction: cycle rejection precedes any checkpoint/write.
function commitTreeEditor(fd){
 const r=byId(editingReq);if(!r)return;
 const pr=fd.getAll('prerequisites');if(mapperCycle(r.id,pr)){showToast('Rejected: mandatory prerequisite cycle. Break an existing link first using × Remove.');return;}snapshot('Before editing '+r.id);r.text=String(fd.get('text')).trim();r.description=String(fd.get('description'));r.tree=String(fd.get('tree'));r.tags=fd.getAll('tags');const previousOccurrenceCount=Math.max(1,Number(r.required_occurrences)||1);r.required_occurrences=Math.max(1,Math.min(40,Number(fd.get('requiredOccurrences'))||1));if(r.required_occurrences!==previousOccurrenceCount){r.occurrence_basis='leader-reviewed';r.occurrence_note='Leader-adjusted number of distinct planning opportunities';}r.locations={preferred:String(fd.get('preferredLocation')),alternatives:fd.getAll('alternativeLocation').filter(x=>x!==fd.get('preferredLocation'))};if(customGraphActive())studio.treeGraphs[activeTree].nodes[r.id]={prerequisites:pr,suggested_links:fd.getAll('recommended').map(id=>({id,reason:'Recommended learning path'}))};else{r.prerequisites=pr;r.suggested_links=fd.getAll('recommended').map(id=>({id,reason:'Recommended learning path'}));}if(!activeTree.startsWith('tag::')&&treeFor(r)!==activeTree)activeTree=r.tree;setReqData();showToast('Requirement saved locally.');
}
window.__oasTreeEditorSave=commitTreeEditor;
window.__oasTreeEditorBreak=(child,parent)=>disconnectLink(child,parent);
window.__oasTreeEditorSnapshot=()=>{
 const r=byId(editingReq),links=r?mapperLinks(r):null;
 if(!r||!links)return {selected:false,id:'',title:'',description:'',tree:'',
  stage:'',custom:false,treeOptions:[],tags:[],selectedTags:[],
  places:[],preferred:'',alternatives:[],occurrences:1,occurrenceBasis:'inferred',
  prerequisites:[],recommended:[],choices:[],parents:[],children:[]};
 const incoming=requirements.filter(other=>other.id!==r.id&&mapperLinks(other).prerequisites.includes(r.id));
 const places=r.locations||{preferred:'Flexible / anywhere',alternatives:[]};
 return {
  selected:true,id:r.id,title:r.text,description:r.description||'',
  tree:treeFor(r),stage:String(r.stage),custom:customGraphActive(),
  treeOptions:[...studio.trees],tags:[...studio.tags],selectedTags:[...(r.tags||[])],
  places:[...DATA_LOCATION_LIST],preferred:places.preferred||'Flexible / anywhere',
  alternatives:[...(places.alternatives||[])],
  occurrences:Math.max(1,Number(r.required_occurrences)||1),
  occurrenceBasis:r.occurrence_basis||'inferred',
  prerequisites:[...links.prerequisites],recommended:links.suggested_links.map(l=>l.id),
  choices:requirements.filter(x=>x.id!==r.id).map(x=>({id:x.id,text:x.text,tree:treeFor(x)})),
  parents:links.prerequisites.map(id=>({child:r.id,parent:id,label:byId(id)?.text||id})),
  children:incoming.map(other=>({child:other.id,parent:r.id,label:other.text}))
 };
};
window.__oasTreeEditorLegacyRender=renderTreeEditor;
function renderTreeEditor(){const r=byId(editingReq),panel=$('#treeEditor'),links=r?mapperLinks(r):null;if(window.__oasVueTreeEditorRender){try{if(window.__oasVueTreeEditorRender(window.__oasTreeEditorSnapshot()))return;}catch(error){console.warn('Vue editor update failed; falling back to original.',error);window.__oasVueTreeEditorRender=undefined;delete document.documentElement.dataset.oasTreeEditorRenderer;}}if(!r){panel.innerHTML='<p class="muted">Select a skill. Click to edit; drag cards to rearrange. Recommended links remain advisory.</p>';return;}const incoming=requirements.filter(other=>other.id!==r.id&&mapperLinks(other).prerequisites.includes(r.id));
 const linkName=id=>esc(byId(id)?.text||id);
 const breakButton=(child,parent)=>`<button class="button secondary" type="button" data-break-child="${esc(child)}" data-break-parent="${esc(parent)}" title="Break this prerequisite connection" aria-label="Remove prerequisite connection">× Remove</button>`;
 const directLinks=`<section class="mapper-direct-links"><h4>Existing mandatory connections</h4><p class="tiny muted">Break a specific link without removing other links. In a custom tree, these changes do not alter the master graph.</p><strong>Parents of this skill</strong>${links.prerequisites.length?links.prerequisites.map(id=>`<div class="mapper-link-row"><span>${linkName(id)}</span>${breakButton(r.id,id)}</div>`).join(''):'<p class="tiny muted">None</p>'}<strong>Children of this skill</strong>${incoming.length?incoming.map(other=>`<div class="mapper-link-row"><span>${linkName(other.id)}</span>${breakButton(other.id,r.id)}</div>`).join(''):'<p class="tiny muted">None</p>'}</section>`;
 const places=r.locations||{preferred:'Flexible / anywhere',alternatives:[]};
 const locationForm=`<label>Preferred location<select name="preferredLocation">${DATA_LOCATION_LIST.map(loc=>`<option value="${esc(loc)}" ${places.preferred===loc?'selected':''}>${esc(loc)}</option>`).join('')}</select></label><fieldset><legend>Additional acceptable locations</legend><div class="studio-tag-list">${DATA_LOCATION_LIST.map(loc=>`<label><input type="checkbox" name="alternativeLocation" value="${esc(loc)}" ${places.alternatives?.includes(loc)?'checked':''}>${esc(loc)}</label>`).join('')}</div></fieldset>`;
 panel.innerHTML=`<h3>Edit requirement</h3><p class="tiny muted">${customGraphActive()?'Prerequisite links here are private to this tree.':'Prerequisite links here change the shared master.'}</p><p class="tiny muted">${esc(r.id)}</p>${directLinks}<form id="editTreeForm">${locationForm}<fieldset><legend>Evidence opportunities (planning estimate)</legend><label>Distinct nights/events needed <input name="requiredOccurrences" type="number" min="1" max="40" value="${Math.max(1,Number(r.required_occurrences)||1)}"></label><p class="tiny muted">Count basis: ${esc(r.occurrence_basis||'inferred')}. Change the number when additional opportunities are needed; requirement wording is unchanged.</p></fieldset><label>Name / requirement text<textarea name="text" rows="4" required>${esc(r.text)}</textarea></label><label>Description<textarea name="description" rows="3">${esc(r.description||'')}</textarea></label><label>Tree <select name="tree">${studio.trees.map(t=>`<option ${treeFor(r)===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Stage (reference only) <input name="stage" value="${esc(r.stage)}" readonly></label><fieldset><legend>Tags</legend><div class="studio-tag-list">${studio.tags.map(t=>`<label><input type="checkbox" name="tags" value="${esc(t)}" ${(r.tags||[]).includes(t)?'checked':''}>${esc(t)}</label>`).join('')}</div></fieldset><fieldset><legend>Mandatory prerequisites</legend><div class="studio-prereqs">${requirements.filter(x=>x.id!==r.id).map(x=>`<label><input type="checkbox" name="prerequisites" value="${esc(x.id)}" ${links.prerequisites.includes(x.id)?'checked':''}>${esc(x.text.slice(0,95))} <small>(${esc(treeFor(x))})</small></label>`).join('')}</div></fieldset><fieldset><legend>Recommended learning links</legend><div class="studio-prereqs">${requirements.filter(x=>x.id!==r.id).map(x=>`<label><input type="checkbox" name="recommended" value="${esc(x.id)}" ${links.suggested_links.some(l=>l.id===x.id)?'checked':''}>${esc(x.text.slice(0,95))}</label>`).join('')}</div></fieldset><button class="button primary" type="submit">Save requirement</button></form>`;panel.querySelectorAll('[data-break-child]').forEach(btn=>btn.addEventListener('click',()=>disconnectLink(btn.dataset.breakChild,btn.dataset.breakParent)));$('#editTreeForm').addEventListener('submit',e=>{e.preventDefault();commitTreeEditor(new FormData(e.currentTarget));});}
function manageTags(){const action=prompt('Tag library: enter a new tag, or enter OLD => NEW to rename a tag. Use OLD => (nothing) to delete.');if(action===null)return;const parts=action.split('=>');snapshot('Before editing tag library');if(parts.length===1){const t=action.trim();if(t)studio.tags=uniq([...studio.tags,t]).sort();}else{const old=parts[0].trim(),next=parts.slice(1).join('=>').trim();if(!studio.tags.includes(old)){showToast('Tag not found.');return;}studio.tags=studio.tags.filter(t=>t!==old);if(next)studio.tags.push(next);requirements.forEach(r=>{r.tags=uniq((r.tags||[]).map(t=>t===old?next:t).filter(Boolean));});}studio.tags=uniq(studio.tags).sort();setReqData();}
function restoreTreeHistory(index){
 if(!confirm('Restore this requirements snapshot? Current edits will be saved as a safety checkpoint first.'))return;
 const snapshotData=studio.history[index];if(!snapshotData)return;
 snapshot('Before rollback');
 requirements=structuredClone(snapshotData.requirements);
 studio.trees=[...snapshotData.trees];studio.tags=[...snapshotData.tags];
 studio.order=structuredClone(snapshotData.order);
 studio.treeGraphs=structuredClone(snapshotData.treeGraphs||{});
 setReqData();displayHistory();showToast('Snapshot restored.');
}
window.__oasTreeRestoreSnapshot=restoreTreeHistory;
function displayHistory(){
 const panel=$('#historyPanel');
 panel.hidden=!panel.hidden;if(panel.hidden)return;
 const entries=studio.history.map((item,index)=>({
  index,title:item.title,at:new Date(item.at).toLocaleString()
 }));
 if(typeof window.__oasVueTreeHistoryRender==='function'){
  try{if(window.__oasVueTreeHistoryRender(entries))return;}
  catch(error){
   console.warn('Vue snapshot history failed; falling back to original panel.',error);
   window.__oasVueTreeHistoryRender=undefined;
   delete document.documentElement.dataset.oasTreeAdminRenderer;
  }
 }
 panel.innerHTML='<h3>Local snapshots</h3><p class="tiny muted">Keep exported backups too: browser data may be cleared.</p>'+
  studio.history.map((item,index)=>`<div class="history-line"><span>${esc(item.title)} <small>${esc(new Date(item.at).toLocaleString())}</small></span><button class="button secondary" data-rollback="${index}">Restore</button></div>`).join('');
 panel.querySelectorAll('[data-rollback]').forEach(button=>button.addEventListener('click',()=>restoreTreeHistory(+button.dataset.rollback)));
}
function descendantsCount(id){let found=new Set(),todo=[id];while(todo.length){const x=todo.pop();for(const r of requirements)if((r.prerequisites||[]).includes(x)&&!found.has(r.id)){found.add(r.id);todo.push(r.id);}}return found.size;}
function orderSession(ids){const remaining=new Set(ids),result=[];while(remaining.size){let n=[...remaining].find(id=>(byId(id)?.prerequisites||[]).every(p=>!remaining.has(p)));if(!n)n=[...remaining][0];result.push(n);remaining.delete(n);}return result;}

function scheduleScope(){return studio.strategy==='curriculum'?[]:scopedScoutNames();}
function buildSchedule(keepLocks=false){const weeks=studio.weeks,scope=scheduleScope(),scheduled=new Set();const preserved=new Map();if(keepLocks)studio.schedule.forEach((w,i)=>{if(w.locked&&i<weeks){preserved.set(i,structuredClone(w));w.requirementIds.forEach(id=>scheduled.add(id));}});const next=Array.from({length:weeks},(_,i)=>preserved.get(i)||({id:`week-${i+1}`,title:'',tags:[],capacity:studio.capacity,requirementIds:[],locked:false,activity:null,reviewed:false}));let completedHypothetical=new Map(scope.map(n=>[n,new Set(requirements.filter(r=>isCompleted(n,r.id)).map(r=>r.id))]));for(const w of preserved.values())for(const s of scope){const set=completedHypothetical.get(s);for(const id of w.requirementIds)set.add(id);}for(let wi=0;wi<weeks;wi++){const week=next[wi];if(week.locked)continue;const capacity=Math.max(1,Math.min(12,Number(week.capacity)||studio.capacity));let chosen=[],activeTags=new Set();for(let slot=0;slot<capacity;slot++){let best=null,bestScore=-Infinity;for(const r of requirements){if(scheduled.has(r.id)||chosen.includes(r.id))continue;const prereqs=r.prerequisites||[],sessionSet=new Set([...scheduled,...chosen]);const missing=prereqs.filter(id=>!sessionSet.has(id));const unlocked=missing.length===0;const count=scope.length?scope.filter(s=>!isCompleted(s,r.id)).length:1;const ready=scope.length?scope.filter(s=>!isCompleted(s,r.id)&&prereqs.every(id=>completedHypothetical.get(s)?.has(id)||chosen.includes(id))).length:1;const overlap=(r.tags||[]).filter(t=>activeTags.has(t)).length;
 const locationOptions=[r.locations?.preferred,...(r.locations?.alternatives||[])].filter(Boolean);
 const chosenLocations=chosen.map(id=>byId(id)?.locations?.preferred).filter(Boolean);
 const compatible=chosenLocations.length?locationOptions.some(l=>chosenLocations.includes(l)):false;
 const external=locationOptions.includes('External venue')||locationOptions.some(l=>l.toLowerCase().includes('external'));
 const preferredExternal=(studio.externalWeeks||[]).includes(wi+1);
 const allowedLocations=studio.allowedLocations||[];
 const permitted=!studio.useLocations||!allowedLocations.length||locationOptions.some(l=>allowedLocations.includes(l));
 if(!permitted)continue;
 const locationScore=studio.useLocations?(permitted?(compatible?22:chosenLocations.length?-9:8):-60):0;
 const externalScore=studio.useLocations&&external?(preferredExternal?28:-18):0;
 const progressScore=count*8+ready*5+descendantsCount(r.id)*2;
 const factor=studio.strategy==='location'?.35:studio.strategy==='balanced'?.7:1;
 const score=progressScore*factor+overlap*9+(studio.useLocations?(studio.strategy==='progress'?locationScore*.2:studio.strategy==='location'?locationScore*3:locationScore*1.8):0)+externalScore-(unlocked?0:missing.length*35)-((r.stage||1)*.01);if(score>bestScore){best=r;bestScore=score;}}if(!best)break;chosen.push(best.id);best.tags?.forEach(t=>activeTags.add(t));}week.requirementIds=orderSession(chosen);week.tags=uniq(chosen.flatMap(id=>byId(id)?.tags||[])).slice(0,5);week.title=week.tags[0]||`Week ${wi+1}`;week.location=chosen.map(id=>byId(id)?.locations?.preferred).filter(Boolean)[0]||'Flexible / anywhere';week.activity=null;week.reviewed=false;chosen.forEach(id=>scheduled.add(id));for(const s of scope)for(const id of chosen)completedHypothetical.get(s).add(id);}
return next;}
function saveSchedule(){writeStudio();renderSchedule();}
function showScheduleTimelineImpact(index){
 const w=studio.schedule[index];if(!w)return;
 const r=(w.requirementIds||[]).map(byId).filter(Boolean),scope=scheduleScope();
 const affected=scope.filter(name=>r.some(req=>!isCompleted(name,req.id))).length;
 const ready=scope.filter(name=>r.some(req=>!isCompleted(name,req.id)&&(req.prerequisites||[]).every(id=>isCompleted(name,id)||w.requirementIds.includes(id)))).length;
 const pane=$('#scheduleImpact');pane.hidden=false;
 pane.innerHTML=`<h3>Week ${index+1}: ${esc(w.title||'Session')}</h3><p><strong>${r.length}</strong> requirements · <strong>${affected}</strong> Scouts with missing skills · <strong>${ready}</strong> potentially ready (including same-night prerequisites)</p><p>Preferred location: ${esc(w.location||'Flexible / anywhere')}</p><p>${r.map(x=>esc(x.text)).join(' · ')}</p>`;
 pane.scrollIntoView({block:'nearest',behavior:'smooth'});
}
window.__oasScheduleTimelineSelect=showScheduleTimelineImpact;
function renderSchedule(){if(!$('#scheduleWeeksGrid'))return;$('#scheduleStrategy').value=studio.strategy;$('#scheduleWeeks').value=studio.weeks;$('#scheduleCapacity').value=studio.capacity;
 if($('#externalWeeks')&&document.activeElement!==$('#externalWeeks'))$('#externalWeeks').value=(studio.externalWeeks||[]).join(', ');
 window.__oasVueScheduleToolbarRender?.({strategy:studio.strategy,weeks:studio.weeks,capacity:studio.capacity,locations:!!$('#useLocations').checked,externalWeeks:(studio.externalWeeks||[]).join(', ')});
 const scope=scheduleScope();const all=studio.schedule.flatMap(w=>w.requirementIds||[]),distinct=new Set(all);$('#scheduleSummary').innerHTML=`<div><strong>${studio.schedule.length}</strong><span>sessions</span></div><div><strong>${distinct.size}</strong><span>unique requirements planned</span></div><div><strong>${scope.length||'—'}</strong><span>${studio.strategy==='curriculum'?'curriculum-only':'Scouts selected'}</span></div><div><strong>${studio.schedule.filter(w=>w.locked).length}</strong><span>locked weeks</span></div>`;const timelineSnapshot=studio.schedule.map((w,i)=>({week:i+1,title:w.title||'Unplanned',location:w.location||'Any location',skills:(w.requirementIds||[]).length,locked:!!w.locked,external:w.location==='External venue',preferred:(studio.externalWeeks||[]).includes(i+1)}));
 if(!(window.__oasVueScheduleTimelineRender&&window.__oasVueScheduleTimelineRender(timelineSnapshot))){
 $('#scheduleTimeline').innerHTML=studio.schedule.map((w,i)=>`<button type="button" data-timeline="${i}" class="${w.locked?'locked':''} ${w.location==='External venue'?'external':''} ${(studio.externalWeeks||[]).includes(i+1)?'preferred':''}" title="${esc(w.title||'Unplanned')} · ${esc(w.location||'Any location')}"><b>W${i+1}</b><br>${(w.requirementIds||[]).length} skills</button>`).join('');
 $('#scheduleTimeline').querySelectorAll('[data-timeline]').forEach(btn=>btn.onclick=()=>showScheduleTimelineImpact(Number(btn.dataset.timeline)));
 }
 const weekCards=studio.schedule.map((w,i)=>({week:i+1,locked:!!w.locked,theme:w.theme||w.tags?.[0]||'',capacity:w.capacity||studio.capacity,skills:(w.requirementIds||[]).map(byId).filter(Boolean).map(r=>({id:r.id,text:r.text,stage:r.stage})),potential:scope.length?scope.filter(s=>(w.requirementIds||[]).map(byId).filter(Boolean).some(r=>!isCompleted(s,r.id))).length:0,activityName:w.activity?(w.activity.filename||w.activity.title||'Activity'):''}));
 const vueWeeks=window.__oasVueScheduleWeeksRender?.(weekCards,bindScheduleWeekHandlers)===true;
 if(!vueWeeks){
 $('#scheduleWeeksGrid').innerHTML=studio.schedule.map((w,i)=>{const ids=w.requirementIds||[],reqs=ids.map(byId).filter(Boolean);const potential=scope.length?scope.filter(s=>reqs.some(r=>!isCompleted(s,r.id))).length:0;return `<article class="week-card ${w.locked?'week-locked':''}"><div class="week-head"><strong>Week ${i+1}</strong><label><input type="checkbox" data-week-lock="${i}" ${w.locked?'checked':''}> Lock</label></div><label>Theme <select data-week-tag="${i}"><option value="">Select theme</option>${studio.tags.map(t=>`<option ${w.tags?.[0]===t?'selected':''}>${esc(t)}</option>`).join('')}</select></label><label>Capacity <input type="number" min="1" max="12" data-week-capacity="${i}" value="${w.capacity||studio.capacity}"></label><small>${ids.length} planned requirements · ${potential} Scouts affected</small><ol>${reqs.map(r=>`<li title="${esc(r.id)}">${esc(r.text)} <small>Stage ${r.stage}</small></li>`).join('')}</ol>${!reqs.length?'<p class="tiny muted">No requirements allocated.</p>':''}<div class="week-actions"><button class="button secondary" data-week-move="${i}" ${i===0?'disabled':''}>↑ Move earlier</button><button class="button secondary" data-week-edit="${i}">Edit skills</button><label class="button secondary file-button" for="week-activity-${i}">${w.activity?'Replace activity':'Attach activity'}</label><input id="week-activity-${i}" data-week-file="${i}" type="file" accept=".yaml,.yml,.json,.txt,.md" hidden><button class="button secondary" data-week-review="${i}">Review skills</button></div>${w.activity?`<p class="tiny"><b>Attached:</b> ${esc(w.activity.filename||w.activity.title||'Activity')}</p>`:''}<div id="week-review-${i}" hidden></div></article>`;}).join('');
 bindScheduleWeekHandlers();
 }
}
window.__oasScheduleTags=()=>[...studio.tags];
window.__oasRefreshSchedulerWeeks=()=>renderSchedule();
function bindScheduleWeekHandlers(){
 const grid=$('#scheduleWeeksGrid');grid.querySelectorAll('[data-week-lock]').forEach(el=>el.onchange=()=>{studio.schedule[+el.dataset.weekLock].locked=el.checked;saveSchedule();});grid.querySelectorAll('[data-week-tag]').forEach(el=>el.onchange=()=>{const i=+el.dataset.weekTag;if(typeof regenerateThemeWeek==='function')regenerateThemeWeek(i,el.value);else{const w=studio.schedule[i];w.tags=el.value?[el.value]:[];w.title=el.value;saveSchedule();}});grid.querySelectorAll('[data-week-capacity]').forEach(el=>el.onchange=()=>{const w=studio.schedule[+el.dataset.weekCapacity];w.capacity=Math.max(1,Math.min(12,+el.value||4));saveSchedule();});grid.querySelectorAll('[data-week-move]').forEach(el=>el.onclick=()=>{const i=+el.dataset.weekMove;[studio.schedule[i-1],studio.schedule[i]]=[studio.schedule[i],studio.schedule[i-1]];saveSchedule();});grid.querySelectorAll('[data-week-edit]').forEach(el=>el.onclick=()=>editWeek(+el.dataset.weekEdit));grid.querySelectorAll('[data-week-file]').forEach(el=>el.onchange=async()=>{const f=el.files[0];if(!f)return;const w=studio.schedule[+el.dataset.weekFile];w.activity={filename:f.name,text:await f.text(),attachedAt:new Date().toISOString()};saveSchedule();});grid.querySelectorAll('[data-week-review]').forEach(el=>el.onclick=()=>reviewWeek(+el.dataset.weekReview));
}

function editWeek(i){const w=studio.schedule[i],original=new Set(w.requirementIds);const selected=prompt(`Week ${i+1}: enter comma-separated requirement IDs, in preferred order. Existing IDs:\n${w.requirementIds.join(', ')}`,w.requirementIds.join(', '));if(selected===null)return;const ids=uniq(selected.split(',').map(s=>s.trim()).filter(Boolean));const unknown=ids.filter(id=>!byId(id));if(unknown.length){alert('Unknown requirement IDs: '+unknown.join(', '));return;}if(ids.length>(w.capacity||studio.capacity)&&!confirm('This exceeds the week capacity. Keep these requirements anyway?'))return;w.requirementIds=orderSession(ids);w.tags=uniq(ids.flatMap(id=>byId(id)?.tags||[])).slice(0,5);w.locked=true;saveSchedule();}
function reviewWeek(i){const w=studio.schedule[i],box=$(`#week-review-${i}`);if(!box)return;box.hidden=!box.hidden;if(box.hidden)return;const names=scopedScoutNames(),reqs=w.requirementIds.map(byId).filter(Boolean);box.innerHTML=`<div class="review-panel"><h4>Leader review · Week ${i+1}</h4><p class="tiny muted">Tick only skills actually demonstrated. Prerequisites and dependent skills may both be completed tonight.</p>${!names.length?'<p>Select or import Scouts to review completions.</p>':reqs.map(r=>`<div class="review-skill"><strong>${esc(r.text)}</strong>${names.map(n=>`<label><input type="checkbox" data-review-scout="${esc(n)}" data-review-req="${esc(r.id)}" ${isCompleted(n,r.id)?'checked':''}>${esc(n)}</label>`).join('')}</div>`).join('')}<button class="button primary" data-save-review="${i}">Save demonstrated skills</button></div>`;box.querySelector('[data-save-review]').onclick=()=>{for(const inp of box.querySelectorAll('[data-review-req]')){const key=getKey(inp.dataset.reviewScout,inp.dataset.reviewReq),prev=recordFor(inp.dataset.reviewScout,inp.dataset.reviewReq);scoutRecords[key]={...prev,completed:inp.checked,date:inp.checked?(prev.date||new Date().toISOString().slice(0,10)):'',source:'session-review'};}w.reviewed=true;save();saveSchedule();renderAll();showToast('Leader review saved.');};}
function scheduleExport(){return {format:'oas-trailmap-schedule',schema_version:1,exportedAt:new Date().toISOString(),strategy:studio.strategy,capacity:studio.capacity,weeks:studio.schedule,scope:studio.strategy==='curriculum'?'curriculum':scopedScoutNames()};}
function validateSchedule(data){if(!data||data.format!=='oas-trailmap-schedule'||!Array.isArray(data.weeks)||data.weeks.length>60||!data.weeks.length)throw Error('Expected an OAS schedule with 1–60 weeks.');const known=new Set(requirements.map(r=>r.id));for(const w of data.weeks){if(!Array.isArray(w.requirementIds)||w.requirementIds.some(id=>!known.has(id)))throw Error('Schedule refers to unknown requirement IDs.');}}
function studioInit(){readStudio();if($('#showRecommendedMapperLinks'))$('#showRecommendedMapperLinks').onchange=()=>drawTreeEdges();document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));$('#treeSelect').onchange=e=>{activeTree=e.target.value;editingReq='';renderTree();};$('#newTree').onclick=()=>{const t=prompt('New skill tree name');if(t?.trim()&&!studio.trees.includes(t.trim())){studio.trees.push(t.trim());activeTree=t.trim();writeStudio();renderTree();}};$('#renameTree').onclick=()=>{if(activeTree.startsWith('tag::'))return;const n=prompt('Rename tree',activeTree)?.trim();if(!n||studio.trees.includes(n))return;snapshot('Before renaming tree');requirements.forEach(r=>{if(treeFor(r)===activeTree)r.tree=n;});studio.trees=studio.trees.map(t=>t===activeTree?n:t);studio.order[n]=studio.order[activeTree]||[];delete studio.order[activeTree];if(studio.treeGraphs[activeTree]){studio.treeGraphs[n]=studio.treeGraphs[activeTree];delete studio.treeGraphs[activeTree];}activeTree=n;setReqData();};$('#treeGraphMode').onchange=e=>setTreeGraphMode(e.target.value);$('#manageTags').onclick=manageTags;$('#treeSnapshot').onclick=()=>{snapshot(prompt('Snapshot name','Manual checkpoint')||'Manual checkpoint');showToast('Checkpoint saved locally.');};$('#historyBtn').onclick=displayHistory;$('#exportRequirements').onclick=()=>{const data={schema_version:3,source:'OAS Trailmap',requirements,tree_graphs:studio.treeGraphs,tree_registry:studio.trees,tag_library:studio.tags};download('requirements.json',JSON.stringify(data,null,2),'application/json');};$('#importRequirements').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const raw=await f.text(),parsed=f.name.endsWith('.json')?JSON.parse(raw):jsyaml.load(raw);validateReqs(parsed.requirements);if(parsed.tree_graphs)validateTreeGraphs(parsed.tree_graphs,parsed.requirements);if(!confirm(`Replace ${requirements.length} requirements with ${parsed.requirements.length} imported requirements? A safety snapshot will be saved.`))return;snapshot('Before YAML import');requirements=parsed.requirements;studio.trees=uniq([...(Array.isArray(parsed.tree_registry)?parsed.tree_registry:[]),...requirements.map(treeFor)]);studio.tags=uniq([...(Array.isArray(parsed.tag_library)?parsed.tag_library:[]),...requirements.flatMap(r=>r.tags||[])]).sort();studio.treeGraphs=parsed.tree_graphs||{};setReqData();showToast('Requirements imported.');}catch(err){alert('Requirements import rejected: '+err.message);}e.target.value='';};$('#generateSchedule').onclick=()=>{studio.strategy=$('#scheduleStrategy').value;studio.weeks=Math.max(1,Math.min(60,+$('#scheduleWeeks').value||40));studio.capacity=Math.max(1,Math.min(12,+$('#scheduleCapacity').value||4));if(studio.schedule.length&&!confirm('Replace the existing schedule? Export it first if needed.'))return;studio.schedule=buildSchedule(false);saveSchedule();};$('#regenerateSchedule').onclick=()=>{studio.strategy=$('#scheduleStrategy').value;studio.weeks=Math.max(1,Math.min(60,+$('#scheduleWeeks').value||40));studio.capacity=Math.max(1,Math.min(12,+$('#scheduleCapacity').value||4));const originalSchedule=JSON.stringify(studio.schedule),proposed=buildSchedule(true);let changes=0;try{if(proposed.length<1||proposed.length>60)throw Error('Expected 1–60 weeks.');studio.schedule.forEach((w,i)=>{if(w.locked&&JSON.stringify(w)!==JSON.stringify(proposed[i]))throw Error('Locked Week '+(i+1)+' changed.');if(!w.locked&&JSON.stringify(w.requirementIds||[])!==JSON.stringify(proposed[i]?.requirementIds||[]))changes++;});}catch(err){alert('Regeneration rejected: '+err.message);return;}const preview=$('#schedulePreview');preview.hidden=false;preview.innerHTML=`<strong>Regeneration preview</strong><p>${changes} unlocked weeks would change. Locked weeks are preserved. Activity attachments on changed unlocked weeks will be cleared.</p><button id="applyRegen" class="button primary">Apply proposed schedule</button> <button id="cancelRegen" class="button secondary">Cancel</button>`;$('#applyRegen').onclick=()=>{if(JSON.stringify(studio.schedule)!==originalSchedule){alert('The schedule changed after this preview. Regenerate to review a fresh proposal.');preview.hidden=true;return;}if(studio.schedule.some((w,i)=>w.locked&&JSON.stringify(w)!==JSON.stringify(proposed[i]))){alert('A locked week would change. Regeneration cancelled.');preview.hidden=true;return;}studio.schedule=proposed;preview.hidden=true;saveSchedule();};$('#cancelRegen').onclick=()=>preview.hidden=true;};$('#exportSchedule').onclick=()=>{const x=scheduleExport();download('schedule.json',JSON.stringify(x,null,2),'application/json');};$('#importSchedule').onchange=async e=>{const f=e.target.files[0];if(!f)return;try{const x=f.name.endsWith('.json')?JSON.parse(await f.text()):jsyaml.load(await f.text());validateSchedule(x);if(!confirm('Replace existing schedule with imported schedule?'))return;studio.schedule=x.weeks;studio.weeks=x.weeks.length;studio.capacity=x.capacity||4;studio.strategy=x.strategy||'progress';saveSchedule();}catch(err){alert('Schedule import rejected: '+err.message);}e.target.value='';};renderTree();renderSchedule();$('#treeFocus').onchange=renderTree;$('#undoLastEdit').onclick=()=>{const last=studio.history[0];if(!last){showToast('No tree checkpoints available.');return;}if(!confirm('Undo the last tree edit? Scout progress and activities will not change.'))return;studio.history.shift();requirements=structuredClone(last.requirements);studio.trees=[...last.trees];studio.tags=[...last.tags];studio.order=structuredClone(last.order);studio.treeGraphs=structuredClone(last.treeGraphs||{});setReqData();showToast('Tree edit restored.');};
 $('#applyExternalWeeks').onclick=()=>{const parts=$('#externalWeeks').value.split(',').map(x=>x.trim()).filter(Boolean);const values=parts.map(Number);if(values.some(n=>!Number.isInteger(n)||n<1||n>studio.weeks)){alert('Enter week numbers between 1 and '+studio.weeks);return;}studio.externalWeeks=[...new Set(values)];writeStudio();renderSchedule();showToast('Preferred external weeks saved locally.')};
 window.addEventListener('resize',()=>{if(studioMode==='tree')drawTreeEdges();});}
document.addEventListener('DOMContentLoaded',()=>{const timer=setInterval(()=>{if(typeof requirements!=='undefined'&&requirements.length&&$('#treeStudio')){clearInterval(timer);studioInit();}},60);});