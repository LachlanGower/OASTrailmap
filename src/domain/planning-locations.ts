import type { OasRequirement } from './models.js';
export interface PlanningLocations {preferred?:string;alternatives?:string[]}
export const HOMEWORK_LOCATION='Homework';
/** Inferred planning option only; curriculum wording and stored locations stay untouched. */
export function planningLocations(requirement?:OasRequirement):PlanningLocations {
  const existing=(requirement?.locations??{}) as PlanningLocations;
  if(!requirement)return existing;
  const words=[requirement.text,requirement.description,...requirement.tags].filter(Boolean).join(' ');
  const logbook=/\blog[\s-]*books?\b|\b(?:keep|maintain|complete|update)\b.{0,40}\b(?:logs?|journals?)\b/i.test(words);
  if(!logbook)return existing;
  return {preferred:existing.preferred||HOMEWORK_LOCATION,alternatives:[...new Set([...(existing.alternatives??[]),HOMEWORK_LOCATION])]};
}
export function locationOptions(requirement?:OasRequirement):string[]{
  const locations=planningLocations(requirement);
  return [...new Set([locations.preferred,...(locations.alternatives??[])].filter((x):x is string=>!!x))];
}
export function plannedLocation(requirements:readonly OasRequirement[],useLocations:unknown,allowed:readonly string[]=[]):string {
  if(useLocations&&allowed.length){const location=requirements.flatMap(r=>locationOptions(r)).find(l=>allowed.includes(l));if(location)return location;}
  return requirements.map(r=>planningLocations(r).preferred).find(Boolean)||'Flexible / anywhere';
}
