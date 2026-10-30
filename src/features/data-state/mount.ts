import {createApp,shallowReactive} from 'vue';
import DataDashboard,{type DataCount} from './DataDashboard.vue';
declare global {interface Window {__oasVueDataDashboardRender?:(items:DataCount[])=>boolean;}}
function mount():void{
 if(new URLSearchParams(location.search).get('dataDashboardRenderer')==='legacy')return;
 const root=document.querySelector<HTMLElement>('#dataManager'),stats=root?.querySelector<HTMLElement>('#dataStats'),exports=root?.querySelector<HTMLElement>('#dataExports');
 if(!root||!stats||!exports)return;
 const host=document.createElement('div');stats.before(host);
 const state=shallowReactive<{current:DataCount[]}>({current:[]});
 try{
  createApp(DataDashboard,{state,exportData:(type:string)=>{exports.querySelector<HTMLButtonElement>('[data-dexport="'+type+'"]')?.click();}}).mount(host);
  window.__oasVueDataDashboardRender=items=>{state.current=items;return true;};
  stats.hidden=true;exports.hidden=true;
  document.documentElement.dataset.oasDataDashboardRenderer='vue';
  document.querySelector<HTMLButtonElement>('#dataManagerTab')?.click();
 }catch(error){host.remove();window.__oasVueDataDashboardRender=undefined;stats.hidden=false;exports.hidden=false;console.warn('Vue Data dashboard unavailable; original controls retained.',error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
