import type { Activity, OasRequirement } from './models.js';

export function activityLabel(activity: Activity): string {
  return String(activity.title || activity.name || activity.id);
}

/**
 * Mirrors the Activity Studio 'Suggest requirements' checkbox preselection.
 * Suggested links never certify Scout completion or force approval.
 */
export function suggestActivityCoverage(
  requirements: readonly OasRequirement[], selectedTags: readonly string[],
  selectedLocation: string, existingCoverage: readonly string[] = []
): string[] {
  const result = new Set(existingCoverage);
  for (const r of requirements) {
    const locations = r.locations as {preferred?:string;alternatives?:string[]} | undefined;
    const options = [locations?.preferred,...(locations?.alternatives ?? [])];
    if (r.tags.some(tag=>selectedTags.includes(tag)) &&
      (!locations || options.includes(selectedLocation))) result.add(r.id);
  }
  return [...result];
}

export function activitiesForRequirement(
  activities: readonly Activity[], requirementId: string
): Activity[] {
  return activities.filter(a=>a.covers?.includes(requirementId));
}

/**
 * Pure preparation for an Activity Studio edit. Validates all selected skill IDs
 * and returns a new array without modifying stored state.
 */
export function prepareActivityChange(
  activities: readonly Activity[], changed: Activity, knownRequirements: readonly OasRequirement[]
): Activity[] {
  if (typeof changed.id !== 'string' || !changed.id.trim())
    throw new Error('Activity ID is required');
  if (!Array.isArray(changed.covers)) throw new Error('Activity coverage must be an array');
  const known = new Set(knownRequirements.map(r=>r.id));
  for (const id of changed.covers) if(!known.has(id))
    throw new Error('Activity refers to unknown requirement: '+id);
  const index = activities.findIndex(a=>a.id===changed.id);
  const next = activities.map(a=>({...a,covers:[...a.covers],tags:[...(a.tags??[])]}));
  const copy = {...changed,covers:[...new Set(changed.covers)],tags:[...(changed.tags ?? [])]};
  if(index<0)next.push(copy);
  else next[index]=copy;
  return next;
}
