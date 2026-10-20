import type {
  Activity, LegacyCheckpoints, LegacyProgressState, LegacyStudioState,
  OasRequirement, ScoutRecords
} from '../domain/models.js';

/** Hardcoded existing browser keys, not a proposed v2 migration. */
export const LEGACY_KEYS = {
  progress: 'oas-trailmap-v1',
  studio: 'oas-studio-v1',
  checkpoints: 'oas-data-checkpoints-v1'
} as const;

export interface StoragePort {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export type LegacyStateSnapshot = {
  progress: LegacyProgressState | null;
  studio: LegacyStudioState | null;
  checkpoints: LegacyCheckpoints | null;
};

function objectOrThrow(input: unknown, context: string): Record<string, unknown> {
  if (input === null || typeof input !== 'object' || Array.isArray(input)) {
    throw new Error('Invalid ' + context + ': expected object');
  }
  return input as Record<string, unknown>;
}

/** Minimal validation that accepts legacy optional/extra fields without rewriting them. */
export function validateScoutRecords(input: unknown): asserts input is ScoutRecords {
  const entries = objectOrThrow(input, 'Scout records');
  for (const [key,value] of Object.entries(entries)) {
    if (!key.includes('::') || value === null || typeof value !== 'object' ||
      Array.isArray(value) || typeof (value as Record<string, unknown>).completed !== 'boolean') {
      throw new Error('Invalid progress record: ' + key);
    }
  }
}

export function parseProgress(input: unknown): LegacyProgressState {
  const data = objectOrThrow(input, 'legacy progress');
  // Old app tolerates empty objects. The adapter presents an empty collection
  // but does not persist this default until explicitly requested by caller.
  if (data.scoutRecords !== undefined) validateScoutRecords(data.scoutRecords);
  if (data.activities !== undefined && !Array.isArray(data.activities))
    throw new Error('Invalid progress activities');
  if (data.requirementsOverride !== undefined && !Array.isArray(data.requirementsOverride))
    throw new Error('Invalid requirements override');
  if (data.supplementalRequirements !== undefined && !Array.isArray(data.supplementalRequirements))
    throw new Error('Invalid supplemental requirements');
  return { ...data, scoutRecords: (data.scoutRecords ?? {}) as ScoutRecords } as LegacyProgressState;
}

export function parseStudio(input: unknown): LegacyStudioState {
  const data = objectOrThrow(input, 'studio state');
  if (data.schedule !== undefined && !Array.isArray(data.schedule))
    throw new Error('Invalid studio schedule');
  if (data.trees !== undefined && !Array.isArray(data.trees))
    throw new Error('Invalid studio trees');
  if (data.treeGraphs !== undefined) objectOrThrow(data.treeGraphs, 'studio treeGraphs');
  return data as LegacyStudioState;
}

export function parseCheckpoints(input: unknown): LegacyCheckpoints {
  if (!Array.isArray(input)) throw new Error('Invalid recovery checkpoints');
  return input as LegacyCheckpoints;
}

/**
 * Explicit, read-only port. Unlike legacy load() (which catches parse errors
 * and zeros records), bad JSON is reported with its original storage key.
 * No storage write, schema upgrade or destructive recovery happens on read.
 */
export function readLegacySnapshot(storage: Pick<StoragePort, 'getItem'>): LegacyStateSnapshot {
  function read<T>(key: string, parse: (value: unknown) => T): T | null {
    let text: string | null;
    try { text = storage.getItem(key); }
    catch (error) { throw new Error('Could not read ' + key, { cause: error }); }
    if (text === null) return null;
    try { return parse(JSON.parse(text) as unknown); }
    catch (error) { throw new Error('Cannot parse ' + key + '; browser records were not changed', { cause: error }); }
  }
  return {
    progress: read(LEGACY_KEYS.progress, parseProgress),
    studio: read(LEGACY_KEYS.studio, parseStudio),
    checkpoints: read(LEGACY_KEYS.checkpoints, parseCheckpoints)
  };
}

/** A new app can format the exact current app.js payload without writing it. */
export function makeLegacyProgressPayload(args: {
  scoutRecords: ScoutRecords;
  activities: Activity[];
  requirements: OasRequirement[];
  previous?: LegacyProgressState | null;
}): LegacyProgressState {
  validateScoutRecords(args.scoutRecords);
  const names = [...new Set(Object.keys(args.scoutRecords)
    .map(key => key.split('::')[0]).filter(name => name && name !== '__all__'))]
    .sort((a,b) => a.localeCompare(b));
  return {
    ...args.previous, // preserve unrelated historical or user-defined metadata
    version: 1,
    scoutRecords: args.scoutRecords,
    activities: args.activities,
    scouts: names,
    supplementalRequirements: args.requirements.filter(r => r.supplemental),
    requirementsOverride: args.requirements
  };
}

/**
 * Only an explicit action may call this. One key per operation and no automatic
 * version bump; the caller is responsible for making a user backup first.
 */
export function writeLegacyProgress(storage: StoragePort, payload: LegacyProgressState): void {
  parseProgress(payload);
  try { storage.setItem(LEGACY_KEYS.progress, JSON.stringify(payload)); }
  catch (error) { throw new Error('Could not save ' + LEGACY_KEYS.progress, { cause: error }); }
}
