import { computed, reactive, ref } from 'vue';
import type { ApplicationState } from './services/application-state';
import { clone, loadApplication, persistApplication } from './services/application-state';
import { scoutNames, scopedScoutNames } from './domain/progress';
import { parseRequirementsData } from './domain/requirements';
export const state=ref<ApplicationState|null>(null);
export const ui=reactive({error:'',notice:'',selection:'__all__',subset:[] as string[],requirementId:'',stale:false});
export const names=computed(()=>state.value?scoutNames(state.value.progress.scoutRecords):[]);
export const scope=computed(()=>state.value?scopedScoutNames(state.value.progress.scoutRecords,ui.selection,ui.subset):[]);
export const tags=computed(()=>[...new Set([...(state.value?.studio.tags??[]),...(state.value?.requirements.flatMap(r=>r.tags)??[])])].sort());
export async function initialize(){try{const r=await fetch(new URL('data/requirements.json',document.baseURI));if(!r.ok)throw new Error('Curriculum could not be loaded');state.value=loadApplication(localStorage,parseRequirementsData(await r.json()).requirements);}catch(e){ui.error=String(e);}}
export function change(title:string,edit:(next:ApplicationState)=>void):boolean {
  if(!state.value)return false;
  if(ui.stale){ui.error='Another tab changed local data. Reload this page before editing to preserve those changes.';return false;}
  try{const next=clone(state.value);edit(next);state.value=persistApplication(localStorage,next,state.value,title);ui.notice='Saved locally · '+new Date().toLocaleTimeString();ui.error='';return true;}catch(e){ui.error=String(e);return false;}
}
export function replace(title:string,next:ApplicationState){return change(title,draft=>Object.assign(draft,next));}
