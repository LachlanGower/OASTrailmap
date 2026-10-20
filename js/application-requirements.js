/* Application-level requirements traceability.
 * Separate from the OAS skill/award requirements coverage tracker.
 * This catalogue is version-controlled reference data; no Scout records appear here.
 */
let applicationRequirementsData=null;
function appReqStatusLabel(s){return ({implemented:'Implemented in code',partial:'Partially implemented',planned:'Planned / not complete',future:'Future idea only'})[s]||s;}
function appReqList(){
 const entries=applicationRequirementsData?.requirements||[];
 const q=($('#appReqSearch')?.value||'').trim().toLowerCase();
 const status=$('#appReqStatus')?.value||'all',category=$('#appReqCategory')?.value||'all';
 return entries.filter(r=>(status==='all'||r.status===status)&&(category==='all'||r.category===category)&&(!q||[r.id,r.title,r.description,...(r.implementation||[]),r.verification,applicationRequirementsData.categories?.[r.category]||''].join(' ').toLowerCase().includes(q)));
}
function appReqRender(){
 if(window.__oasAppReqVueActive)return; // Vue owns the replacement panel; fallback stays intact.
 const data=applicationRequirementsData,el=$('#appReqList');if(!data||!el)return;
 const count=Object.fromEntries(['implemented','partial','planned','future'].map(s=>[s,data.requirements.filter(r=>r.status===s).length]));
 const stats=$('#appReqSummary');
 stats.innerHTML='<div class="data-stat"><strong>'+data.requirements.length+'</strong><span>Application requirements catalogued</span></div>'+
 Object.entries(count).map(([s,n])=>'<div class="data-stat"><strong>'+n+'</strong><span>'+esc(appReqStatusLabel(s))+'</span></div>').join('');
 const filtered=appReqList();
 $('#appReqResults').textContent='Showing '+filtered.length+' of '+data.requirements.length+' requirements · statuses reflect code inspection, not end-to-end certification.';
 el.innerHTML=filtered.map(r=>'<article class="app-req-card" id="application-'+esc(r.id)+'"><div class="app-req-head"><div><p class="app-req-id">'+esc(r.id)+' · '+esc(data.categories[r.category]||r.category)+'</p><h3>'+esc(r.title)+'</h3></div><span class="app-req-status '+esc(r.status)+'">'+esc(appReqStatusLabel(r.status))+'</span></div><p>'+esc(r.description)+'</p><details><summary>Implementation and verification</summary><p><strong>Evidence in code / documentation:</strong> '+(r.implementation||[]).map(f=>'<code>'+esc(f)+'</code>').join(' ')+'</p><p><strong>How to verify:</strong> '+esc(r.verification||'Not yet defined')+'</p><p class="tiny muted">Repository evidence is not proof that every browser interaction or real-world workflow has passed testing.</p></details></article>').join('')||'<p class="muted">No application requirements match. Try clearing one of the filters.</p>';
}
function appReqExportCsv(){
 if(!applicationRequirementsData)return;
 const columns=['ID','Area','Title','Requirement','Implementation status','Code and documentation','Verification'];
 const rows=applicationRequirementsData.requirements.map(r=>[r.id,applicationRequirementsData.categories[r.category]||r.category,r.title,r.description,appReqStatusLabel(r.status),(r.implementation||[]).join('; '),r.verification]);
 const quote=x=>'"'+String(x??'').replace(/"/g,'""')+'"';
 download('oas-trailmap-application-requirements.csv',[columns,...rows].map(row=>row.map(quote).join(',')).join('\r\n'),'text/csv');
}
function appReqExportJson(){
 if(!applicationRequirementsData)return;
 download('oas-trailmap-application-requirements.json',JSON.stringify(applicationRequirementsData,null,2),'application/json');
}
function openApplicationRequirements(){
 // Hide every other workspace, including Help & Design, through existing navigation.
 dataView('data');
 $('#dataManager').hidden=true;
 $('#applicationRequirements').hidden=false;
 $('#appRequirementsTab').classList.add('primary');
 $('#appRequirementsTab').classList.remove('secondary');
 appReqRender();
}
function appRequirementsInit(){
 const section=$('#applicationRequirements');if(!section)return;
 const tab=$('#appRequirementsTab');
 tab.onclick=openApplicationRequirements;
 if(window.__oasAppReqVueActive)return;
 const category=$('#appReqCategory');
 category.innerHTML='<option value="all">All feature areas</option>'+Object.entries(applicationRequirementsData.categories).map(([value,label])=>'<option value="'+esc(value)+'">'+esc(label)+'</option>').join('');
 $('#appReqSearch').oninput=appReqRender;
 $('#appReqStatus').onchange=appReqRender;
 category.onchange=appReqRender;
 $('#appReqClear').onclick=()=>{$('#appReqSearch').value='';$('#appReqStatus').value='all';category.value='all';appReqRender()};
 $('#appReqExportCsv').onclick=appReqExportCsv;
 $('#appReqExportJson').onclick=appReqExportJson;
 appReqRender();
}
document.addEventListener('DOMContentLoaded',async()=>{
 try{
  const response=await fetch('data/application-requirements.json');
  if(!response.ok)throw new Error('HTTP '+response.status);
  const value=await response.json();
  if(!Array.isArray(value.requirements)||!value.categories)throw new Error('Invalid application requirements catalogue');
  const ids=new Set();
  for(const r of value.requirements){
   if(!r.id||ids.has(r.id)||!value.status_definitions[r.status])throw new Error('Invalid or duplicate application requirement: '+r.id);
   ids.add(r.id);
  }
  applicationRequirementsData=value;
  appRequirementsInit();
 }catch(error){
  const node=$('#appReqList');
  if(node)node.innerHTML='<p class="muted">Could not load the application requirements catalogue. Refresh the page or check that data/application-requirements.json is deployed. '+esc(error.message)+'</p>';
 }
});
