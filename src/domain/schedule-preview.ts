import type { OasRequirement, PlannedWeek } from './models.js';
import { requiredTimes } from './progress.js';
import { scheduleOccurrenceCounts } from './scheduling.js';

export interface ScheduleDifference {
  weekIndex: number;
  before: string[];
  after: string[];
  wasLocked: boolean;
}
export interface RegenerationPreview {
  changedUnlockedWeeks: number;
  changes: ScheduleDifference[];
  lockedWeeksPreserved: number;
}

/**
 * Same changed-week definition used by the original regeneration preview:
 * compare requirement IDs in the same order, not computed progress.
 */
export function previewScheduleRegeneration(
  previous: readonly PlannedWeek[], proposed: readonly PlannedWeek[]
): RegenerationPreview {
  const changes: ScheduleDifference[] = [];
  let lockedWeeksPreserved = 0;
  for (let i=0; i<previous.length; i++) {
    const before = previous[i], after = proposed[i];
    if (!after && before.locked) throw new Error('Locked week missing after regeneration: '+(i+1));
    if (before.locked) {
      if (JSON.stringify(before) !== JSON.stringify(after))
        throw new Error('Locked week changed during regeneration: '+(i+1));
      lockedWeeksPreserved++;
      continue;
    }
    const left = before.requirementIds ?? [];
    const right = after?.requirementIds ?? [];
    if (JSON.stringify(left) !== JSON.stringify(right)) {
      changes.push({weekIndex:i,before:[...left],after:[...right],wasLocked:false});
    }
  }
  for(let i=previous.length;i<proposed.length;i++){
    if (proposed[i].requirementIds?.length)
      changes.push({weekIndex:i,before:[],after:[...proposed[i].requirementIds],wasLocked:false});
  }
  return {changedUnlockedWeeks:changes.length,changes,lockedWeeksPreserved};
}

export interface CoverageOpportunity {
  requirementId: string;
  required: number;
  planned: number;
  outstanding: number;
}
/** A scheduled night is an opportunity, not proof of completion. */
export function plannedOpportunityCoverage(
  requirements: readonly OasRequirement[], weeks: readonly PlannedWeek[]
): CoverageOpportunity[] {
  const counts = scheduleOccurrenceCounts(weeks);
  return requirements.map(r=>{
    const required=requiredTimes(r),planned=counts.get(r.id)??0;
    return {requirementId:r.id,required,planned,outstanding:Math.max(0,required-planned)};
  });
}
