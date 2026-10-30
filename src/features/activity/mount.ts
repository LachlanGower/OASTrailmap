import {createApp,shallowReactive} from 'vue';
import ActivityEditor,{type ActivityEditorModel,type ActivityOption} from './ActivityEditor.vue';
declare global {interface Window {__oasActivityEditorOpen?:(index:number)=>void;__oasActivityEditorClose?:()=>void;}}
const params=new URLSearchParams(location.search);
function mount():void{
 if(params.get('activityRenderer')==='legacy')return;
 const legacy=document.querySelector<HTMLElement>('#activityEditor');
 if(!legacy)return;
 const host=document.createElement('div');host.hidden=true;legacy.after(host);
 const state=shallowReactive<{current:ActivityEditorModel}>({current:{index:-1,fields:[],locations:[],tags:[],coverage:[]}});
 const original=(name:string)=>legacy.querySelector<HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement>('[name="'+name+'"]');
 function read(index:number):ActivityEditorModel{
  const form=legacy.querySelector<HTMLFormElement>('#activityForm');
  if(!form)throw Error('Legacy activity form is unavailable');
  const names=['title','description','duration','location','equipment','preparation','instructions','safety','review'];
  const options=(name:string):ActivityOption[]=>Array.from(form.querySelectorAll<HTMLInputElement>('input[name="'+name+'"]')).map(input=>({value:input.value,label:input.checked?'selected':'',description:input.parentElement?.textContent?.trim()||input.value}));
  return {index,fields:names.map(name=>({name,value:original(name)?.value||''})),locations:Array.from(form.querySelectorAll<HTMLOptionElement>('select[name="location"] option')).map(o=>o.value),tags:options('tags'),coverage:options('covers')};
 }
 function update(name:string,value:string):void{const input=original(name);if(input)input.value=value;state.current={...state.current,fields:state.current.fields.map(f=>f.name===name?{...f,value}:f)};}
 function toggle(name:string,value:string,checked:boolean):void{
  const node=Array.from(legacy.querySelectorAll<HTMLInputElement>('input[name="'+name+'"]')).find(input=>input.value===value);
  if(node)node.checked=checked;
  state.current={...state.current,[name==='tags'?'tags':'coverage']:(name==='tags'?state.current.tags:state.current.coverage).map(o=>o.value===value?{...o,label:checked?'selected':''}:o)};
 }
 function close():void{host.hidden=true;legacy.hidden=true;}
 try{
  createApp(ActivityEditor,{state,update,toggle,suggest:()=>{legacy.querySelector<HTMLButtonElement>('#activitySuggest')?.click();state.current=read(state.current.index);},save:()=>{const form=legacy.querySelector<HTMLFormElement>('#activityForm');if(form?.reportValidity())form.requestSubmit();},cancel:()=>legacy.querySelector<HTMLButtonElement>('#activityCancel')?.click()}).mount(host);
  window.__oasActivityEditorOpen=index=>{state.current=read(index);legacy.hidden=true;host.hidden=false;};
  window.__oasActivityEditorClose=close;
  document.documentElement.dataset.oasActivityRenderer='vue';
 }catch(error){host.remove();console.warn('Vue activity editor unavailable; original editor retained.',error);}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
