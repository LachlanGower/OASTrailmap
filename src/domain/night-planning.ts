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
 ids:string[];progress:ScoutProjection;names:Record<string,string[]>;
 counts:Record<number,number>;suggested:string[];suggestionThemes:Record<string,string[]>;
 related:Set<string>;covered:Set<string>;primaryCovered:Set<string>;pairs:number;quality:number;
 potential?:number[];
}
export interface NightMetrics {assignedScouts:number;activeStages:number;primaryScouts:number;primaryRequirements:number;usefulOpportunities:number;filledSlots:number;themeFit:number}
export interface NightPlan {
 requirementIds:string[];suggestedRequirementIds:string[];suggestionThemes:Record<string,string[]>;
 stageShortfalls:Record<string,number>;location:string;scoutAssignments:Record<string,string[]>;assignmentScope:string[];
 unassignedScouts:string[];unassignedReasons:Record<string,string>;stageCohortCounts:Record<string,number>;planningMetrics:NightMetrics;
}
export function compareNightPlans(a:NightPlan,b:NightPlan):number{return compare(rank(a.planningMetrics),rank(b.planningMetrics));}
const rank=(m:NightMetrics)=>[m.assignedScouts,m.activeStages,m.primaryScouts,m.primaryRequirements,m.usefulOpportunities,m.filledSlots,m.themeFit];
function compare(a:readonly number[],b:readonly number[]):number {for(let i=0;i<a.length;i++)if(a[i]!==b[i])return a[i]-b[i];return 0;}
const WIDTH=10;
function venuesFor(options:NightOptions):(string|undefined)[]{
 const allowed=options.allowedLocations??[],fixed=isSpecificLocation(options.location)?options.location:undefined;
 const venues:(string|undefined)[]=fixed?[fixed]:options.useLocations?allowed.length?[...new Set(allowed)]:[...new Set(options.requirements.flatMap(locationOptions).filter(isSpecificLocation))]:[undefined];
 return venues.length?venues:[undefined];
}
/** Optimistic bounds prune weaker themes without removing a potentially better night. */
export function couldImproveNight(options:NightOptions,best:NightPlan):boolean {
 const initial=options.projection??new ScoutProjection(options.requirements,options.records,options.scouts),cohorts=initial.weeklyCohorts(options.sessionId??'planning-night');
 const target=stageTarget(options.target),allowed=options.allowedLocations??[];
 for(const venue of venuesFor(options)){
  const pool=options.requirements.filter(r=>options.eligible(r)&&fitsWeekLocation(r,{requirementIds:[],location:venue},{useLocations:options.useLocations,allowedLocations:allowed}));
  const primary=pool.filter(r=>matchesPlanningTheme(r,options.themes)),related=[...new Set(primary.flatMap(planningThemes))];
  const reachable=pool.filter(r=>matchesPlanningTheme(r,[...options.themes,...related]));
  const possible=(scout:string,list:readonly OasRequirement[])=>list.filter(r=>r.stage===cohorts[scout]&&!initial.complete(scout,r.id));
  const names=options.scouts.filter(s=>possible(s,reachable).length),primaryNames=options.scouts.filter(s=>possible(s,primary).length);
  const active=[1,2,3].filter(stage=>options.scouts.length?names.some(s=>cohorts[s]===stage):reachable.some(r=>r.stage===stage));
  const primarySlots=active.reduce((n,stage)=>n+Math.min(target,primary.filter(r=>r.stage===stage).length),0);
  const slots=active.reduce((n,stage)=>n+Math.min(target,reachable.filter(r=>r.stage===stage).length),0);
  const pairs=names.reduce((n,s)=>n+Math.min(target,possible(s,reachable).length),0);
  if(compare([names.length,active.length,primaryNames.length,primarySlots,pairs,slots,Number.MAX_SAFE_INTEGER],rank(best.planningMetrics))>0)return true;
 }
 return false;
}
export function completeNight(plan:NightPlan,options:NightOptions):boolean {
 const projection=options.projection??new ScoutProjection(options.requirements,options.records,options.scouts),cohorts=projection.weeklyCohorts(options.sessionId??'planning-night');
 const stages=options.scouts.length?new Set(Object.values(cohorts)):new Set(options.requirements.filter(options.eligible).map(r=>r.stage));
 const people=Object.keys(cohorts).length,slots=stages.size*stageTarget(options.target),m=plan.planningMetrics;
 return m.assignedScouts===people&&m.primaryScouts===people&&m.primaryRequirements===slots&&m.usefulOpportunities===people*stageTarget(options.target)&&m.filledSlots===slots;
}

