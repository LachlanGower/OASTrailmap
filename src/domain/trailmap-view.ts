import type { Activity, OasRequirement, ScoutRecords } from './models.js';
import { requirementStatus, isCompleted, scopedScoutNames } from './progress.js';

/** Mirrors the legacy normalize() function's search semantics. */
export function normalizeSearch(input: unknown): string {
  return String(input ?? '').toLowerCase().normalize('NFKD').replace(/[’‘]/g, "'")
    .replace(/[^a-z0-9]+/g, ' ').trim().replace(/\s+/g, ' ');
}

export interface TrailmapFilters {
  stage: string;
  stream: string;
  status: string;
  search: string;
  tag: string;
  missingOnly: boolean;
  plannerMode: boolean;
  selectedPlannerTags: string[];
}

export function visibleTrailmapRequirements(
  requirements: readonly OasRequirement[], activities: readonly Activity[],
  records: ScoutRecords, selection: string, subset: readonly string[],
  filters: TrailmapFilters
): OasRequirement[] {
  const names = scopedScoutNames(records, selection, subset);
  const q = normalizeSearch(filters.search);
  const planned = filters.plannerMode && filters.selectedPlannerTags.length > 0
    ? requirements.filter(r => r.tags.some(t => filters.selectedPlannerTags.includes(t))) : null;
  return requirements.filter(r => {
    if (planned && !planned.some(x => x.id === r.id)) return false;
    if (filters.tag && !r.tags.includes(filters.tag)) return false;
    if (filters.stage !== 'all' && String(r.stage) !== filters.stage) return false;
    if (filters.stream !== 'all' && r.stream !== filters.stream) return false;
    if (q && !normalizeSearch(r.text + ' ' + r.stream + ' stage ' + r.stage + ' ' + r.tags.join(' ')).includes(q)) return false;
    const status = requirementStatus(r, selection, names, requirements, records);
    if (filters.status === 'complete' && status !== 'complete') return false;
    if (filters.status === 'ready' && status !== 'ready') return false;
    if (filters.status === 'outstanding' && status === 'complete') return false;
    if (filters.status === 'activities' && !activities.some(a => a.covers?.includes(r.id))) return false;
    if (filters.missingOnly && selection !== '__all__' && selection !== '__subset__' && status === 'complete') return false;
    return true;
  });
}

export interface TrailmapSummary {
  percentage: string;
  completed: string;
  activityCount: number;
  nextCount: number;
  scopeNote: string;
  totalRequirements: number;
}
/** Legacy renderSummary() computed numbers, without touching browser state. */
export function trailmapSummary(
  requirements: readonly OasRequirement[], activities: readonly Activity[],
  records: ScoutRecords, selection: string, subset: readonly string[]
): TrailmapSummary {
  const names = scopedScoutNames(records, selection, subset);
  const total = requirements.length * Math.max(names.length, 1);
  let done = 0;
  for (const scout of names) for (const r of requirements) if (isCompleted(records, scout, r.id)) done++;
  return {
    percentage: (total ? Math.round(done / total * 100) : 0) + '%',
    completed: done + ' / ' + total,
    activityCount: activities.length,
    nextCount: names.length ? Math.max(0, total - done) : requirements.length,
    scopeNote: selection === '__all__' ? 'Across all Scouts' :
      selection === '__subset__' ? names.length + ' selected Scouts' : selection,
    totalRequirements: requirements.length
  };
}
