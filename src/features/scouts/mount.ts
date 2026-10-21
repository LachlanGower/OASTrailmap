import { createApp, shallowReactive, type App } from 'vue';
import ScoutPicker from './ScoutPicker.vue';
import ScoutSubset from './ScoutSubset.vue';
import CompletionControls from './CompletionControls.vue';
import type { ScoutPickerSnapshot, ScoutCompletionSnapshot } from './types';

declare global {
  interface Window {
    __oasScoutControlsReady?: boolean;
    __oasScoutPickerSnapshot?: () => ScoutPickerSnapshot;
    __oasScoutCompletionSnapshot?: () => ScoutCompletionSnapshot | null;
    __oasScoutSelect?: (selection: string) => void;
    __oasScoutSaveCompletion?: (scout: string, requirementId: string, checked: boolean) => void;
    __oasScoutSaveDate?: (scout: string, requirementId: string, date: string) => void;
    __oasVueScoutRefresh?: () => void;
    __oasVueScoutSubsetRefresh?: () => void;
    __oasVueCompletionMount?: () => void;
    __oasVueCompletionUnmount?: () => void;
  }
}

const legacyMode = new URLSearchParams(location.search).get('scoutRenderer') === 'legacy';
let completion:App<Element> | null = null;

function mountScoutUi():void {
  if(legacyMode || document.documentElement.dataset.oasScoutRenderer==='vue') return;
  const originalSelect=document.querySelector<HTMLSelectElement>('#scoutSelect');
  const subset=document.querySelector<HTMLElement>('#multiScoutOptions');
  const field=originalSelect?.closest<HTMLElement>('label.field');
  if (!originalSelect || !subset || !field || !window.__oasScoutPickerSnapshot ||
      !window.__oasScoutSelect || !window.__oasScoutCompletionSnapshot ||
      !window.__oasScoutSaveCompletion || !window.__oasScoutSaveDate) return;
  const state=shallowReactive({current:window.__oasScoutPickerSnapshot()});
  let pickerApp:App<Element> | null=null;
  let subsetApp:App<Element> | null=null;
  try {
    pickerApp=createApp(ScoutPicker,{
      state,
      onSelect:(selection:string)=>window.__oasScoutSelect?.(selection)
    });
    pickerApp.mount(field);
    subsetApp=createApp(ScoutSubset,{state});
    subsetApp.mount(subset);
    window.__oasVueScoutRefresh=()=>{
      if(window.__oasScoutPickerSnapshot) state.current=window.__oasScoutPickerSnapshot();
    };
    window.__oasVueScoutSubsetRefresh=window.__oasVueScoutRefresh;

    window.__oasVueCompletionUnmount=()=>{
      completion?.unmount();
      completion=null;
    };
    window.__oasVueCompletionMount=()=>{
      window.__oasVueCompletionUnmount?.();
      const host=document.querySelector<HTMLElement>('#scoutCompletionHost');
      const snapshot=window.__oasScoutCompletionSnapshot?.();
      if(!host || !snapshot) return;
      // Original input handlers are bound to the old HTML in the wrapper.
      // Vue replaces that wrapper *after* legacy has attached its handlers.
      // The legacy logic remains the only authority for writing progress.
      try{
        completion=createApp(CompletionControls,{
          snapshot,
          onComplete:(scout:string,id:string,checked:boolean)=>
            window.__oasScoutSaveCompletion?.(scout,id,checked),
          onDate:(scout:string,id:string,date:string)=>
            window.__oasScoutSaveDate?.(scout,id,date)
        });
        completion.mount(host);
      }catch(error){
        console.warn('Vue completion control failed; restoring original detail renderer.',error);
        completion?.unmount();
        completion=null;
        window.__oasVueCompletionMount=undefined;
        window.__oasVueCompletionUnmount=undefined;
        // Re-render legacy completion controls without attempting Vue again.
        document.documentElement.dataset.oasScoutRenderer='fallback';
        window.__oasScoutSelect?.(window.__oasScoutPickerSnapshot?.().selected ?? '__all__');
      }
    };
    document.documentElement.dataset.oasScoutRenderer='vue';
    // Replace the initial controls in any already-open details panel.
    window.__oasVueCompletionMount();
  }catch(error){
    console.warn('Vue Scout controls unavailable; preserving original controls.',error);
    // Keep user-interactive original controls on failure.
    window.__oasVueScoutRefresh=undefined;
    window.__oasVueScoutSubsetRefresh=undefined;
    window.__oasVueCompletionMount=undefined;
    window.__oasVueCompletionUnmount=undefined;
    pickerApp?.unmount();
    subsetApp?.unmount();
    window.location.search; // Read-only: never reset Scout storage during failure.
  }
}

/** Legacy scripts await requirements and bind every click handler asynchronously. */
function ready():void {
  if(legacyMode) return;
  let count=0;
  const timer=window.setInterval(()=>{
    if(++count>330){window.clearInterval(timer);return;}
    if(!window.__oasScoutControlsReady) return;
    window.clearInterval(timer);
    mountScoutUi();
  },60);
}
if(document.readyState==='loading')
  document.addEventListener('DOMContentLoaded',ready,{once:true});
else ready();
