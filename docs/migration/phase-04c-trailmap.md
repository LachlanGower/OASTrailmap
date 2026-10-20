# Phase 4C — Trailmap / Scout progress (first contract slice)

**Stack base:** `migration/phase-04b-vue-navigation`. This branch contains all pending Phase 4B work.

## Implemented in this slice

- New pure TypeScript `src/domain/trailmap-view.ts`, mirroring the existing `renderSummary()` counters and `visibleRequirements()` predicates (stage, stream, status, search, tag, planner, linked activities and missing-only mode).
- `tests/unit/trailmap-view.test.cjs` exercises the full 142-item public requirement set with only fictional Scout progress. The functions never read or write storage and cannot award progress by rendering a view.
- The active Trailmap map and Scout completion interaction are **still the original JavaScript**. No workbook parser or Scout data import behaviour has changed.

## Required work before approving the entire 4C workspace

The Vue map rendering, Scout multi-selection/editor controls, manual completion workflow, existing workbook import preview/apply/reimport, highlighted cells, dates and provenance still need to be migrated and tested against the original. Do not mark the whole Trailmap UI as Vue-migrated or merge this slice as final feature acceptance.

## Morning review

```bash
npm ci
npm test
npm run dev
```

Compare Trailmap filtering with a fictional Scout in a separate browser profile. The visible app should look unchanged; this is **domain parity groundwork** within an explicit draft stacked PR.

No production `main` changes.
