import type { OasRequirement, PlannedWeek } from './models.js';

/** Reproduces legacy orderSession() including its fallback on invalid graphs. */
export function orderSession(ids: readonly string[], requirements: readonly OasRequirement[]): string[] {
  const byId = new Map(requirements.map(r => [r.id, r]));
  const remaining = new Set(ids);
  const ordered: string[] = [];
  while (remaining.size) {
    const next = [...remaining].find(id => (byId.get(id)?.prerequisites ?? [])
      .every(parent => !remaining.has(parent))) ?? [...remaining][0];
    ordered.push(next);
    remaining.delete(next);
  }
  return ordered;
}

/** Each week is at most one planned evidence opportunity for each requirement. */
export function scheduleOccurrenceCounts(weeks: readonly PlannedWeek[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const week of weeks) for (const id of new Set(week.requirementIds ?? [])) {
    counts.set(id, (counts.get(id) ?? 0) + 1);
  }
  return counts;
}

/** Intended for schedule imports; does not rewrite existing week ordering/metadata. */
export function validateScheduleWeeks(
  weeks: unknown, requirements: readonly OasRequirement[]
): asserts weeks is PlannedWeek[] {
  if (!Array.isArray(weeks) || weeks.length < 1 || weeks.length > 60) {
    throw new Error('Expected an OAS schedule with 1–60 weeks.');
  }
  const known = new Set(requirements.map(r => r.id));
  for (const w of weeks) {
    if (!w || typeof w !== 'object' || !Array.isArray(w.requirementIds) ||
      w.requirementIds.some((id: unknown) => typeof id !== 'string' || !known.has(id))) {
      throw new Error('Schedule refers to unknown requirement IDs.');
    }
  }
}
