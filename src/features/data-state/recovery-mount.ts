import {createApp} from 'vue';
import RecoveryControls from './RecoveryControls.vue';
function mount():void{
 if(new URLSearchParams(location.search).get('recoveryRenderer')==='legacy')return;
 const legacy=document.querySelector<HTMLElement>('#resetRecovery');
 if(!legacy)return;
 const host=document.createElement('div');
 const toolbar=legacy.querySelector<HTMLElement>('.studio-toolbar');
 legacy.prepend(host);
 try{
  createApp(RecoveryControls,{activate:(id:string)=>legacy.querySelector<HTMLButtonElement>('#'+id)?.click()}).mount(host);
  if(toolbar)toolbar.hidden=true;
  for(const node of Array.from(legacy.children))if(node!==host && node!==toolbar && node.id!=='resetReview') (node as HTMLElement).hidden=true;
  document.documentElement.dataset.oasRecoveryRenderer='vue';
 }catch(error){
  host.remove();if(toolbar)toolbar.hidden=false;
  console.warn('Vue recovery controls unavailable; original recovery controls retained.',error);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
