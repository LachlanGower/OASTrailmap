import type { OasRequirement, ScoutRecord, ScoutRecords } from './models.js';

/** Keep the original Scout::requirementId key exactly as it appears in localStorage. */
export function progressKey(scout: string, requirementId: string): string {
  return scout + '::' + requirementId;
}

export function scoutNames(records: ScoutRecords): string[] {
  return [...new Set(Object.keys(records)
    .map(k => k.split('::')[0]).filter(name => name && name !== '__all__'))]
    .sort((a,b) => a.localeCompare(b));
}

export function recordFor(records: ScoutRecords, scout: string, id: string): ScoutRecord {
  return records[progressKey(scout, id)] ?? { completed: false, date: '', source: 'manual' };
}

export function isCompleted(records: ScoutRecords, scout: string, id: string): boolean {
  return recordFor(records, scout, id).completed === true;
}

export function scopedScoutNames(records: ScoutRecords, selection: string, subset: readonly string[] = []): string[] {
  const all = scoutNames(records);
  if (selection === '__all__') return all;
  if (selection === '__subset__') return subset.filter(name => all.includes(name));
  return all.includes(selection) ? [selection] : [];
}

export function blockedPrerequisites(
  requirement: OasRequirement, scout: string,
  requirements: readonly OasRequirement[], records: ScoutRecords
): string[] {
  return requirement.prerequisites.filter(id =>
    !requirements.some(r => r.id === id) || !isCompleted(records, scout, id)
  );
}

export function readyScoutCount(
  requirement: OasRequirement, names: readonly string[],
  requirements: readonly OasRequirement[], records: ScoutRecords
): number {
  return names.filter(scout => !isCompleted(records, scout, requirement.id) &&
    blockedPrerequisites(requirement, scout, requirements, records).length === 0).length;
}

export type RequirementStatus = 'complete' | 'ready' | 'blocked';

/**
 * Mirrors the *existing* getStatus semantics, including 'ready' when the
 * selected group is empty. It is not a new readiness policy.
 */
export function requirementStatus(
  requirement: OasRequirement, selection: string, names: readonly string[],
  requirements: readonly OasRequirement[], records: ScoutRecords
): RequirementStatus {
  const isGroup = selection === '__all__' || selection === '__subset__';
  if (!isGroup) {
    if (isCompleted(records, selection, requirement.id)) return 'complete';
    return blockedPrerequisites(requirement, selection, requirements, records).length ? 'blocked' : 'ready';
  }
  if (!names.length) return 'ready';
  if (names.every(name => isCompleted(records, name, requirement.id))) return 'complete';
  if (names.some(name => !isCompleted(records, name, requirement.id) &&
    blockedPrerequisites(requirement, name, requirements, records).length === 0)) return 'ready';
  return 'blocked';
}

/** Mirrors requiredTimes() and occurrenceState() from forecast.js. */
export function requiredTimes(requirement: OasRequirement): number {
  const n = Number(requirement.required_occurrences);
  return Number.isInteger(n) && n > 0 && n <= 40 ? n : 1;
}

export function occurrenceState(record: ScoutRecord, requirement: OasRequirement): number {
  const target = requiredTimes(requirement);
  // Any legacy completion remains authoritative even when repeat count > 1.
  if (record.completed) return target;
  const evidence = Array.isArray(record.sessionEvidence) ? new Set(record.sessionEvidence).size : 0;
  return Math.min(target, Math.max(evidence, Number(record.occurrences) || 0));
}
