import { createApp, type App } from 'vue';
import WorkbookImportPreview from './WorkbookImportPreview.vue';
import {
  parseCubWorkbook, validateWorkbookPreview
} from './workbook-parser';
import type {
  RequirementRow,WorkbookPreviewData,WorkbookLike,SpreadsheetDecoder
} from './workbook-parser';

interface ExcelDecoder extends SpreadsheetDecoder {
 read:(data:ArrayBuffer,settings:{type:'array';cellDates:true;cellStyles:true})=>WorkbookLike;
}
declare global {
 interface Window {
  XLSX?:ExcelDecoder;
  __oasWorkbookRequirements?:()=>RequirementRow[];
  __oasWorkbookApply?: (data:WorkbookPreviewData)=>void;
  __oasWorkbookStart?: (file:File)=>Promise<void>;
 }
}
const useLegacy=new URLSearchParams(location.search).get('workbookRenderer')==='legacy';
let mounted:App<Element>|null=null;
/** An explicit Cancel must leave every browser data key byte-for-byte alone. */
function discard(panel:HTMLElement):void {
 mounted?.unmount();mounted=null;
 panel.replaceChildren();
 panel.hidden=true;
}
export function mountWorkbookImporter():void {
 if(useLegacy)return;
 let attempts=0;
 const timer=window.setInterval(()=>{
  if(++attempts>330){window.clearInterval(timer);return;}
  if(!window.__oasWorkbookRequirements||!window.__oasWorkbookApply||
    !document.querySelector('#workbookFile')||!document.querySelector('#previewPanel'))return;
  window.clearInterval(timer);
  window.__oasWorkbookStart=async file=>{
   const status=document.querySelector<HTMLElement>('#importStatus');
   const panel=document.querySelector<HTMLElement>('#previewPanel');
   if(!panel||!status)return;
   if(!window.XLSX){
    status.textContent='Excel reader is still loading. Check your internet connection and try again.';
    return;
   }
   try{
    const workbook=window.XLSX.read(await file.arrayBuffer(),
      {type:'array',cellDates:true,cellStyles:true});
    const requirements=window.__oasWorkbookRequirements?.()??[];
    const parsed=validateWorkbookPreview(parseCubWorkbook(workbook,window.XLSX,requirements));
    discard(panel);
    mounted=createApp(WorkbookImportPreview,{
     filename:file.name,
     preview:parsed,
     onApply:()=>{
      try{
       window.__oasWorkbookApply?.(parsed);
       discard(panel);
      }catch(error){
       status.textContent='Could not apply workbook: '+String((error as Error).message||error);
      }
     },
     onCancel:()=>discard(panel)
    });
    mounted.mount(panel);
    panel.hidden=false;
    status.textContent='Preview ready — review the unmatched rows before applying.';
    document.documentElement.dataset.oasWorkbookRenderer='vue';
   }catch(error){
    status.textContent='Could not read workbook: '+String((error as Error).message||error);
    console.warn('Workbook preview rejected; no data was applied.',error);
   }
  };
 };
 const init=()=>mountWorkbookImporter();
 if(document.readyState==='loading')
   document.addEventListener('DOMContentLoaded',init,{once:true});
 else init();
}
mountWorkbookImporter();
