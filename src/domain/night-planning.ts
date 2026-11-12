import { planningPrerequisites } from './planning-links.js';
import type { OasRequirement,ScoutRecords } from './models.js';
import { duplicateGroups } from './duplicate-statements.js';
import { locationOptions } from './planning-locations.js';
import { orderSession } from './scheduling.js';
import { ScoutProjection,projectWeek,fitsWeekLocation } from './scout-projection.js';

export const planningThemes=(r:OasRequirement):string[]=>[...new Set((r.theme_tags as string[]|undefined)??r.tags)];
export const matchesPlanningTheme=(r:OasRequirement,themes:readonly string[]):boolean=>[...planningThemes(r),...r.tags].some(t=>themes.includes(t));
export const stageTarget=(value:unknown):number=>Math.max(1,Math.min(12,Math.floor(Number(value)||4)));
export const isSpecificLocation=(value:unknown):value is string=>typeof value==='string'&&!!value&&!['Flexible / anywhere','Any location','Anywhere'].includes(value);
export interface NightOptions {
 requirements:readonly OasRequirement[];records:ScoutRecords;scouts:readonly string[];
 themes:readonly string[];target:number;eligible:(r:OasRequirement)=>boolean;
 prior?:ReadonlySet<string>;useLocations?:boolean;allowedLocations?:readonly string[];location?:string;
 strategy?:string;projection?:ScoutProjection;sessionId?:string;
 mode?:'progression'|'random';random?:()=>number;
}
interface SearchNode {
 ids:string[];stageProgress:Record<number,ScoutProjection>;names:Record<string,string[]>;
 counts:Record<number,number>;suggested:string[];suggestionThemes:Record<string,string[]>;
 flow:number;related:Set<string>;covered:Set<string>;primaryCovered:Set<string>;pairs:number;quality:number;
 potential?:number[];
}
export interface NightMetrics {prerequisiteSupport?:number;assignedScouts:number;activeStages:number;primaryScouts:number;primaryRequirements:number;usefulOpportunities:number;filledSlots:number;themeFit:number}
export interface NightPlan {
 opportunityOnlyIds:string[];requirementIds:string[];suggestedRequirementIds:string[];suggestionThemes:Record<string,string[]>;
 stageShortfalls:Record<string,number>;location:string;scoutAssignments:Record<string,string[]>;assignmentScope:string[];
 unassignedScouts:string[];unassignedReasons:Record<string,string>;stageCohortCounts:Record<string,number>;planningMetrics:NightMetrics;
}
export function compareNightPlans(a:NightPlan,b:NightPlan):number{return compare(rank(a.planningMetrics),rank(b.planningMetrics));}
const rank=(m:NightMetrics)=>[m.assignedScouts,m.prerequisiteSupport??0,m.usefulOpportunities,m.filledSlots,m.activeStages,m.primaryScouts,m.primaryRequirements,m.themeFit];
function compare(a:readonly number[],b:readonly number[]):number {for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;}
const WIDTH=10;
function venuesFor(options:NightOptions):(string|undefined)[]{
 const allowed=options.allowedLocations??[],fixed=isSpecificLocation(options.location)?options.location:undefined;
 const venues:(string|undefined)[]=fixed?[fixed]:options.useLocations?allowed.length?[...new Set(allowed)]:[...new Set(options.requirements.flatMap(locationOptions).filter(isSpecificLocation))]:[undefined];
 return venues.length?venues:[undefined];
}
/** Safe upper bound across eligible stages, without forcing fixed cohorts. */
export function couldImproveNight(options:NightOptions,best:NightPlan):boolean {
 const initial=options.projection??new ScoutProjection(options.requirements,options.records,options.scouts),target=stageTarget(options.target),session=options.sessionId??'planning-night';
 for(const venue of venuesFor(options)){
  const pool=options.requirements.filter(r=>options.eligible(r)&&fitsWeekLocation(r,{requirementIds:[],location:venue},{useLocations:options.useLocations,allowedLocations:options.allowedLocations}));
  const primary=pool.filter(r=>matchesPlanningTheme(r,options.themes)),related=[...new Set(primary.flatMap(planningThemes))],reachable=pool.filter(r=>matchesPlanningTheme(r,[...options.themes,...related]));
  let people=0,flow=0,gains=0,primaryPeople=0;
  for(const scout of options.scouts){const needed=reachable.filter(r=>initial.needsOpportunity(scout,r.id,session));if(!needed.length)continue;people++;if(primary.some(r=>initial.needsOpportunity(scout,r.id,session)))primaryPeople++;
   flow+=Math.max(...[1,2,3].map(stage=>needed.filter(r=>r.stage===stage).map(r=>initial.flowSupport(r,scout)).sort((a,b)=>b-a).slice(0,target).reduce((n,v)=>n+v,0)));
   gains+=Math.max(...[1,2,3].map(stage=>Math.min(target,needed.filter(r=>r.stage===stage).length)));
  }
  const slots=[1,2,3].reduce((n,stage)=>n+Math.min(target,reachable.filter(r=>r.stage===stage).length),0),primarySlots=[1,2,3].reduce((n,stage)=>n+Math.min(target,primary.filter(r=>r.stage===stage).length),0),active=[1,2,3].filter(stage=>reachable.some(r=>r.stage===stage)).length;
  if(compare([people,flow,gains,slots,active,primaryPeople,primarySlots,Number.MAX_SAFE_INTEGER],rank(best.planningMetrics))>0)return true;
 }
 return false;
}

