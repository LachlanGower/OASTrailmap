import type { Activity,LegacyStudioState,OasRequirement,PlannedWeek,ScoutRecords } from './models.js';
import { requiredTimes } from './progress.js';
import { scheduleOccurrenceCounts } from './scheduling.js';
import { planNight,matchesPlanningTheme,stageTarget } from './night-planning.js';
import { ScoutProjection,projectWeek,fitsWeekLocation } from './scout-projection.js';

export function planThemeWeek(requirements:readonly OasRequirement[],records:ScoutRecords,studio:LegacyStudioState,scouts:readonly string[],index:number,theme:string,mode:'progression'|'random'='progression',random:()=>number=Math.random,activities:readonly Activity[]=[]):PlannedWeek {
 const weeks=studio.schedule??[],existing=weeks[index];if(!existing)throw new Error('Week no longer exists.');
 const next:PlannedWeek=JSON.parse(JSON.stringify(existing));
 next.activity=null;delete next.activityIds;next.confirmedSession=false;next.reviewed=false;next.locked=true;
 delete next.stageActivityIds;
 next.suggestedRequirementIds=[];next.suggestionThemes={};next.stageShortfalls={};next.scoutAssignments={};next.assignmentScope=[];
 if(!theme){next.theme='';next.tags=[];next.title='Week '+(index+1);next.requirementIds=[];return next;}
 const target=stageTarget(existing.requirementsPerStage??studio.requirementsPerStage??existing.stageLimit);
 const allowed=(studio.allowedLocations??[]) as string[];
 if(!requirements.some(r=>matchesPlanningTheme(r,[theme])&&fitsWeekLocation(r,existing,{useLocations:true,allowedLocations:allowed})))throw new Error('No eligible requirements match this theme and location selection.');
 const counts=scheduleOccurrenceCounts(weeks.filter((_,i)=>i!==index));
 const prior=new Set(weeks.slice(0,index).flatMap(w=>w.requirementIds));
 const scope=studio.strategy==='curriculum'?[]:scouts;
 const projection=new ScoutProjection(requirements,records,scope);
 weeks.slice(0,index).forEach((w,i)=>projectWeek(projection,requirements,w,i,{useLocations:true,allowedLocations:allowed,activities}));
 const plan=planNight({requirements,records,scouts:scope,themes:[theme],target,eligible:r=>scope.length>0||(counts.get(r.id)??0)<requiredTimes(r),projection,sessionId:existing.id||`week-${index+1}`,prior,useLocations:true,allowedLocations:allowed,location:String(existing.location??''),strategy:studio.strategy,mode,random});
 Object.assign(next,plan,{theme,themeMode:mode,tags:[theme],title:theme+' · Week '+(index+1),requirementsPerStage:target,capacity:target*3,stageLimit:target});
 return next;
}
