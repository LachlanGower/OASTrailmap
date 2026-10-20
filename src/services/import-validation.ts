import type { Activity, OasRequirement } from '../domain/models.js';
import { validateRequirements } from '../domain/requirements.js';
import { validateScheduleWeeks } from '../domain/scheduling.js';
import { validateScoutRecords } from './legacy-state.js';

export type ImportKind = 'full' | 'requirements' | 'progress' | 'activities' | 'schedule' | 'trees';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    throw new Error('Expected an object');
  return value as Record<string, unknown>;
}

export function validateActivities(value: unknown, knownRequirements: readonly OasRequirement[]): asserts value is Activity[] {
  if (!Array.isArray(value)) throw new Error('Expected an activities array');
  const ids = new Set<string>();
  const known = new Set(knownRequirements.map(r => r.id));
  for (const item of value) {
    const a = asObject(item);
    if (typeof a.id !== 'string' || !a.id.trim() || ids.has(a.id))
      throw new Error('Missing or repeated activity ID');
    ids.add(a.id);
    if (!Array.isArray(a.covers) || a.covers.some(id => typeof id !== 'string' || !known.has(id)))
      throw new Error('Unknown requirement in activity ' + a.id);
    if (a.tags !== undefined && (!Array.isArray(a.tags) || a.tags.some(t => typeof t !== 'string')))
      throw new Error('Invalid activity tags');
  }
}

/**
 * Validate existing external formats before any explicit import. Returns the
 * original object unchanged; it neither normalises metadata nor writes storage.
 * Caller separately presents a preview/checkpoint and gets user confirmation.
 */
export function validateImportPayload(
  kind: ImportKind, input: unknown, currentRequirements: readonly OasRequirement[]
): Record<string, unknown> {
  const data = asObject(input);
  switch (kind) {
    case 'full': {
      if (data.format !== 'oas-trailmap-full-state' && data.format !== 'oas-trailmap-backup')
        throw new Error('Not an OAS backup');
      validateRequirements(data.requirements);
      validateScoutRecords(data.scoutRecords);
      const list = data.requirements as OasRequirement[];
      validateActivities(data.activities ?? [], list);
      if (data.studio !== undefined && data.studio !== null) {
        const studio = asObject(data.studio);
        if (Array.isArray(studio.schedule) && studio.schedule.length)
          validateScheduleWeeks(studio.schedule, list);
      }
      break;
    }
    case 'requirements':
      validateRequirements(data.requirements);
      if (data.tree_graphs !== undefined) asObject(data.tree_graphs);
      break;
    case 'progress':
      validateScoutRecords(data.scoutRecords);
      break;
    case 'activities':
      validateActivities(data.activities, currentRequirements);
      break;
    case 'schedule':
      if (data.format !== 'oas-trailmap-schedule')
        throw new Error('Expected an OAS schedule');
      validateScheduleWeeks(data.weeks, currentRequirements);
      break;
    case 'trees':
      if (!Array.isArray(data.trees) || !data.trees.every(v => typeof v === 'string'))
        throw new Error('Invalid tree registry');
      asObject(data.order);
      asObject(data.treeGraphs);
      break;
    default: {
      const exhaustive: never = kind;
      throw new Error('Unrecognised import type: ' + String(exhaustive));
    }
  }
  return data;
}
