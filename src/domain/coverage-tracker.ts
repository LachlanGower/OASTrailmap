import type { Activity, OasRequirement, PlannedWeek, ScoutRecords } from './models.js';
import { isCompleted, occurrenceState, recordFor, requiredTimes } from './progress.js';
import { scheduleOccurrenceCounts } from './scheduling.js';

export type CoverageStatus='unaddressed'|'partial'|'planned'|'complete';
export const coverageLabels:Record<CoverageStatus,string>={unaddressed:'Unaddressed',partial:'Partially addressed',planned:'Fully planned',complete:'Completed for selected Scouts'};
export interface CoverageRow {
  requirement:OasRequirement;needed:number;planned:number;activities:Activity[];
  scoutsDone:number;scoutsTotal:number;evidence:number;status:CoverageStatus;weeks:number[];
}
/** PR #40 tracker semantics: plans, linked activities and actual evidence remain separate. */
export function coverageRows(requirements:readonly OasRequirement[],activities:readonly Activity[],weeks:readonly PlannedWeek[],records:ScoutRecords,scouts:readonly string[]):CoverageRow[]{
  const counts=scheduleOccurrenceCounts(weeks);
  return requirements.map(requirement=>{
    const needed=requiredTimes(requirement),planned=counts.get(requirement.id)??0;
    const matching=activities.filter(a=>a.covers?.includes(requirement.id));
    const scoutsDone=scouts.filter(name=>isCompleted(records,name,requirement.id)).length;
    const evidence=scouts.reduce((sum,name)=>sum+occurrenceState(recordFor(records,name,requirement.id),requirement),0);
    const status=scouts.length&&scoutsDone===scouts.length?'complete':planned>=needed?'planned':planned>0||matching.length||evidence>0?'partial':'unaddressed';
    return {requirement,needed,planned,activities:matching,scoutsDone,scoutsTotal:scouts.length,evidence,status,weeks:weeks.flatMap((w,i)=>w.requirementIds.includes(requirement.id)?[i+1]:[])};
  });
}
export function coverageCsv(rows:readonly CoverageRow[]):string {
  const header=['Requirement ID','Requirement','Stage','Stream','Tags','Required separate opportunities','Count basis','Planned weeks','Weeks scheduled','Studio activities','Scouts completed','Scouts selected','Evidence opportunity totals','Status'];
  const values=rows.map(o=>[o.requirement.id,o.requirement.text,o.requirement.stage,o.requirement.stream,o.requirement.tags.join('; '),o.needed,o.requirement.occurrence_basis??'inferred',o.planned,o.weeks.join('; '),o.activities.map(a=>a.title??a.id).join('; '),o.scoutsDone,o.scoutsTotal,o.evidence,o.status]);
  return [header,...values].map(row=>row.map(value=>'"'+String(value??'').replace(/"/g,'""')+'"').join(',')).join('\r\n');
}
