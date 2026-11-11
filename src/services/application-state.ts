import type { Activity, LegacyProgressState, LegacyStudioState, OasRequirement } from '../domain/models.js';
import { LEGACY_KEYS, makeLegacyProgressPayload, parseStudio, readLegacySnapshot, type StoragePort } from './legacy-state.js';
import { buildLegacyExport, type DataExportKind } from './legacy-exports.js';
import { validateImportPayload, type ImportKind } from './import-validation.js';
import { validateRequirements } from '../domain/requirements.js';
import type { WorkbookPreviewData } from '../features/workbook/workbook-parser.js';

export interface ApplicationState { requirements: OasRequirement[]; progress: LegacyProgressState; studio: LegacyStudioState }
export interface Checkpoint { title: string; at: string; types: string[]; payload: Record<string, unknown> }
export const clone = <T>(x:T):T => JSON.parse(JSON.stringify(x));
export function loadApplication(storage: StoragePort, defaults: OasRequirement[]): ApplicationState {
  const snapshot=readLegacySnapshot(storage);
  const progress=snapshot.progress ?? {version:1,scoutRecords:{},activities:[]};
  const requirements=clone(progress.requirementsOverride ?? defaults);
  for(const r of progress.supplementalRequirements ?? []) if(!requirements.some(x=>x.id===r.id)) requirements.push(clone(r));
  validateRequirements(requirements);
  return {requirements,progress,studio:{trees:[],tags:[],schedule:[],history:[],order:{},treeGraphs:{},strategy:'progress',weeks:10,capacity:4,...snapshot.studio}};
}
export function exportApplication(state:ApplicationState,kind:DataExportKind,scope:string[]=[]):Record<string,unknown> {
  return buildLegacyExport(kind,{requirements:state.requirements,scoutRecords:state.progress.scoutRecords,activities:state.progress.activities??[],studio:state.studio,scope},new Date().toISOString());
}
export function checkpoint(storage:StoragePort,state:ApplicationState,title:string):void {
  const raw=storage.getItem(LEGACY_KEYS.checkpoints);
  const list:unknown=raw===null?[]:JSON.parse(raw);
  if(!Array.isArray(list))throw new Error('Invalid checkpoint storage; export a backup before recovery.');
  storage.setItem(LEGACY_KEYS.checkpoints,JSON.stringify([{title,at:new Date().toISOString(),types:['full'],payload:exportApplication(state,'full')},...list].slice(0,6)));
}
/** Checkpoint must succeed before either data key changes. Roll back a partial write. */
export function persistApplication(storage:StoragePort,next:ApplicationState,previous:ApplicationState,title:string):ApplicationState {
  validateRequirements(next.requirements);
  const progress=makeLegacyProgressPayload({scoutRecords:next.progress.scoutRecords,activities:next.progress.activities??[],requirements:next.requirements,previous:next.progress});
  parseStudio(next.studio);
  checkpoint(storage,previous,title);
  const beforeProgress=storage.getItem(LEGACY_KEYS.progress), beforeStudio=storage.getItem(LEGACY_KEYS.studio);
  try {
    storage.setItem(LEGACY_KEYS.progress,JSON.stringify(progress));
    storage.setItem(LEGACY_KEYS.studio,JSON.stringify(next.studio));
  } catch(error) {
    // StoragePort deliberately has no removeItem; null keys roll back to valid empty payloads.
    try {storage.setItem(LEGACY_KEYS.progress,beforeProgress??JSON.stringify(previous.progress));storage.setItem(LEGACY_KEYS.studio,beforeStudio??JSON.stringify(previous.studio));}
    catch {throw new Error('Save and rollback failed. Stop editing and restore the safety checkpoint.');}
    throw error;
  }
  return {...next,progress};
}
export function applyDataset(current:ApplicationState,kind:ImportKind,input:unknown):ApplicationState {
  const x=validateImportPayload(kind,kind==='activities'&&Array.isArray(input)?{activities:input}:input,current.requirements);
  const next=clone(current);
  if(kind==='full'){next.requirements=clone(x.requirements as OasRequirement[]);next.progress.scoutRecords=clone(x.scoutRecords as LegacyProgressState['scoutRecords']);next.progress.activities=clone((x.activities??[]) as Activity[]);if(x.studio)next.studio={...next.studio,...parseStudio(x.studio)};}
  if(kind==='requirements'){next.requirements=clone(x.requirements as OasRequirement[]);next.studio.trees=clone((x.tree_registry??[...new Set(next.requirements.map(r=>String(r.tree??r.stream)))]) as string[]);next.studio.tags=clone((x.tag_library??[...new Set(next.requirements.flatMap(r=>r.tags))]) as string[]);next.studio.treeGraphs=clone((x.tree_graphs??{}) as Record<string,unknown>);}
  if(kind==='progress')next.progress.scoutRecords=clone(x.scoutRecords as LegacyProgressState['scoutRecords']);
  if(kind==='activities')next.progress.activities=clone(x.activities as Activity[]);
  if(kind==='schedule'){next.studio.schedule=clone(x.weeks as NonNullable<LegacyStudioState['schedule']>);next.studio.weeks=next.studio.schedule.length;next.studio.capacity=Number(x.capacity)||4;next.studio.strategy=String(x.strategy??'progress');}
  if(kind==='trees'){next.studio.trees=clone(x.trees as string[]);next.studio.order=clone(x.order as Record<string,string[]>);next.studio.treeGraphs=clone(x.treeGraphs as Record<string,unknown>);}
  return next;
}
export function applyWorkbook(current:ApplicationState,parsed:WorkbookPreviewData):ApplicationState {
  const next=clone(current);
  for(const r of parsed.extraReqs)if(!next.requirements.some(x=>x.id===r.id))next.requirements.push(r as OasRequirement);
  for(const item of parsed.workflows){const r=next.requirements.find(r=>r.id===item.id);if(r&&!r.workflow)r.workflow=item.workflow;}
  for(const scout of parsed.scouts)next.progress.scoutRecords[scout+'::__roster__']??={completed:false,date:'',source:'workbook-roster'};
  for(const row of parsed.rows){const key=row.scout+'::'+row.id,old=next.progress.scoutRecords[key];next.progress.scoutRecords[key]={...old,completed:true,date:row.date||old?.date||'',source:'workbook',sourceSheet:row.sourceSheet,sourceRow:row.sourceRow,workflow:row.workflow,highlighted:row.highlighted||false};}
  return next;
}
