import {createApp,shallowReactive} from 'vue';
import TreeEditor from './TreeEditor.vue';
import type {TreeEditorSnapshot} from './tree-editor-model';

declare global {
 interface Window {
  __oasTreeEditorSnapshot?:()=>TreeEditorSnapshot;
  __oasVueTreeEditorRender?:(snapshot:TreeEditorSnapshot)=>boolean;
  __oasTreeEditorSave?:(form:FormData)=>void;
  __oasTreeEditorBreak?:(child:string,parent:string)=>void;
  __oasTreeEditorLegacyRender?:()=>void;
 }
}
/** Independent of ?treeRenderer=legacy: review either Vue island separately. */
export function mountTreeEditor():void {
 if(new URLSearchParams(location.search).get('treeEditorRenderer')==='legacy')return;
 const panel=document.querySelector<HTMLElement>('#treeEditor');
 if(!panel)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(!panel.isConnected||++attempts>330){clearInterval(timer);return;}
  const required=[window.__oasTreeEditorSnapshot,window.__oasTreeEditorSave,
   window.__oasTreeEditorBreak,window.__oasTreeEditorLegacyRender];
  if(required.some(fn=>typeof fn!=='function'))return;
  const snapshot=window.__oasTreeEditorSnapshot?.();
  if(!snapshot)return;
  clearInterval(timer);
  const original=panel.innerHTML;
  try{
   const state=shallowReactive({current:snapshot});
   createApp(TreeEditor,{
    state,
    save:(form:FormData)=>window.__oasTreeEditorSave?.(form),
    breakLink:(child:string,parent:string)=>window.__oasTreeEditorBreak?.(child,parent)
   }).mount(panel);
   window.__oasVueTreeEditorRender=next=>{state.current=next;return true;};
   document.documentElement.dataset.oasTreeEditorRenderer='vue';
  }catch(error){
   console.warn('Vue mapper editor unavailable; restoring original editor.',error);
   window.__oasVueTreeEditorRender=undefined;
   panel.innerHTML=original;
   window.__oasTreeEditorLegacyRender?.();
  }
 },60);
}
if(document.readyState==='loading')
 document.addEventListener('DOMContentLoaded',mountTreeEditor,{once:true});
else mountTreeEditor();