/** Bounded whole-night search. Cohorts are fixed from progress before theme/venue selection. */
export function planNight(options:NightOptions):NightPlan {
 const {requirements,records,scouts,themes}=options,target=stageTarget(options.target),session=options.sessionId??'planning-night';
 const initial=options.projection??new ScoutProjection(requirements,records,scouts);
 const cohorts=initial.weeklyCohorts(session);
 const allowed=options.allowedLocations??[],fixed=isSpecificLocation(options.location)?options.location:undefined;
 const venues=venuesFor(options);
 const byId=new Map(requirements.map(r=>[r.id,r]));
 const duplicates=duplicateGroups(requirements);
 const alreadySelected=(ids:readonly string[],r:OasRequirement)=>ids.some(id=>duplicates.get(id)===duplicates.get(r.id));
 const cohortCounts=Object.fromEntries([1,2,3].map(stage=>[String(stage),Object.values(cohorts).filter(s=>s===stage).length]));
 let best:NightPlan|undefined;
 for(const venue of venues){
  const location=venue??'Flexible / anywhere';
  const pool=requirements.filter(r=>[1,2,3].includes(r.stage)&&options.eligible(r)&&fitsWeekLocation(r,{requirementIds:[],location},{useLocations:options.useLocations,allowedLocations:allowed}));
  const people=(node:SearchNode,r:OasRequirement)=>node.progress.participants(r,session).filter(s=>cohorts[s]===r.stage);
  function candidates(node:SearchNode,fallback:boolean):OasRequirement[]{
   const match=fallback?[...node.related]:themes;
   return pool.filter(r=>node.counts[r.stage]<target&&!alreadySelected(node.ids,r)&&matchesPlanningTheme(r,match)&&(!scouts.length||people(node,r).length>0));
  }
  function quality(node:SearchNode,r:OasRequirement):number {
   const overlap=[...new Set([...planningThemes(r),...r.tags])].filter(t=>themes.includes(t)).length;
   const incomplete=scouts.length?0:(r.stage===1?[]:r.prerequisites).filter(id=>!options.prior?.has(id)&&!node.ids.includes(id)).length;
   return overlap*4-incomplete*35;
  }
  function add(node:SearchNode,r:OasRequirement,fallback:boolean):SearchNode {
   const names=scouts.length?people(node,r):[],progress=node.progress.copy();
   if(scouts.length)progress.grant(r,names,session);
   const matched=[...new Set([...planningThemes(r),...r.tags])].filter(t=>node.related.has(t));
   return {ids:[...node.ids,r.id],progress,names:{...node.names,[r.id]:names},counts:{...node.counts,[r.stage]:node.counts[r.stage]+1},
    suggested:fallback?[...node.suggested,r.id]:node.suggested,suggestionThemes:fallback?{...node.suggestionThemes,[r.id]:matched}:node.suggestionThemes,
    related:fallback?node.related:new Set([...node.related,...planningThemes(r)]),covered:new Set([...node.covered,...names]),
    primaryCovered:fallback?node.primaryCovered:new Set([...node.primaryCovered,...names]),pairs:node.pairs+names.length,quality:node.quality+quality(node,r)};
  }
  function potential(node:SearchNode):number[]{
   if(node.potential)return node.potential;
   const covered=new Set(node.covered),stages=new Set(node.ids.map(id=>byId.get(id)!.stage));
   const possible=pool.filter(r=>node.counts[r.stage]<target&&!alreadySelected(node.ids,r)&&matchesPlanningTheme(r,[...themes,...node.related]));
   for(const r of possible){const ready=scouts.length?people(node,r):[];if(!scouts.length||ready.length){ready.forEach(s=>covered.add(s));stages.add(r.stage);}}
   node.potential=[covered.size,stages.size,node.covered.size,node.primaryCovered.size,node.ids.length-node.suggested.length,node.pairs,node.ids.length,node.quality];
   return node.potential;
  }
  function prune(nodes:SearchNode[]):SearchNode[]{
   const unique=new Map<string,SearchNode>();
   for(const node of nodes){const key=[...node.ids].sort().join('|')+'#'+[...node.suggested].sort().join('|');const old=unique.get(key);if(!old||node.quality>old.quality)unique.set(key,node);}
   return [...unique.values()].sort((a,b)=>compare(potential(b),potential(a))).slice(0,WIDTH);
  }
  const empty:SearchNode={ids:[],progress:initial.copy(),names:{},counts:{1:0,2:0,3:0},suggested:[],suggestionThemes:{},related:new Set(),covered:new Set(),primaryCovered:new Set(),pairs:0,quality:0};
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
   const assignments=projectWeek(initial.copy(),requirements,{id:session,requirementIds:ids,location},0,{useLocations:options.useLocations,allowedLocations:allowed});
   const primaryIds=ids.filter(id=>!node.suggested.includes(id));
   const primaryNames=new Set(primaryIds.flatMap(id=>assignments.requirementScouts[id]??[]));
   const assigned=new Set(Object.values(assignments.requirementScouts).flat());
   const activeStages=[1,2,3].filter(stage=>scouts.length?assignments.stageScouts[String(stage)].length>0:node.counts[stage]>0).length;
   const plan:NightPlan={requirementIds:ids,suggestedRequirementIds:node.suggested,suggestionThemes:node.suggestionThemes,
    stageShortfalls:Object.fromEntries([1,2,3].map(stage=>[String(stage),Math.max(0,target-node.counts[stage])])),location,
    scoutAssignments:assignments.requirementScouts,assignmentScope:[...scouts],unassignedScouts:assignments.unassignedScouts,unassignedReasons:assignments.unassignedReasons,stageCohortCounts:cohortCounts,
    planningMetrics:{assignedScouts:assigned.size,activeStages,primaryScouts:primaryNames.size,primaryRequirements:primaryIds.length,usefulOpportunities:Object.values(assignments.requirementScouts).reduce((n,names)=>n+names.length,0),filledSlots:ids.length,themeFit:node.quality}};
   const comparison=best?compareNightPlans(plan,best):1;
   if(!best||comparison>0||comparison===0&&options.mode==='random'&&(options.random??Math.random)()<.5)best=plan;
  }
  if(best&&completeNight(best,options))break;
 }
 return best!;
}
