import type { Activity,OasRequirement,PlannedWeek,ScoutRecords } from './models.js';
import { occurrenceState,recordFor,requiredTimes } from './progress.js';
import { orderSession } from './scheduling.js';
import { locationOptions } from './planning-locations.js';

/** Disposable planning state; never changes the Scout evidence passed to it. */
export class ScoutProjection {
 private requirements:Map<string,OasRequirement>;
 private counts=new Map<string,Map<string,number>>();
 private sessions=new Map<string,Map<string,Set<string>>>();
 private stageMissing=new Map<string,Map<number,number>>();
 private recordedCache=new Map<string,number[]>();
 readonly scouts:string[];
 constructor(requirements:readonly OasRequirement[],readonly records:ScoutRecords,scouts:readonly string[],seed=true){
  this.requirements=new Map(requirements.map(r=>[r.id,r]));this.scouts=[...new Set(scouts)];
  if(seed)for(const scout of this.scouts){this.counts.set(scout,new Map(requirements.map(r=>[r.id,occurrenceState(recordFor(records,scout,r.id),r)])));this.sessions.set(scout,new Map(requirements.map(r=>{const sessions=recordFor(records,scout,r.id).sessionEvidence;return [r.id,new Set(Array.isArray(sessions)?sessions:[])];})));this.stageMissing.set(scout,new Map([1,2,3].map(stage=>[stage,requirements.filter(r=>r.stage===stage&&!this.complete(scout,r.id)).length])));}
 }
 copy():ScoutProjection {
  const next=new ScoutProjection([...this.requirements.values()],this.records,this.scouts,false);
  next.counts=new Map(this.counts);next.sessions=new Map(this.sessions);next.stageMissing=new Map(this.stageMissing);next.recordedCache=new Map(this.recordedCache);return next;
 }
 count(scout:string,id:string):number{return this.counts.get(scout)?.get(id)??0;}
 recordedStages(scout:string,session:string):number[]{const key=JSON.stringify([scout,session]);const cached=this.recordedCache.get(key);if(cached)return cached;const stages=[...new Set([...this.requirements.values()].filter(r=>this.sessions.get(scout)?.get(r.id)?.has(session)).map(r=>r.stage))];this.recordedCache.set(key,stages);return stages;}
 complete(scout:string,id:string):boolean{const r=this.requirements.get(id);return !!r&&this.count(scout,id)>=requiredTimes(r);}
 lowerStageOutstanding(scout:string,stage:number):OasRequirement[]{return [...this.requirements.values()].filter(r=>r.stage<stage&&!this.complete(scout,r.id));}
 weeklyCohorts(session:string):Record<string,number>{
  const cohorts:Record<string,number>={};
  for(const scout of this.scouts){
   const stage=[1,2,3].find(stage=>(this.stageMissing.get(scout)?.get(stage)??0)>0);
   const recorded=this.recordedStages(scout,session);
   if(stage&&recorded.length<=1&&(!recorded.length||recorded[0]===stage))cohorts[scout]=stage;
  }
  return cohorts;
 }
 participants(r:OasRequirement,session?:string):string[]{return this.scouts.filter(s=>!this.complete(s,r.id)&&![1,2,3].some(stage=>stage<r.stage&&(this.stageMissing.get(s)?.get(stage)??0)>0)&&(!session||!this.sessions.get(s)?.get(r.id)?.has(session))&&(r.stage===1?[]:r.prerequisites).every(id=>this.complete(s,id)));}
 grant(r:OasRequirement,scouts:readonly string[],session:string):void {
  const ready=new Set(this.participants(r));
  for(const scout of scouts){if(!ready.has(scout))continue;const seen=new Set(this.sessions.get(scout)!.get(r.id)!);if(seen.has(session))continue;seen.add(session);const sessions=new Map(this.sessions.get(scout)!);sessions.set(r.id,seen);this.sessions.set(scout,sessions);const counts=new Map(this.counts.get(scout)!);counts.set(r.id,Math.min(requiredTimes(r),this.count(scout,r.id)+1));this.counts.set(scout,counts);if(this.complete(scout,r.id)){const missing=new Map(this.stageMissing.get(scout)!);missing.set(r.stage,Math.max(0,(missing.get(r.stage)??0)-1));this.stageMissing.set(scout,missing);}this.recordedCache.delete(JSON.stringify([scout,session]));}
 }
}
export interface WeekParticipation {
 requirementScouts:Record<string,string[]>;
 stageScouts:Record<string,string[]>;
 conditionalScouts:Record<string,string[]>;
 warnings:string[];
 scoutStages:Record<string,number>;
 unassignedScouts:string[];
 lowerStageRemaining:Record<string,Record<string,number>>;
 stageCohorts:Record<string,string[]>;
 unassignedReasons:Record<string,string>;
 completedScouts:string[];
}
export interface ProjectionContext {useLocations?:boolean;allowedLocations?:readonly string[];activities?:readonly Activity[]}
const specific=(v:unknown):v is string=>typeof v==='string'&&!!v&&!['Flexible / anywhere','Anywhere','Any location'].includes(v);
export function fitsWeekLocation(r:OasRequirement,week:PlannedWeek,scope:ProjectionContext={}):boolean {
 const locations=locationOptions(r),flexible=locations.some(l=>!specific(l));
 const allowed=scope.allowedLocations??[],fixed=specific(week.location)?week.location:undefined;
 if(fixed&&scope.useLocations&&allowed.length&&!allowed.includes(fixed))return false;
 if(fixed&&!flexible&&!locations.includes(fixed))return false;
 if(scope.useLocations&&allowed.length&&!flexible&&!locations.some(l=>allowed.includes(l)))return false;
 return true;
}
/** Choose one ready stage at the start of the night; primary-theme work wins over suggestions. */
export function chooseScoutStages(projection:ScoutProjection,requirements:readonly OasRequirement[],session:string,suggested:readonly string[]=[],existing:Record<string,number>={}):Record<string,number>{
 const stages={...existing},cohorts=projection.weeklyCohorts(session);
 for(const scout of projection.scouts){
  if(stages[scout])continue;
  const ready=requirements.some(r=>r.stage===cohorts[scout]&&projection.participants(r,session).includes(scout));
  if(ready)stages[scout]=cohorts[scout];
 }
 return stages;
}
export function stageActivity(week:PlannedWeek,stage:number,scope:ProjectionContext):Activity|undefined {
 const id=week.stageActivityIds?.[String(stage)];return id?scope.activities?.find(a=>a.id===id):undefined;
}
export function activityFitsWeek(activity:Activity,week:PlannedWeek,scope:ProjectionContext={}):boolean {
 const venue=String(activity.location??'');
 if(!specific(venue))return true;
 if(specific(week.location)&&week.location!==venue)return false;
 return !scope.useLocations||!scope.allowedLocations?.length||scope.allowedLocations.includes(venue);
}
/** Replay a single exclusive stage/activity per Scout; cross-stage unlocks wait until later weeks. */
export function projectWeek(projection:ScoutProjection,requirements:readonly OasRequirement[],week:PlannedWeek,index:number,scope:ProjectionContext={}):WeekParticipation {
 const result:WeekParticipation={requirementScouts:{},stageScouts:{'1':[],'2':[],'3':[]},conditionalScouts:{},warnings:[],scoutStages:{},unassignedScouts:[],stageCohorts:{'1':[],'2':[],'3':[]},unassignedReasons:{},completedScouts:[],lowerStageRemaining:Object.fromEntries([2,3].map(stage=>[String(stage),Object.fromEntries(projection.scouts.map(s=>[s,projection.lowerStageOutstanding(s,stage).length]))]))};
 const byId=new Map(requirements.map(r=>[r.id,r])),session=week.id||`week-${index+1}`;
 const cohorts=projection.weeklyCohorts(session);
 for(const scout of projection.scouts){if(cohorts[scout])result.stageCohorts[String(cohorts[scout])].push(scout);else if(requirements.every(r=>projection.complete(scout,r.id)))result.completedScouts.push(scout);}
 for(const scout of projection.scouts)if(projection.recordedStages(scout,session).length>1)result.warnings.push(`${scout}: existing evidence for this week spans multiple stages; review before planning more work.`);
 const stageEligible=(r:OasRequirement):boolean=>{
  if(!fitsWeekLocation(r,week,scope))return false;
  const activityId=week.stageActivityIds?.[String(r.stage)];
  if(!activityId)return true; // The planned group activity is provisional until linked.
  const activity=stageActivity(week,r.stage,scope);
  return !!activity&&activityFitsWeek(activity,week,scope)&&activity.covers.includes(r.id)&&fitsWeekLocation(r,{...week,location:activity.location||week.location},scope);
 };
 const planned=week.requirementIds.map(id=>byId.get(id)).filter((r):r is OasRequirement=>!!r);
 result.scoutStages=chooseScoutStages(projection,planned.filter(stageEligible),session,week.suggestedRequirementIds);
 for(const scout of projection.scouts){const stage=result.scoutStages[scout];if(stage)(result.stageScouts[String(stage)]??=[]).push(scout);else if(cohorts[scout]){
  const needed=cohorts[scout],stagePlan=planned.filter(r=>r.stage===needed),activityId=week.stageActivityIds?.[String(needed)];
  result.unassignedScouts.push(scout);
  result.unassignedReasons[scout]=!stagePlan.length?`Needs Stage ${needed}; no work was found within this night's themes and locations.`:
   !stagePlan.some(r=>fitsWeekLocation(r,week,scope))?`The planned Stage ${needed} statements do not suit this location.`:
   activityId?`The Stage ${needed} activity is missing, incompatible or does not cover this Scout's ready statements.`:
   `The planned Stage ${needed} statements are not ready or have already been recorded for this Scout.`;
 }}
 for(const [stage,id] of Object.entries(week.stageActivityIds??{})){
  const activity=scope.activities?.find(a=>a.id===id);
  if(!activity)result.warnings.push(`Stage ${stage}: linked activity is missing from the bank.`);
  else if(!activityFitsWeek(activity,week,scope))result.warnings.push(`Stage ${stage}: activity location does not match this night.`);
 }
 for(const id of orderSession([...new Set(week.requirementIds)],requirements)){
  const r=byId.get(id);result.requirementScouts[id]=[];
  if(!r){result.warnings.push('This plan contains an unknown requirement.');continue;}
  if(!fitsWeekLocation(r,week,scope)){result.warnings.push('Location does not suit: '+r.text);continue;}
  if(!stageEligible(r)){result.warnings.push('Not covered by the linked stage activity: '+r.text);continue;}
  const names=projection.participants(r,session).filter(s=>result.scoutStages[s]===r.stage);result.requirementScouts[id]=names;
  result.conditionalScouts[id]=names.filter(s=>[...byId.values()].some(p=>p.stage<r.stage&&occurrenceState(recordFor(projection.records,s,p.id),p)<requiredTimes(p))||(r.stage===1?[]:r.prerequisites).some(parent=>{const p=byId.get(parent);return !p||occurrenceState(recordFor(projection.records,s,parent),p)<requiredTimes(p);}));
  if(projection.scouts.length&&!names.length)result.warnings.push('No selected Scouts are currently ready and still need: '+r.text);
  projection.grant(r,names,session);
 }
 return result;
}
export function projectSchedule(requirements:readonly OasRequirement[],records:ScoutRecords,weeks:readonly PlannedWeek[],scouts:readonly string[],scope:ProjectionContext={}):WeekParticipation[]{
 const projection=new ScoutProjection(requirements,records,scouts);
 return weeks.map((w,i)=>projectWeek(projection,requirements,w,i,scope));
}
