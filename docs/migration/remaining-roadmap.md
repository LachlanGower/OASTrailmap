# OAS Trailmap — Remaining Vue Migration and Release Plan

**Updated:** 21 October 2026. This is the engineering execution plan, not a revision of the approved OAS requirements. Subphase numbering describes review slices, not work claimed complete.

## Integration and approval rules

- `main` / deployed production stay frozen until the user explicitly authorises Phase 6 release.
- `migration/trunk` receives only reviewed, passing feature PRs.
- Each UI conversion keeps the existing appearance/IDs; progress, schedule and recovery writes must preserve original localStorage formats and all unknown historical data.
- Synthetic/fictional Scout data in repository tests; any real Cub Pack workbook verification is local/private.
- Do not remove legacy fallback code until the full corresponding workflow passes parity and a safe rollback is documented.
- A merged **foundation slice** is not a completed UI workspace.

## Work completed into migration/trunk

| Phase | Scope | Status |
| --- | --- | --- |
| 0–1 | Migration charter, 142 IDs, legacy baseline and browser contracts | Completed |
| 2 | Vue/Vite/TypeScript foundation | Completed |
| 3 | Shared domain, import validation, storage service contracts and tests | Completed |
| 4A | Vue Application Requirements register (118 APP IDs) | Merged |
| 4B | Vue navigation shell | Merged |
| 4C.1 | Pure Trailmap filters/progress summary contract | Merged |
| 4C.2 | Vue requirement map | Merged |
| 4C.3 | Vue Scout selection, subset options, completion and date controls | Merged |
| 4C.4 | Vue original Excel workbook preview + typed parser; legacy apply/store | Merged |
| 4D.1 | Tree master/custom prerequisite helpers and cycle tests | Merged (foundation) |
| 4E.1 | Scheduler locked-week and repeat planning preview helpers | Merged (foundation) |
| 4F.1 | Activity coverage and immutable update helper contracts | Merged (foundation) |
| 4G.1 | Non-mutating data-import and recovery previews | Merged (foundation) |
| 4H.1 | Vue Help & Design topic/search island | Merged |

## Phase 4 remaining planned delivery

| Order | Proposed PR slice | Acceptance evidence |
| --- | --- | --- |
| **Next/current** | **4D.2 — Vue Skill Tree canvas**: lanes, node interactions, arrows, focus, drag and quick links; original graph logic remains | Tree/tag views, original-renderer desktop/mobile comparison, quick-link and reorder parity |
| 2 | **4D.3 — Vue Skill Tree editor**: requirement text/description, tags, tree assignments, locations, repeat opportunities, mandatory and suggested edges, cycle prevention, master vs per-tree graph modes | Editable form/save/undo parity; no source-ID drift, no cycles, custom edits isolated |
| 3 | **4D.4 — Skill Tree administration and recovery**: named trees, tag library, snapshots/history, rollback, YAML import/export and edge-case handling | Restore exact graph/schedule references, versioned export parity, corrupted import safety |
| 4 | **4E.2 — Vue scheduler screen and week controls**: timeline, strategy/capacity/1–60-week inputs, weeks and editable activity attachments | Plan visibility/parity, locked-week protection, no Scout completion writes |
| 5 | **4E.3 — Scheduling/regeneration interactions**: themed and randomized/progression variations, optional locations, external suggestions, swap-similar, leader locks | Golden-master comparisons of valid prerequisite ordering, locked weeks, week edits and themes |
| 6 | **4E.4 — Tracker, repeated evidence and forecasts**: 142-skill coverage table, distinct opportunities, leader review, conditional projections | 142 IDs, required-occurrences provenance; forecasts hypothetical, not achievements |
| 7 | **4F.2 — Vue Activity Studio editor**: reusable activity records, venue, duration, tags, equipment, safety, preparation, instructions and review | Create/edit/cancel/import/export parity without private data |
| 8 | **4F.3 — Coverage and session activities**: leader-confirmed requirement coverage, multiple activities per week, add/remove/reorder and feasibility | Confirmations never award Scout completion; map/scheduler consistency |
| 9 | **4G.2 — Vue Data & State dashboard/import review**: selective file imports/exports, previews, item counts, requirements/trees/schedule validation | Reference validation and untouched Scout data for unrelated imports |
| 10 | **4G.3 — Backup/recovery and reset UI**: full/selective restores, checkpoints, rollback, clear achievements, full reset, failure paths | Exact recovery snapshots; strong confirmations; no hidden data destruction |
| 11 | **4H.2 — Consolidation and legacy cleanup**: shared controls, accessible help, drop truly replaced scripts, optimize bundle | Complete browser suite passes, no duplicate handlers, offline/static-path startup, visual review |

**Constraints:** These are review-sized increments. They may be split further if the actual feature or regression surface warrants it. The original Help Vue island exists already; 4H.2 is cleanup and overall integration, not reimplementing Help. The Phase 4D–4G foundations merged in the earlier stack do not mean their full workspaces are complete.

## Phase 5 — Acceptance and regression

- Test the complete app against the original HTML/JS version, at desktop/mobile and relevant browsers.
- Verify exact 142 Scout/OAS requirement IDs **separately** from 118 app requirement IDs and app register semantics.
- Test real Excel workbook locally: nine Stage × Stream sheets, progress dates, highlighted cells, missed/unmatched rows, reimport, provenance and manual achievement preservation. Never publish actual Scout names or workbook.
- Assert full and selective state backups, rollback, history and migrations with realistic but fictional old-state fixtures and storage failures.
- Verify prerequisites, custom/master graph isolation, cycle prevention, scheduler lock/theme/repeat counts, optional locations, conditional forecasts and leader-controlled coverage.
- Check accessibility (keyboard, focus, screen-reader labeling), responsive fidelity, 1–60-week performance, offline/static/GitHub Pages subpath behaviour, and error recovery.
- Record every unresolved difference; no critical regression or destructive-data issue can be accepted silently. Produce a clear release candidate acceptance report.

## Phase 6 — Production release (never automatic)

After full Phase 5 sign-off, prepare a release PR against **`main`**; review the build/deployment URL, backup procedure and rollback route. Merge or deploy only after explicit production-release authorisation. The original `main` is otherwise untouched.

## Long-term product ideas — not part of this migration

Stage-oriented thematic redesign, reusable session templates, richer calendars, cross-group sharing, analytics, advanced offline/accessibility/localisation and external integrations remain brainstorms until separately approved; do not add them as migration scope creep.
