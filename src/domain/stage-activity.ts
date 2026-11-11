import type { Activity,OasRequirement,PlannedWeek } from './models.js';
import { activityFitsWeek,fitsWeekLocation,type ProjectionContext } from './scout-projection.js';

export function stageActivityIssue(week:PlannedWeek,stage:number,activity:Activity,requirements:readonly OasRequirement[],context:ProjectionContext={}):string {
 const inStage=requirements.filter(r=>r.stage===stage&&activity.covers.includes(r.id));
 if(!inStage.length)return `This activity has no Stage ${stage} coverage. Edit its coverage in Activity Studio first.`;
 if(!activityFitsWeek(activity,week,context))return 'The activity location does not match this night or its allowed locations.';
 const planned=requirements.filter(r=>r.stage===stage&&week.requirementIds.includes(r.id));
 const covered=planned.filter(r=>activity.covers.includes(r.id));
 if(planned.length&&!covered.length)return `This activity does not cover any of the planned Stage ${stage} statements.`;
 if(covered.some(r=>!fitsWeekLocation(r,{...week,location:activity.location||week.location},context)))return 'Some covered statements cannot be delivered at this activity location.';
 return '';
}
/** One stable activity reference per stage. Unrelated week metadata and evidence stay untouched. */
export function assignStageActivity(week:PlannedWeek,stage:number,id:string|null,activities:readonly Activity[],requirements:readonly OasRequirement[],context:ProjectionContext={}):PlannedWeek {
 if(![1,2,3].includes(stage))throw new Error('Choose Stage 1, 2 or 3.');
 if(week.locked)throw new Error('Unlock the week before changing its stage activity.');
 const stageActivityIds={...week.stageActivityIds};
 if(id){
  const activity=activities.find(a=>a.id===id);if(!activity)throw new Error('This activity is no longer in the Activity Bank.');
  const issue=stageActivityIssue(week,stage,activity,requirements,context);if(issue)throw new Error(issue);
  stageActivityIds[String(stage)]=id;
 }else delete stageActivityIds[String(stage)];
 return {...week,stageActivityIds};
}
