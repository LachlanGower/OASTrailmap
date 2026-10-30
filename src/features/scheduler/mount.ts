import { createApp, shallowReactive } from 'vue';
import ScheduleTimeline, { type TimelineWeek } from './ScheduleTimeline.vue';
declare global {
 interface Window {
  __oasVueScheduleTimelineRender?:(weeks:TimelineWeek[])=>boolean;
  __oasScheduleTimelineSelect?:(index:number)=>void;
 }
}
function mount():void {
 if(new URLSearchParams(location.search).get('scheduleRenderer')==='legacy')return;
 const target=document.querySelector<HTMLElement>('#scheduleTimeline');
 if(!target)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(!target.isConnected||++attempts>330){window.clearInterval(timer);return;}
  if(typeof window.__oasScheduleTimelineSelect!=='function')return;
  window.clearInterval(timer);
  const original=target.innerHTML;
  const state=shallowReactive<{current:TimelineWeek[]}>({current:[]});
  try{
   createApp(ScheduleTimeline,{state,selectWeek:(index:number)=>window.__oasScheduleTimelineSelect?.(index)}).mount(target);
   window.__oasVueScheduleTimelineRender=weeks=>{state.current=weeks;return true;};
   document.documentElement.dataset.oasScheduleRenderer='vue';
   // Rebuild the scheduler now that Vue owns the timeline container.
   document.querySelector<HTMLButtonElement>('[data-mode="schedule"]')?.click();
  }catch(error){
   window.__oasVueScheduleTimelineRender=undefined;
   target.innerHTML=original;
   console.warn('Vue scheduler timeline unavailable; legacy fallback retained.',error);
  }
 },60);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
