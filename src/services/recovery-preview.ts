import type { OasRequirement } from '../domain/models.js';
import { validateImportPayload } from './import-validation.js';
import type { ImportKind } from './import-validation.js';

export interface RecoveryDelta {
  added: number;
  modified: number;
  removed: number;
  description: string;
}
type Dataset = Record<string, unknown>;

/**
 * Mirrors js/data-manager.js dataCompare(): full replacement is a distinct
 * cautionary action; selective previews show added/modified/removed by ID.
 * This function NEVER calls localStorage or applies an import.
 */
export function recoveryImportPreview(
  kind: ImportKind, current: Dataset, input: unknown,
  requirements: readonly OasRequirement[]
): RecoveryDelta {
  const next = kind === 'activities' && Array.isArray(input) ? {activities:input} : input;
  const incoming=validateImportPayload(kind,next,requirements);
  if(kind==='full')return {
    added:0,modified:0,removed:0,
    description:'Complete local application state will be replaced. A safety checkpoint will be made first.'
  };

  function rows(data: Dataset): Array<Record<string, unknown>> {
    if(kind==='requirements')return data.requirements as Array<Record<string, unknown>>;
    if(kind==='activities')return data.activities as Array<Record<string, unknown>>;
    if(kind==='schedule')return data.weeks as Array<Record<string, unknown>>;
    if(kind==='trees')return (data.trees as string[]).map(id=>({id}));
    const records=data.scoutRecords as Record<string, Record<string, unknown>>;
    return Object.entries(records ?? {}).map(([id,value])=>({id,...value}));
  }
  function mapped(dataset:Dataset):Map<unknown,string>{
    return new Map(rows(dataset).map(row=>[row.id,JSON.stringify(row)]));
  }
  const a=mapped(current),b=mapped(incoming);
  return {
    added:[...b.keys()].filter(k=>!a.has(k)).length,
    modified:[...b].filter(([k,value])=>a.has(k)&&a.get(k)!==value).length,
    removed:[...a.keys()].filter(k=>!b.has(k)).length,
    description:'Only this dataset will be replaced. Scout progress remains unchanged unless you explicitly import Scout progress or a full backup.'
  };
}
