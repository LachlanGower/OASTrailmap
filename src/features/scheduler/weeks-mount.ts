import { createApp, nextTick, shallowReactive } from 'vue';
import ScheduleWeeks, { type WeekCard } from './ScheduleWeeks.vue';
declare global { interface Window { __oasEnhanceScheduleWeeks?:()=>void; __oasEnhanceMultiSessions?:()=>void; __oasRefreshSchedulerWeeks?:()=>void; __oasVueScheduleWeeksRender?:(weeks:WeekCard[],bind:()=>void)=>boolean; __oasScheduleTags?:()=>string[]; } }
function mount():void {
 if(new URLSearchParams(location.search).get('scheduleWeeksRenderer')==='legacy')return;
 const target=document.querySelector<HTMLElement>('#scheduleWeeksGrid');
 if(!target)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(!target.isConnected||++attempts>330){window.clearInterval(timer);return;}
  if(typeof window.__oasScheduleTags!=='function'||!target.querySelector('.week-card'))return;
  window.clearInterval(timer);
  const old=target.innerHTML;
  const state=shallowReactive<{current:WeekCard[]}>({current:[]});
  const tags=shallowReactive<{current:string[]}>({current:[]});
  try{
   createApp(ScheduleWeeks,{state,tags}).mount(target);
   window.__oasVueScheduleWeeksRender=(weeks,bind)=>{
    state.current=weeks;
    tags.current=window.__oasScheduleTags?.()||[];
    void nextTick(()=>{bind();window.__oasEnhanceScheduleWeeks?.();window.__oasEnhanceMultiSessions?.();});
    return true;
   };
   document.documentElement.dataset.oasScheduleWeeksRenderer='vue';
   // A lazy week-card mount must not switch the user's active workspace.
   // Populate Vue from the existing schedule without a synthetic tab click.
   window.__oasRefreshSchedulerWeeks?.();
  }catch(err){
   window.__oasVueScheduleWeeksRender=undefined;
   target.innerHTML=old;
   console.warn('Vue scheduler cards unavailable; legacy renderer preserved.',err);
  }
 },60);
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});
else mount();
