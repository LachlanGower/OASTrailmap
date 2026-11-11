import type { Activity,LegacyStudioState,OasRequirement,PlannedWeek,ScoutRecords } from './models.js';
import { planNight,planningThemes,matchesPlanningTheme,stageTarget,compareNightPlans,couldImproveNight,completeNight,type NightPlan,type NightOptions } from './night-planning.js';
import { requiredTimes } from './progress.js';
import { ScoutProjection,projectWeek,fitsWeekLocation } from './scout-projection.js';

/** Theme-led stage quotas. Locked plans and earned Scout evidence are never changed. */
export function generateSchedule(requirements:OasRequirement[],records:ScoutRecords,studio:LegacyStudioState,selected:string[],keepLocks:boolean,activities:readonly Activity[]=[],onProgress?:(week:number,total:number)=>void):PlannedWeek[]{
 const count=Math.max(1,Math.min(60,Math.floor(Number(studio.weeks)||10)));
 const target=stageTarget(studio.requirementsPerStage),scope=studio.strategy==='curriculum'?[]:selected;
 const preferred=[...new Set(studio.preferredThemes??[])];
 const availableThemes=preferred.length?preferred:[...new Set(requirements.flatMap(planningThemes))];
 const previous=studio.schedule??[],counts=new Map<string,number>(),next:PlannedWeek[]=[];
 const projection=new ScoutProjection(requirements,records,scope);
 const available=(r:OasRequirement)=>scope.length?projection.participants(r).length>0:(counts.get(r.id)??0)<requiredTimes(r);
 if(keepLocks&&previous.some((w,i)=>w.locked&&i>=count))throw new Error('Increase week count to preserve every locked week.');
 if(keepLocks)for(const w of previous)if(w.locked)for(const id of new Set(w.requirementIds))counts.set(id,(counts.get(id)??0)+1);
 const prior=new Set<string>();
 for(let index=0;index<count;index++){
  const old=previous[index];
  if(keepLocks&&old?.locked){next.push(JSON.parse(JSON.stringify(old)));projectWeek(projection,requirements,old,index,{useLocations:true,allowedLocations:(studio.allowedLocations??[]) as string[],activities});old.requirementIds.forEach(id=>prior.add(id));onProgress?.(index+1,count);continue;}
  const rotated=availableThemes.length?[...availableThemes.slice(index%availableThemes.length),...availableThemes.slice(0,index%availableThemes.length)]:[];
  const allowed=(studio.allowedLocations??[]) as string[];
  const possible=requirements.filter(available);
  const themes=rotated.filter(t=>possible.some(r=>matchesPlanningTheme(r,[t])&&fitsWeekLocation(r,{requirementIds:[]},{useLocations:true,allowedLocations:allowed})));
  let plan:NightPlan|undefined,theme='';
  for(const candidateTheme of themes.length?themes:['']){
   const options:NightOptions={requirements,records,scouts:scope,themes:candidateTheme?[candidateTheme]:[],target,eligible:scope.length?()=>true:available,projection,sessionId:`week-${index+1}`,prior,useLocations:true,allowedLocations:allowed,strategy:studio.strategy};
   if(plan&&!couldImproveNight(options,plan))continue;
   const candidate=planNight(options);
   if(!plan||compareNightPlans(candidate,plan)>0){plan=candidate;theme=candidateTheme;}
   if(completeNight(plan,options))break;
  }
  const week:PlannedWeek={id:`week-${index+1}`,title:theme||`Week ${index+1}`,theme,tags:theme?[theme]:[],capacity:target*3,stageLimit:target,requirementsPerStage:target,locked:false,activity:null,reviewed:false,...plan!};
  next.push(week);projectWeek(projection,requirements,week,index,{useLocations:true,allowedLocations:allowed});week.requirementIds.forEach(id=>{counts.set(id,(counts.get(id)??0)+1);prior.add(id);});
  onProgress?.(index+1,count);
 }
 return next;
}