/** Compare stage activities together; each Scout receives only one stage of projected credit. */
export function planNight(options:NightOptions):NightPlan {
 const {requirements,records,scouts,themes}=options,target=stageTarget(options.target),session=options.sessionId??'planning-night';
 const fullInitial=options.projection??new ScoutProjection(requirements,records,scouts);
 const groups=fullInitial.equivalentScoutGroups(session),initial=fullInitial.subset([...groups.keys()]);
 const weight=(scout:string)=>groups.get(scout)?.length??1,weighted=(names:Iterable<string>)=>[...names].reduce((n,scout)=>n+weight(scout),0);
 const cohorts=fullInitial.weeklyCohorts(session);
 const allowed=options.allowedLocations??[];
 const venues=venuesFor(options);
 const byId=new Map(requirements.map(r=>[r.id,r]));
 const duplicates=duplicateGroups(requirements);
 const alreadySelected=(ids:readonly string[],r:OasRequirement)=>ids.some(id=>duplicates.get(id)===duplicates.get(r.id));
 const cohortCounts=Object.fromEntries([1,2,3].map(stage=>[String(stage),Object.values(cohorts).filter(s=>s===stage).length]));
 let best:NightPlan|undefined;
 for(const venue of venues){
  const location=venue??'Flexible / anywhere';
  const pool=requirements.filter(r=>[1,2,3].includes(r.stage)&&options.eligible(r)&&(!scouts.length||scouts.some(s=>initial.needsOpportunity(s,r.id,session)))&&fitsWeekLocation(r,{requirementIds:[],location},{useLocations:options.useLocations,allowedLocations:allowed}));
  const readyCache=new WeakMap<SearchNode,Map<string,string[]>>();
  const people=(node:SearchNode,r:OasRequirement)=>{let cache=readyCache.get(node);if(!cache){cache=new Map();readyCache.set(node,cache);}let names=cache.get(r.id);if(!names){names=node.stageProgress[r.stage].participants(r,session);cache.set(r.id,names);}return names;};
  function candidates(node:SearchNode,fallback:boolean):OasRequirement[]{
   const match=fallback?[...node.related]:themes;
   return pool.filter(r=>node.counts[r.stage]<target&&!alreadySelected(node.ids,r)&&matchesPlanningTheme(r,match));
  }
  function quality(node:SearchNode,r:OasRequirement):number {
   const overlap=[...new Set([...planningThemes(r),...r.tags])].filter(t=>themes.includes(t)).length;
   const incomplete=scouts.length?0:planningPrerequisites(r).filter(id=>!options.prior?.has(id)&&!node.ids.includes(id)).length;
   return overlap*4-incomplete*35;
  }
  function add(node:SearchNode,r:OasRequirement,fallback:boolean):SearchNode {
   const names=scouts.length?people(node,r):[],progress=node.stageProgress[r.stage].copy();
   if(scouts.length)progress.grant(r,names,session);
   const matched=[...new Set([...planningThemes(r),...r.tags])].filter(t=>node.related.has(t));
   return {flow:node.flow+names.reduce((n,scout)=>n+initial.flowSupport(r,scout)*weight(scout),0),ids:[...node.ids,r.id],stageProgress:{...node.stageProgress,[r.stage]:progress},names:{...node.names,[r.id]:names},counts:{...node.counts,[r.stage]:node.counts[r.stage]+1},
    suggested:fallback?[...node.suggested,r.id]:node.suggested,suggestionThemes:fallback?{...node.suggestionThemes,[r.id]:matched}:node.suggestionThemes,
    related:fallback?node.related:new Set([...node.related,...planningThemes(r)]),covered:new Set([...node.covered,...names]),
    primaryCovered:fallback?node.primaryCovered:new Set([...node.primaryCovered,...names]),pairs:node.pairs+weighted(names),quality:node.quality+quality(node,r)};
  }
  function potential(node:SearchNode):number[]{
   if(node.potential)return node.potential;
   const covered=new Set(node.covered),stages=new Set(node.ids.map(id=>byId.get(id)!.stage));
   const possible=pool.filter(r=>node.counts[r.stage]<target&&!alreadySelected(node.ids,r)&&matchesPlanningTheme(r,[...themes,...node.related]));
   for(const r of possible){const ready=scouts.length?people(node,r):[];if(!scouts.length||ready.length){ready.forEach(s=>covered.add(s));stages.add(r.stage);}}
   const flow=node.flow;
   node.potential=[weighted(covered),flow,node.pairs,node.ids.length,stages.size,weighted(node.primaryCovered),node.ids.length-node.suggested.length,node.quality];
   return node.potential;
  }
  function prune(nodes:SearchNode[]):SearchNode[]{
   const unique=new Map<string,SearchNode>();
   for(const node of nodes){const key=[...node.ids].sort().join('|')+'#'+[...node.suggested].sort().join('|');const old=unique.get(key);if(!old||node.quality>old.quality)unique.set(key,node);}
   return [...unique.values()].sort((a,b)=>compare(potential(b),potential(a))).slice(0,WIDTH);
  }
  const empty:SearchNode={flow:0,ids:[],stageProgress:{1:initial.copy(),2:initial.copy(),3:initial.copy()},names:{},counts:{1:0,2:0,3:0},suggested:[],suggestionThemes:{},related:new Set(),covered:new Set(),primaryCovered:new Set(),pairs:0,quality:0};
  let beam=[empty];
  for(const fallback of [false,true]){
   for(let round=0;round<target;round++)for(const stage of [1,2,3]){
    const expanded:SearchNode[]=[];
    for(const node of beam){expanded.push(node);for(const r of candidates(node,fallback).filter(r=>r.stage===stage))expanded.push(add(node,r,fallback));}
    beam=prune(expanded);
   }
  }
  for(const node of beam){
   const ids=orderSession(node.ids,requirements);
   const assignments=projectWeek(fullInitial.copy(),requirements,{id:session,requirementIds:ids,location},0,{useLocations:options.useLocations,allowedLocations:allowed,lightweight:true});
   const primaryIds=ids.filter(id=>!node.suggested.includes(id));
   const primaryNames=new Set(primaryIds.flatMap(id=>assignments.requirementScouts[id]??[]));
   const assigned=new Set(Object.values(assignments.requirementScouts).flat());
   const activeStages=[1,2,3].filter(stage=>scouts.length?assignments.stageScouts[String(stage)].length>0:node.counts[stage]>0).length;
   const plan:NightPlan={opportunityOnlyIds:scouts.length?ids.filter(id=>!assignments.requirementScouts[id]?.length):[],requirementIds:ids,suggestedRequirementIds:node.suggested,suggestionThemes:node.suggestionThemes,
    stageShortfalls:Object.fromEntries([1,2,3].map(stage=>[String(stage),Math.max(0,target-node.counts[stage])])),location,
    scoutAssignments:assignments.requirementScouts,assignmentScope:[...scouts],unassignedScouts:assignments.unassignedScouts,unassignedReasons:assignments.unassignedReasons,stageCohortCounts:cohortCounts,
    planningMetrics:{prerequisiteSupport:ids.reduce((n,id)=>n+(assignments.requirementScouts[id]??[]).reduce((m,scout)=>m+initial.flowSupport(byId.get(id)!,scout),0),0),assignedScouts:assigned.size,activeStages,primaryScouts:primaryNames.size,primaryRequirements:primaryIds.length,usefulOpportunities:Object.values(assignments.requirementScouts).reduce((n,names)=>n+names.length,0),filledSlots:ids.length,themeFit:node.quality}};
   const comparison=best?compareNightPlans(plan,best):1;
   if(!best||comparison>0||comparison===0&&options.mode==='random'&&(options.random??Math.random)()<.5)best=plan;
  }
 }
 const details=projectWeek(fullInitial.copy(),requirements,{id:session,requirementIds:best!.requirementIds,location:best!.location},0,{useLocations:options.useLocations,allowedLocations:allowed});
 best!.unassignedScouts=details.unassignedScouts;best!.unassignedReasons=details.unassignedReasons;
 return best!;
}
