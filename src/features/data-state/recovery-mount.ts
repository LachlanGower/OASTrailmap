import {createApp} from 'vue';
import RecoveryControls from './RecoveryControls.vue';
function mount():void{
 if(new URLSearchParams(location.search).get('recoveryRenderer')==='legacy')return;
 const legacy=document.querySelector<HTMLElement>('#resetRecovery');
 if(!legacy)return;
 const host=document.createElement('div');
 legacy.before(host);
 try{
  createApp(RecoveryControls,{activate:(id:string)=>legacy.querySelector<HTMLButtonElement>('#'+id)?.click()}).mount(host);
  legacy.hidden=true;
  document.documentElement.dataset.oasRecoveryRenderer='vue';
 }catch(error){
  host.remove();legacy.hidden=false;
  console.warn('Vue recovery controls unavailable; original recovery controls retained.',error);
 }
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
