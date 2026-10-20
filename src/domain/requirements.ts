import type { OasRequirement, RequirementsDataFile } from './models.js';

function asObject(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('Expected a requirements object');
  }
  return value as Record<string, unknown>;
}

/** Validate graph and source IDs without rewriting the original requirement text. */
export function validateRequirements(value: unknown): asserts value is OasRequirement[] {
  if (!Array.isArray(value) || value.length === 0) {
    throw new Error('No requirements found');
  }
  const ids = new Set<string>();
  for (const item of value) {
    if (!item || typeof item !== 'object') throw new Error('Invalid requirement record');
    const r = item as Record<string, unknown>;
    if (typeof r.id !== 'string' || !r.id || ids.has(r.id)) {
      throw new Error('Missing or duplicated requirement ID: ' + String(r.id));
    }
    ids.add(r.id);
    if (typeof r.text !== 'string' ||
      !Number.isInteger(r.stage) ||
      typeof r.stream !== 'string' ||
      !Array.isArray(r.tags) || !r.tags.every(t => typeof t === 'string') ||
      !Array.isArray(r.prerequisites) || !r.prerequisites.every(p => typeof p === 'string')) {
      throw new Error('Malformed requirement ' + r.id);
    }
    if (r.suggested_links !== undefined && (!Array.isArray(r.suggested_links) ||
      !r.suggested_links.every(link => !!link && typeof link === 'object' &&
        typeof (link as Record<string, unknown>).id === 'string'))) {
      throw new Error('Malformed suggested links for ' + r.id);
    }
  }
  const byId = new Map<string, OasRequirement>((value as OasRequirement[]).map(r => [r.id, r]));
  const visiting = new Set<string>();
  const visited = new Set<string>();
  function visit(id: string): void {
    if (visiting.has(id)) throw new Error('Circular mandatory prerequisite at ' + id);
    if (visited.has(id)) return;
    const req = byId.get(id);
    if (!req) throw new Error('Missing prerequisite ' + id);
    visiting.add(id);
    for (const parent of req.prerequisites) {
      if (!byId.has(parent)) throw new Error('Missing prerequisite ' + parent + ' used by ' + id);
      visit(parent);
    }
    visiting.delete(id);
    visited.add(id);
  }
  for (const id of byId.keys()) visit(id);
  for (const r of byId.values()) for (const link of r.suggested_links ?? []) {
    if (!byId.has(link.id)) throw new Error('Missing advisory link ' + link.id + ' used by ' + r.id);
  }
}

/** Loader for the existing public data/requirements.json format. */
export function parseRequirementsData(input: unknown): RequirementsDataFile {
  const file = asObject(input);
  validateRequirements(file.requirements);
  return file as unknown as RequirementsDataFile;
}

export function findRequirement(list: readonly OasRequirement[], id: string): OasRequirement | undefined {
  return list.find(r => r.id === id);
}

/** Matches the legacy planner's any-tag selection and stable source order. */
export function selectByAnyTag(list: readonly OasRequirement[], selected: readonly string[]): OasRequirement[] {
  if (!selected.length) return [];
  return list.filter(r => r.tags.some(tag => selected.includes(tag)));
}

export function allTags(list: readonly OasRequirement[]): string[] {
  return [...new Set(list.flatMap(r => r.tags))].sort((a,b) => a.localeCompare(b));
}
