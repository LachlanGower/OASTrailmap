import { createApp, shallowReactive } from 'vue';
import ScheduleToolbar, {type ToolbarState} from './ScheduleToolbar.vue';
declare global { interface Window { __oasVueScheduleToolbarRender?:(state:ToolbarState)=>boolean; } }
function mount():void {
 if(new URLSearchParams(location.search).get('scheduleToolbarRenderer')==='legacy')return;
 const section=document.querySelector<HTMLElement>('#scheduleStudio');
 const legacy=section?.querySelector<HTMLElement>('.studio-toolbar');
 if(!section||!legacy)return;
 const second=legacy.nextElementSibling as HTMLElement|null;
 if(!second?.classList.contains('studio-toolbar'))return;
 const node=document.createElement('div');
 const initial:ToolbarState={strategy:'progress',weeks:40,capacity:4,locations:false,externalWeeks:''};
 const state=shallowReactive<{current:ToolbarState}>({current:initial});
 function original(id:string):HTMLElement|null{return document.getElementById(id);}
 function change(field:keyof ToolbarState,value:string|number|boolean):void{
  const map:Record<keyof ToolbarState,string>={strategy:'scheduleStrategy',weeks:'scheduleWeeks',capacity:'scheduleCapacity',locations:'useLocations',externalWeeks:'externalWeeks'};
  const el=original(map[field]) as HTMLInputElement|HTMLSelectElement|null;
  if(!el)return;
  if(field==='weeks')value=Math.max(1,Math.min(60,Number(value)||40));
  if(field==='capacity')value=Math.max(1,Math.min(12,Number(value)||4));
  if(field==='locations')(el as HTMLInputElement).checked=Boolean(value);
  else el.value=String(value);
  el.dispatchEvent(new Event('change',{bubbles:true}));
  state.current={...state.current,[field]:value};
 }
 function action(id:string):void{original(id)?.click();}
 function importFile(file:File):void{
  const el=original('importSchedule') as HTMLInputElement|null;
  if(!el)return;
  const dt=new DataTransfer();dt.items.add(file);el.files=dt.files;
  el.dispatchEvent(new Event('change',{bubbles:true}));
 }
 try{
  legacy.parentElement?.insertBefore(node,legacy);
  createApp(ScheduleToolbar,{state,change,action,importFile}).mount(node);
  legacy.hidden=true;
  second.hidden=true;
  // These panels contain live DOM controls used by the authoritative legacy handlers.
  // Hide visually rather than removing them, and never duplicate their element IDs.
  legacy.style.display='none';second.style.display='none';
  window.__oasVueScheduleToolbarRender=snapshot=>{state.current=snapshot;return true;};
  document.documentElement.dataset.oasScheduleToolbarRenderer='vue';
 }catch(error){
  node.remove();legacy.hidden=false;second.hidden=false;legacy.style.display='';second.style.display='';
  console.warn('Vue scheduler toolbar unavailable; legacy controls retained.',error);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
