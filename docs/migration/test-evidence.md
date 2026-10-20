# Phase 1 evidence ledger

This ledger records **what actually ran** on the existing static application, not a claim of full functional equivalence.

## Automated checks (20 October 2026)

- **Static contracts:** GitHub Actions [Migration baseline guardrails](https://github.com/LachlanGower/OASTrailmap/actions/runs/39412130549) — **passed** on commit `acd143b14038df503d1e50021cf8c003baeb5b78`. Includes 142 OAS requirement identities, 118 application requirement identities, 122 static DOM IDs, ten script sources, existing storage keys, reference paths, prerequisite graph integrity and JS syntax.
- **Browser smoke:** GitHub Actions [Legacy browser baseline](https://github.com/LachlanGower/OASTrailmap/actions/runs/39412086747) — **passed** on the same commit. Headless Chromium opened all seven existing workspace panels on desktop (1440×900) and mobile (390×844) with no uncaught page errors reported.
- **Synthetic completion state:** Same browser run loaded one fictional Scout with a completed OAS requirement from browser storage, changed it to incomplete, reloaded and confirmed the state persisted.
- **Screenshots:** Same browser run uploaded the `legacy-ui-baseline` Actions artifact with desktop/mobile images for all seven workspaces. These are **reference images**, not a completed before/after visual comparison.

The tests explicitly stub out the remote SheetJS and js-yaml CDN scripts when running the broad navigation smoke. Therefore they **do not** verify workbook imports or YAML parsing.

## Outstanding / not certified

- Original private Excel workbook parse, highlighted cells, dates, import preview, reimport/merge semantics.
- Full backup, selective JSON/YAML export/import and rollback round trips.
- Mapping edit operations, prerequisite cycle rejection, snapshot restoration.
- All planner/scheduler strategies, 1–60 week limits, repeat sessions, confirmation and forecasting calculations.
- Detailed mobile/keyboard accessibility, full visual comparison, browser storage quota and error recovery.
- Safety of *actual* stored production user state migrating to a future Vue build.

No real Scout data or workbook exports were used or committed. The fixture is explicitly synthetic.

## Reviewer gate

Phase 1 can merge into `migration/trunk` when the preservation contracts and smoke evidence are reviewed as an appropriate reference. **This does not approve a Phase 4/6 production release.** Further comprehensive and real-workbook checks remain mandatory before converting each affected feature and before the final merge into `main`.
