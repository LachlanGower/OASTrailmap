/* Read-only curriculum detail dialog, shared by Weekly Themes and Scheduler. */
(function(){
 const $=id=>document.getElementById(id);
 function inspectRequirement(id){
  if(typeof requirements==='undefined')return;
  const r=requirements.find(req=>req.id===id);if(!r)return;
  let dlg=$('oasRequirementInspector');
  if(!dlg){dlg=document.createElement('dialog');dlg.id='oasRequirementInspector';dlg.className='oas-requirement-dialog';document.body.append(dlg)}
  dlg.replaceChildren();
  const title=document.createElement('h2');title.textContent=r.text;
  const meta=document.createElement('p');meta.className='muted';meta.textContent='Stage '+r.stage+' · '+r.stream+' · '+r.id;
  const description=document.createElement('p');description.textContent=r.description||r.text;
  const section=(heading,items)=>{const wrapper=document.createElement('section'),h=document.createElement('h3'),ul=document.createElement('ul');h.textContent=heading;for(const item of items){const li=document.createElement('li');li.textContent=item;ul.append(li)}if(!items.length){const li=document.createElement('li');li.textContent='None';ul.append(li)}wrapper.append(h,ul);return wrapper};
  const linkName=id=>requirements.find(x=>x.id===id)?.text||id;
  const mandatory=r.stage===1?[]:(r.prerequisites||[]).map(linkName);
  const recommended=(r.suggested_links||[]).map(x=>linkName(typeof x==='string'?x:x.id));
  const tags=r.theme_tags||r.tags||[];
  const linked=(typeof activities==='undefined'?[]:activities).filter(a=>a.covers?.includes(r.id)).map(a=>a.title||a.name||a.id);
  const close=document.createElement('button');close.className='button primary';close.type='button';close.textContent='Close';close.onclick=()=>dlg.close();
  dlg.append(title,meta,description,section('Themes and tags',tags),section('Mandatory prerequisites',mandatory),section('Suggested connections',recommended),section('Activity Studio coverage',linked),close);
  if(!dlg.open)dlg.showModal();close.focus();
 }
 document.addEventListener('click',event=>{const target=event.target.closest?.('[data-week-req],[data-theme-req]');if(target){event.preventDefault();inspectRequirement(target.dataset.weekReq||target.dataset.themeReq)}});
 window.__oasInspectRequirement=inspectRequirement;
})();
