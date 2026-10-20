import type {
  Activity, LegacyStudioState, OasRequirement, PlannedWeek, ScoutRecords
} from '../domain/models.js';

export type DataExportKind = 'full' | 'requirements' | 'progress' | 'activities' | 'schedule' | 'trees';

export interface ExportState {
  requirements: OasRequirement[];
  scoutRecords: ScoutRecords;
  activities: Activity[];
  studio: LegacyStudioState;
  /** Legacy scheduleExport() uses selected Scout scope except in curriculum mode. */
  scope: string[];
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T; // Matches data-manager.js dataClone().
}

/**
 * Existing Data & State export schemas and field names, with an injected clock
 * for reproducible tests. Never reads localStorage or auto-exports Scout data.
 */
export function buildLegacyExport(kind: DataExportKind, state: ExportState, exportedAt: string):
  Record<string, unknown> {
  const { requirements, scoutRecords, activities, studio, scope } = state;
  switch (kind) {
    case 'full':
      return {
        format: 'oas-trailmap-full-state',
        schema_version: 2,
        exportedAt,
        requirements: clone(requirements),
        scoutRecords: clone(scoutRecords),
        activities: clone(activities),
        studio: clone({...studio, history: (studio.history ?? []).slice(0, 10)})
      };
    case 'requirements':
      return {
        schema_version: 3,
        requirements: clone(requirements),
        tree_graphs: clone(studio.treeGraphs ?? {}),
        tree_registry: [...(studio.trees ?? [])],
        tag_library: [...(studio.tags ?? [])]
      };
    case 'progress':
      return {format:'oas-trailmap-progress',schema_version:1,scoutRecords:clone(scoutRecords)};
    case 'activities':
      return {format:'oas-trailmap-activities',schema_version:2,activities:clone(activities)};
    case 'schedule':
      return {
        format:'oas-trailmap-schedule',schema_version:1,exportedAt,
        strategy:studio.strategy ?? 'progress',
        capacity:studio.capacity ?? 4,
        weeks: studio.schedule ?? [] as PlannedWeek[],
        scope:studio.strategy === 'curriculum' ? 'curriculum' : [...scope]
      };
    case 'trees':
      return {
        format:'oas-trailmap-trees',schema_version:1,
        trees:[...(studio.trees ?? [])],
        order:clone(studio.order ?? {}),
        treeGraphs:clone(studio.treeGraphs ?? {})
      };
    default: {
      const unreachable: never = kind;
      throw new Error('Unexpected export kind: ' + String(unreachable));
    }
  }
}
