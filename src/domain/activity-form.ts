import type { Activity } from './models.js';
export interface ActivityForm {
 title:string;description:string;duration:number;location:string;tags:string[];covers:string[];
 equipment:string;preparation:string;instructions:string;
}
export function activityText(value:unknown):string {
 if(Array.isArray(value))return value.map(v=>typeof v==='string'?v:JSON.stringify(v)).join('\n');
 return value===null||value===undefined?'':String(value);
}
export function activityForm(activity:Activity):ActivityForm {
 return {title:String(activity.title??activity.name??''),description:activityText(activity.description),duration:Number(activity.duration??activity.duration_minutes)||60,location:String(activity.location??'Flexible / anywhere'),tags:[...(activity.tags??[])],covers:[...activity.covers],equipment:activityText(activity.equipment),preparation:activityText(activity.preparation),instructions:activityText(activity.instructions)};
}
/** Keep hidden safety/review and custom metadata when changing visible form fields. */
export function activityFromForm(original:Activity,form:ActivityForm):Activity {
 if(!form.title.trim())throw new Error('Give the activity a name.');
 if(!Number.isFinite(form.duration)||form.duration<1||form.duration>1440)throw new Error('Choose a duration between 1 and 1,440 minutes.');
 const next:Activity={...original,title:form.title.trim(),description:form.description,location:form.location,tags:[...new Set(form.tags)],covers:[...new Set(form.covers)]};
 if(original.duration_minutes!==undefined)next.duration_minutes=form.duration;
 if(original.duration!==undefined||original.duration_minutes===undefined)next.duration=form.duration;
 for(const field of ['equipment','preparation','instructions'] as const)next[field]=form[field]===activityText(original[field])?original[field]:form[field];
 return next;
}
