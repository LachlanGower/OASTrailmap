import type { LegacyStudioState, OasRequirement, PlannedWeek, ScoutRecords } from './models.js';
import { isCompleted } from './progress.js';
import { orderSession } from './scheduling.js';
type Locations={preferred?:string;alternatives?:string[]};
const locations=(r?:OasRequirement):Locations=>(r?.locations??{}) as Locations;
/** PR #40 scoring and hypothetical completion; no storage, DOM or completion writes. */
export function generateSchedule(requirements:OasRequirement[],records:ScoutRecords,studio:LegacyStudioState,selected:string[],keepLocks:boolean):PlannedWeek[]{
  const weeks=Math.max(1,Math.min(60,Number(studio.weeks)||40)),scope=studio.strategy==='curriculum'?[]:selected;
  if(keepLocks&&(studio.schedule??[]).some((w,i)=>w.locked&&i>=weeks))throw new Error('Increase week count to preserve every locked week.');
  const scheduled=new Set<string>(),preserved=new Map<number,PlannedWeek>();
  if(keepLocks)(studio.schedule??[]).forEach((w,i)=>{if(w.locked){preserved.set(i,JSON.parse(JSON.stringify(w)));w.requirementIds.forEach(id=>scheduled.add(id));}});
  const next:PlannedWeek[]=Array.from({length:weeks},(_,i)=>preserved.get(i)??{id:`week-${i+1}`,title:'',tags:[],capacity:studio.capacity,stageLimit:4,requirementIds:[],locked:false,activity:null,reviewed:false});
  const hypothetical=new Map(scope.map(s=>[s,new Set(requirements.filter(r=>isCompleted(records,s,r.id)).map(r=>r.id))]));
  for(const w of preserved.values())for(const s of scope)for(const id of w.requirementIds)hypothetical.get(s)!.add(id);
  const byId=(id:string)=>requirements.find(r=>r.id===id);
  const descendants=(id:string)=>{const found=new Set<string>(),todo=[id];while(todo.length){const x=todo.pop()!;for(const r of requirements)if(r.prerequisites.includes(x)&&!found.has(r.id)){found.add(r.id);todo.push(r.id);}}return found.size;};
  const descendantCounts=new Map(requirements.map(r=>[r.id,descendants(r.id)]));
  for(let wi=0;wi<weeks;wi++){
    const week=next[wi];if(week.locked)continue;
    const capacity=Math.max(1,Math.min(12,Number(week.capacity)||studio.capacity||4)),stageLimit=Math.max(1,Math.min(12,Number(week.stageLimit)||4));
    const chosen:string[]=[],activeTags=new Set<string>();
    for(let slot=0;slot<capacity;slot++){
      let best:OasRequirement|undefined,bestScore=-Infinity;
      for(const r of requirements){
        const stageCount=chosen.filter(id=>byId(id)?.stage===r.stage).length;
        if(scheduled.has(r.id)||chosen.includes(r.id)||stageCount>=stageLimit)continue;
        const prereqs=r.stage===1?[]:r.prerequisites,session=new Set([...scheduled,...chosen]);
        const missing=prereqs.filter(id=>!session.has(id)&&!scope.some(s=>hypothetical.get(s)?.has(id)));
        const count=scope.length?scope.filter(s=>!isCompleted(records,s,r.id)).length:1;
        const ready=scope.length?scope.filter(s=>!isCompleted(records,s,r.id)&&prereqs.every(id=>hypothetical.get(s)?.has(id)||chosen.includes(id))).length:1;
        const options=[locations(r).preferred,...(locations(r).alternatives??[])].filter((x):x is string=>!!x);
        const chosenLocations=chosen.map(id=>locations(byId(id)).preferred).filter((x):x is string=>!!x);
        const allowed=(studio.allowedLocations??[]) as string[];
        if(studio.useLocations&&allowed.length&&!options.some(l=>allowed.includes(l)))continue;
        const compatible=chosenLocations.length?options.some(l=>chosenLocations.includes(l)):false;
        const locationScore=studio.useLocations?(compatible?22:chosenLocations.length?-9:8):0;
        const progressScore=count*8+ready*5+descendantCounts.get(r.id)!*2;
        const factor=studio.strategy==='location'?.35:studio.strategy==='balanced'?.7:1;
        const diversity=(stageCount===0?22:0)-stageCount*15+(r.stage>1&&ready>0?12:0);
        const score=progressScore*factor+diversity+r.tags.filter(t=>activeTags.has(t)).length*9+(studio.useLocations?(studio.strategy==='progress'?locationScore*.2:studio.strategy==='location'?locationScore*3:locationScore*1.8):0)-missing.length*35-(r.stage||1)*.01;
        if(score>bestScore){best=r;bestScore=score;}
      }
      if(!best)break;chosen.push(best.id);best.tags.forEach(t=>activeTags.add(t));
    }
    week.requirementIds=orderSession(chosen,requirements);week.tags=[...new Set(chosen.flatMap(id=>byId(id)?.tags??[]))].slice(0,5);
    week.title=(week.tags as string[])[0]||`Week ${wi+1}`;week.location=chosen.map(id=>locations(byId(id)).preferred).find(Boolean)||'Flexible / anywhere';week.activity=null;week.reviewed=false;
    chosen.forEach(id=>scheduled.add(id));for(const s of scope)for(const id of chosen)hypothetical.get(s)!.add(id);
  }
  return next;
}
