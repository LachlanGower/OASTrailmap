/**
 * OAS Trailmap legacy wire shapes. These types are intentionally permissive about
 * historical and user-defined metadata; they are not new storage schemas.
 * None of these modules accesses the DOM or browser storage implicitly.
 */
export type Stream = 'Camping' | 'Bushwalking' | 'Bushcraft';

export interface OasRequirement {
  id: string;
  text: string;
  stage: number;
  stream: Stream | string;
  tags: string[];
  prerequisites: string[];
  suggested_links?: Array<{ id: string; reason?: string }>;
  required_occurrences?: number;
  occurrence_unit?: string;
  occurrence_basis?: string;
  occurrence_note?: string;
  supplemental?: boolean;
  [field: string]: unknown;
}

export interface ScoutRecord {
  completed: boolean;
  date?: string;
  source?: string;
  sourceSheet?: string;
  sourceRow?: number;
  workflow?: string;
  highlighted?: boolean;
  sessionEvidence?: string[];
  occurrences?: number;
  [field: string]: unknown;
}

export type ScoutRecords = Record<string, ScoutRecord>;

export interface PlannedWeek {
  id?: string;
  requirementIds: string[];
  locked?: boolean;
  capacity?: number;
  activityIds?: string[];
  [field: string]: unknown;
}

export interface Activity {
  id: string;
  covers: string[];
  tags?: string[];
  [field: string]: unknown;
}

/** Payload used by app.js; keep extra historic fields when reserializing. */
export interface LegacyProgressState {
  version?: number;
  scoutRecords: ScoutRecords;
  activities?: Activity[];
  scouts?: string[];
  supplementalRequirements?: OasRequirement[];
  requirementsOverride?: OasRequirement[];
  [field: string]: unknown;
}

/** Payload used by studio.js. No defaulting over unknown editor metadata. */
export interface LegacyStudioState {
  trees?: string[];
  order?: Record<string, string[]>;
  tags?: string[];
  schedule?: PlannedWeek[];
  history?: unknown[];
  treeGraphs?: Record<string, unknown>;
  strategy?: string;
  weeks?: number;
  capacity?: number;
  externalWeeks?: number[];
  [field: string]: unknown;
}

export type LegacyCheckpoints = unknown[];

export interface RequirementsDataFile {
  schema_version?: number;
  requirements: OasRequirement[];
  [field: string]: unknown;
}
