import { createApp, shallowReactive } from 'vue';
import TreeCanvas from './TreeCanvas.vue';
import type { TreeViewSnapshot } from './tree-view-model';

declare global {
 interface Window {
   __oasTreeSnapshot?:()=>TreeViewSnapshot;
   __oasVueTreeRender?:(snapshot:TreeViewSnapshot)=>boolean;
   __oasTreeSelect?:(id:string)=>void;
   __oasTreeQuickLink?:(id:string,action:string)=>void;
   __oasTreeDrop?:(id:string,target:string)=>void;
   __oasTreeEdges?:()=>void;
   __oasTreeLegacyRender?:()=>void;
 }
}
export function mountTreeCanvas():void {
 if(new URLSearchParams(location.search).get('treeRenderer')==='legacy')return;
 const old=document.querySelector<HTMLElement>('#treeCanvas');
 if(!old)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(!old.isConnected||++attempts>330){clearInterval(timer);return;}
  const required=[window.__oasTreeSnapshot,window.__oasTreeSelect,window.__oasTreeQuickLink,
   window.__oasTreeDrop,window.__oasTreeEdges,window.__oasTreeLegacyRender];
  if(required.some(x=>typeof x!=='function')||!old.querySelector('.tree-lanes'))return;
  clearInterval(timer);
  const original=old.innerHTML;
  const state=shallowReactive({current:window.__oasTreeSnapshot!()});
  try {
   createApp(TreeCanvas,{
    state,
    selectNode:(id:string)=>window.__oasTreeSelect?.(id),
    quickLink:(id:string,action:string)=>window.__oasTreeQuickLink?.(id,action),
    dropNode:(id:string,target:string)=>window.__oasTreeDrop?.(id,target),
    paintEdges:()=>window.__oasTreeEdges?.()
   }).mount(old);
   window.__oasVueTreeRender=snapshot=>{state.current=snapshot;return true;};
   document.documentElement.dataset.oasTreeRenderer='vue';
  }catch(error){
   console.warn('Vue tree canvas failed; preserving original mapper.',error);
   window.__oasVueTreeRender=undefined;
   old.innerHTML=original;
   window.__oasTreeLegacyRender?.();
  }
 },60);
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',mountTreeCanvas,{once:true});
else mountTreeCanvas();
