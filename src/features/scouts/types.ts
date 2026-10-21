/** Read-only projections of legacy Scout data; never copy storage into Vue. */
export interface ScoutPickerSnapshot {
  names: string[];
  selected: string;
  subset: string[];
  missingOnlyDisabled: boolean;
}

export interface ScoutCompletionEntry {
  scout: string;
  completed: boolean;
  date: string;
}
export interface ScoutCompletionSnapshot {
  requirementId: string;
  group: boolean;
  entries: ScoutCompletionEntry[];
}
export interface ScoutBridge {
  selectScout: (selection: string) => void;
  complete: (scout: string, requirementId: string, checked: boolean) => void;
  date: (scout: string, requirementId: string, value: string) => void;
}
