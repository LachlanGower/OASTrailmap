import {createApp,shallowReactive} from 'vue';
import CoverageTracker,{type CoverageSnapshot} from './CoverageTracker.vue';
declare global {interface Window {__oasVueCoverageRender?:(snapshot:CoverageSnapshot)=>boolean;}}
function mount():void{
 if(new URLSearchParams(location.search).get('requirementsTrackerRenderer')==='legacy')return;
 const section=document.querySelector<HTMLElement>('#requirementsTracker');
 const summary=section?.querySelector<HTMLElement>('#requirementsTrackerSummary');
 const wrap=section?.querySelector<HTMLElement>('.tracker-table-wrap');
 if(!section||!summary||!wrap)return;
 const host=document.createElement('div');
 const state=shallowReactive<{current:CoverageSnapshot}>({current:{rows:[],counts:{}}});
 try{
  createApp(CoverageTracker,{state}).mount(host);
  wrap.before(host);
  summary.hidden=true;wrap.hidden=true;
  window.__oasVueCoverageRender=snapshot=>{state.current=snapshot;return true;};
  document.documentElement.dataset.oasRequirementsTrackerRenderer='vue';
  // Original filter controls and CSV export buttons remain wired to legacy handlers.
  document.querySelector<HTMLInputElement>('#requirementsTrackerSearch')?.dispatchEvent(new Event('input'));
 }catch(error){host.remove();summary.hidden=false;wrap.hidden=false;console.warn('Vue coverage unavailable; original tracker retained.',error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
