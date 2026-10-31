import {createApp,shallowReactive} from 'vue';
import TreeAdministration from './TreeAdministration.vue';
import TreeHistory from './TreeHistory.vue';
import type {TreeAdminSnapshot,TreeAdminAction,TreeCheckpoint} from './admin-types';

declare global {
 interface Window {
  __oasTreeAdminSnapshot?:()=>TreeAdminSnapshot;
  __oasTreeAdminRefresh?:()=>void;
  __oasVueTreeHistoryRender?:(entries:TreeCheckpoint[])=>boolean;
  __oasTreeRestoreSnapshot?:(index:number)=>void;
 }
}
const ids:Record<TreeAdminAction,string>={
 tree:'#treeSelect',mode:'#treeGraphMode',new:'#newTree',rename:'#renameTree',delete:'#deleteTree',
 tags:'#manageTags',snapshot:'#treeSnapshot',history:'#historyBtn',
 export:'#exportRequirements',import:'#importRequirements'
};
export function mountTreeAdministration():void {
 if(new URLSearchParams(location.search).get('treeAdminRenderer')==='legacy')return;
 const old=document.querySelector<HTMLElement>('#treeStudio .studio-toolbar');
 const history=document.querySelector<HTMLElement>('#historyPanel');
 if(!old||!history)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(!old.isConnected||++attempts>330){clearInterval(timer);return;}
  const original=Object.fromEntries(Object.entries(ids).map(([key,selector])=>
   [key,old.querySelector<HTMLElement>(selector)])) as Record<TreeAdminAction,HTMLElement|null>;
  type LegacyHandler=(this:HTMLElement,event:Event)=>unknown;
  const handlers=Object.fromEntries(Object.entries(original).map(([key,node])=>
   [key,node && ((key==='tree'||key==='mode'||key==='import')?
    (node as HTMLInputElement).onchange:(node as HTMLButtonElement).onclick)])) as Record<TreeAdminAction,LegacyHandler|null>;
  if(!window.__oasTreeAdminSnapshot||!window.__oasTreeRestoreSnapshot||
   Object.values(handlers).some(handler=>typeof handler!=='function'))return;
  clearInterval(timer);
  const state=shallowReactive({current:window.__oasTreeAdminSnapshot()});
  const wrapper=document.createElement('div');
  let rendered:HTMLElement|null=null;
  try{
   createApp(TreeAdministration,{
    state,
    trigger:(action:TreeAdminAction,event:Event)=>{
     const handler=handlers[action],originalElement=original[action];
     if(handler&&originalElement)handler.call(originalElement,event);
    }
   }).mount(wrapper);
   const mounted=wrapper.firstElementChild;
   if(!(mounted instanceof HTMLElement)||!mounted.classList.contains('studio-toolbar'))
    throw new Error('Vue tree administration did not mount');
   rendered=mounted;
   old.replaceWith(rendered);
   window.__oasTreeAdminRefresh=()=>{
    if(window.__oasTreeAdminSnapshot)state.current=window.__oasTreeAdminSnapshot();
   };
   const historyState=shallowReactive({current:[] as TreeCheckpoint[]});
   createApp(TreeHistory,{
    state:historyState,
    restore:(index:number)=>window.__oasTreeRestoreSnapshot?.(index)
   }).mount(history);
   window.__oasVueTreeHistoryRender=(entries:TreeCheckpoint[])=>{
    historyState.current=entries;return true;
   };
   document.documentElement.dataset.oasTreeAdminRenderer='vue';
  }catch(error){
   console.warn('Vue tree administration unavailable; keeping original handlers.',error);
   window.__oasTreeAdminRefresh=undefined;
   window.__oasVueTreeHistoryRender=undefined;
   if(rendered?.isConnected)rendered.replaceWith(old);
  }
 },60);
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',mountTreeAdministration,{once:true});
else mountTreeAdministration();
