/* Theme exploration is read-only and preserves the 142 canonical requirement IDs. */
(function(){
 const $=id=>document.getElementById(id);
 const same=(r,t)=>((r.theme_tags||r.tags||[]).includes(t));
 const canonical=r=>r.duplicate_of||r.id;
 function show(view){
  for(const id of ['weeklyThemes','requirementsWorkspace'])if($(id))$(id).hidden=id!==view;
  for(const id of ['trailWorkspace','treeStudio','scheduleStudio','activityStudio','dataManager','helpDesign','applicationRequirements'])if($(id))$(id).hidden=true;
  document.querySelectorAll('.studio-nav button').forEach(b=>{b.classList.toggle('primary',b.id===(view==='weeklyThemes'?'weeklyThemesTab':'requirementsTrackerTab'));b.classList.toggle('secondary',b.id!==(view==='weeklyThemes'?'weeklyThemesTab':'requirementsTrackerTab'));});
 }
 function render(){
  const select=$('weeklyThemeSelect'),host=$('weeklyThemeContent');
  if(!select||!host||typeof requirements==='undefined'||!Array.isArray(requirements))return;
  const themes=[...new Set(requirements.flatMap(r=>r.theme_tags||r.tags||[]))].sort();
  const prior=select.value;
  select.innerHTML='<option value="">Select a theme</option>';
  for(const t of themes){const opt=document.createElement('option');opt.value=t;opt.textContent=t;select.append(opt)}
  select.value=themes.includes(prior)?prior:'';
  const theme=select.value;if(!theme){host.replaceChildren();return}
  const matched=requirements.filter(r=>same(r,theme)),activityMatches=(typeof activities!=='undefined'?activities:[]).map(a=>({...a,_hits:(a.covers||[]).filter(id=>matched.some(r=>r.id===id))})).filter(a=>a._hits.length);
  const grid=document.createElement('div');grid.className='theme-stage-grid';
  for(let stage=1;stage<=3;stage++){
   const col=document.createElement('section');col.className='theme-stage';const title=document.createElement('h3');title.textContent='Stage '+stage;col.append(title);
   const seen=new Set();for(const r of matched.filter(r=>Number(r.stage)===stage)){const key=canonical(r);if(seen.has(key))continue;seen.add(key);const item=document.createElement('p');item.textContent=r.text+' ('+r.stream+')';item.title=r.id;col.append(item)}
   if(!seen.size){const empty=document.createElement('p');empty.textContent='No matching requirements';col.append(empty)}
   grid.append(col);
  }
  const heading=document.createElement('h3');heading.textContent='Activity Studio matches ('+activityMatches.length+')';
  const list=document.createElement('ul');for(const a of activityMatches){const item=document.createElement('li');item.textContent=(a.title||a.name||a.id)+' — '+a._hits.length+' matching requirements';list.append(item)}
  if(!activityMatches.length){const item=document.createElement('li');item.textContent='No linked activities yet';list.append(item)}
  host.replaceChildren(grid,heading,list);
 }
 document.addEventListener('DOMContentLoaded',()=>{
  document.addEventListener('click',e=>{const button=e.target.closest('button');if(button?.closest('nav.studio-nav')&&!['weeklyThemesTab','requirementsTrackerTab'].includes(button.id)){if($('weeklyThemes'))$('weeklyThemes').hidden=true;if($('requirementsWorkspace'))$('requirementsWorkspace').hidden=true;}},true);
  const locationHost=document.createElement('fieldset');locationHost.className='location-choices';locationHost.id='scheduleLocationChoices';
  const legend=document.createElement('legend');legend.textContent='Allowed scheduling locations (none selected = all locations)';locationHost.append(legend);
  const scheduler=$('scheduleStudio');
  scheduler?.querySelector('.section-heading')?.after(locationHost);
  function fillLocations(){
   if(typeof requirements==='undefined'||!Array.isArray(requirements))return;
   const defaults=['Scout Hall - indoor','Scout Hall - outdoor','Local outdoor area','Campsite','External venue','Flexible / anywhere'];
   const locations=[...new Set([...defaults,...requirements.flatMap(r=>[r.locations?.preferred,...(r.locations?.alternatives||[])].filter(Boolean))])].sort();
   for(const loc of locations){const label=document.createElement('label'),input=document.createElement('input');input.type='checkbox';input.value=loc;input.checked=(studio.allowedLocations||[]).includes(loc);input.addEventListener('change',()=>{studio.allowedLocations=[...locationHost.querySelectorAll('input:checked')].map(x=>x.value);studio.useLocations=studio.allowedLocations.length>0;const master=$('useLocations');if(master)master.checked=studio.useLocations;writeStudio();if(typeof renderSchedule==='function')renderSchedule()});label.append(input,document.createTextNode(' '+loc));locationHost.append(label)}
  }
  const locationWait=setInterval(()=>{if(typeof requirements==='undefined'||!requirements.length||typeof studio==='undefined')return;clearInterval(locationWait);fillLocations()},100);
  if($('weeklyThemesTab'))$('weeklyThemesTab').onclick=()=>{show('weeklyThemes');render()};
  if($('requirementsTrackerTab'))$('requirementsTrackerTab').onclick=()=>show('requirementsWorkspace');
  $('weeklyThemeSelect')?.addEventListener('change',render);
 });
 window.__oasRenderWeeklyThemes=render;
})();
