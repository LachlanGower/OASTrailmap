import {createApp,shallowReactive} from 'vue';
import ForecastPanel,{type ForecastSnapshot} from './ForecastPanel.vue';
declare global {interface Window {__oasVueForecastRender?:(snapshot:ForecastSnapshot)=>boolean;}}
function mount():void{
 if(new URLSearchParams(location.search).get('forecastRenderer')==='legacy')return;
 const target=document.querySelector<HTMLElement>('#forecastProgress');if(!target)return;
 const original=target.innerHTML;
 const state=shallowReactive<{current:ForecastSnapshot}>({current:{hasSchedule:false,weeks:0,scouts:0,initial:0,final:0,points:[],limit:142,unmet:[]}});
 try{
  createApp(ForecastPanel,{state}).mount(target);
  window.__oasVueForecastRender=snapshot=>{state.current=snapshot;return true;};
  document.documentElement.dataset.oasForecastRenderer='vue';
  document.querySelector<HTMLInputElement>('#requirementsTrackerSearch')?.dispatchEvent(new Event('input'));
 }catch(error){
  window.__oasVueForecastRender=undefined;target.innerHTML=original;
  console.warn('Vue forecast unavailable; legacy forecast remains available.',error);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
