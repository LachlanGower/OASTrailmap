# Phase 4 UX and Data Refinement — PR #40

**Parent:** PR #39 (Theme-led planning). **Branch:** `feature/phase4-ux-data-refinement`. **No merge to `main`, no Phase 5 advancement.**

## Improvements in this slice
- Navigation: a single active workspace button; remove visible Undo Tree Edit; move full backup actions from the header into Data & State.
- Trailmap: Stage 1 hard prerequisites removed from the baseline JSON (9 records), and Stage 1 treated as unblocked in runtime even for older stored curriculum; identical requirement wording grouped for display without deleting any original requirement ID/evidence; optional completed-Scout hiding in the selected requirement detail, including Vue controls.
- Skill Tree: searchable trees/tags and prerequisite/reference links in Vue; reversible Delete Tree that reassigns requirements to another tree after a checkpoint; only needed administration buttons shown; clearer optional-connection toggle, smaller introductory text and explicit scroll area.
- Scheduler: configurable per-week max requirements per stage (default 4) enforced in generation and themed rerolls; pre-completed prerequisites considered for Week 1 advanced Scouts, and diversity scoring avoids starving stages 2 and 3. Imports, exports and legacy external-week preference controls hidden from scheduler (retained internally for rollback); conditional forecast in an accordion; weekly requirements open a consistent read-only detail dialog. Location chooser now uses Apply/Cancel selection-panel design.
- Weekly Themes: requirement links open the shared detail dialog without evidence mutations.
- Requirements Tracker: filters for theme, stage, stream and existing status. Legacy CSV export hidden in favour of Data & State. Trello JSON board exchange includes per-requirement canonical IDs; imported board notes are kept in a separate local browser-storage namespace, **not** Scout progress.
- Activity Studio: search by title, tags, description, location or covered requirement ID, plus search within editor tags and requirement checkboxes. Export delegated to Data & State.
- Data & State: four independent sections — Snapshot, Importer, Exporter, Reset. Dedicated original Scout workbook button; JSON, YAML and CSV selection for exports. CSV round-trips use an explicit OAS metadata row and an `id,record_json` schema, preserving nested fields. CSV import is supported for Requirements, Scout progress, Activities and Schedule; complete backups and tree layouts require JSON/YAML. All imports still run through original review and checkpoint validation.

## Important safety / scope notes
1. Official requirement IDs and individual evidence are not merged even when identical wording is displayed once. The original 142-ID and 118-app-requirement invariants remain release gates.
2. Tree deletion reassigns the deleted tree's requirements to an existing tree and saves a checkpoint; it is not deletion of any curriculum requirement.
3. Trello exchange is **local JSON file exchange**, not authenticated direct Trello API/Power-Up integration. Trello itself may require a separate importer/API to create a board from the downloaded JSON.
4. Stage readiness is inferred from imported/manual Scout completion evidence, not a new separate enrolment-stage profile. Confirm your mixed-ability Week 1 cases manually.
5. Stage 1 prerequisite fields in older imported documents are preserved for archival compatibility, but ignored by runtime readiness. Checkpoint/import review should be used before modifying historical requirements.
6. This is not a claim of complete visual or functional acceptance. Manual review must cover the real original nine-sheet workbook, full/partial backups, restore rollback, long schedules and mobile interaction. No real Scout data is committed.
7. Preserve the original renderer fallbacks until user approval; never auto-release from this development PR.

## Test gates
`npm ci`, `npm run typecheck`, `npm test`, `npm run build`, `npm run check:dist`, full Playwright `tests/e2e/*.cjs` against Vite dev and compiled dist, including focused data-format and workspace UX tests. Unfixed failures keep PR draft.
