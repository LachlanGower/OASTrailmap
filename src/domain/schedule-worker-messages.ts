import type { Activity,LegacyStudioState,OasRequirement,PlannedWeek,ScoutRecords } from './models.js';
export interface ScheduleJob {requirements:OasRequirement[];records:ScoutRecords;studio:LegacyStudioState;scouts:string[];keepLocks:boolean;activities:Activity[]}
export type ScheduleJobResult={type:'progress';week:number;total:number}|{type:'complete';weeks:PlannedWeek[]}|{type:'error';message:string};
