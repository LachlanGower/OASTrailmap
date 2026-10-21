# Phase 4G — Data & State (first read-only recovery slice)

**Stack base:** `migration/phase-04f-activity-studio`. Includes all pending Phase 4B–4F work.

Added pure `src/services/recovery-preview.ts` using the existing Data & State Manager's *ID-based* added/modified/removed comparison. A full backup is explicitly flagged as replacement, and selective imports warn that only the selected dataset changes. Imports are validated before previewing; none are applied automatically. Tests cover fictional Scout progress deltas, legacy arrays of activities, invalid record keys and full-backup caution.

**No destructive UI migration has occurred.** The existing Data & State page still handles real Excel import, YAML/JSON processing, checkpoints, backup restore, selective imports and resets. It must stay in place until entire recovery paths are proven with safe rollback, failure simulations and user-approved manual testing.

Review: `npm ci && npm test && npm run dev`. This branch is **partial groundwork**; don't mark the complete recovery workspace migrated. No private Scout records or production changes.
