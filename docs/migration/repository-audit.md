# Phase 1 — observed repository architecture

**Inspected:** `migration/phase-01-baseline` against migration trunk rooted at `main` commit `231341e842f90d0774334a563cf1f6e1e48ef149` (20 October 2026).
This is a **source-code inventory**, not proof that the browser currently behaves as intended.

## Frontend entry points and loading

- One HTML document, `index.html`, with **122 unique static element IDs**, seven primary workspace navigation labels and no client router.
- One global stylesheet, `css/styles.css`.
- Ten ordered `<script defer>` sources: external SheetJS `xlsx@0.18.5`, external `js-yaml@4.1.0`; eight local JS files (`app.js`, `studio.js`, `data-manager.js`, `next-phase.js`, `forecast.js`, `docs-upgrade.js`, `theme-tracker.js`, `application-requirements.js`).
- No Vue/Vite app or build tooling at the Phase 1 baseline. Static hosting uses the repository root.
- Browser requirements load from `data/requirements.json`, with `data/requirements.yaml` the editable source.

## Current feature ownership (source-level)

| Workspace / concern | Main source files | Compatibility concern |
| --- | --- | --- |
| Trailmap, Scout selectors, readiness, requirement cards, Excel workbook importer | `js/app.js` | Global `requirements`, `scoutRecords`, `activities`; DOM selectors and direct storage |
| Tree editing, master vs per-tree graphs, snapshots, scheduler base | `js/studio.js` | Mutates shared requirements; save/render calls cascade into other workspaces |
| Data & State, recovery checkpoints, structured Activity Studio | `js/data-manager.js`, `js/next-phase.js` | Imports/rollback span multiple datasets, not a single progress record |
| Multi-activity schedules, Help & Design, reset flows | `js/next-phase.js`, `js/docs-upgrade.js` | Global function replacement and help topic mutation |
| Repeat opportunities, conditional forecast, similar swaps | `js/forecast.js` | Replaces scheduler/review functions; scheduled requirements are not completion |
| Themed regeneration and coverage inventory | `js/theme-tracker.js` | Further wraps `renderSchedule`; location scoring is optional |
| Application Requirements register | `js/application-requirements.js`, `data/application-requirements.json` | 118 existing APP IDs must remain traceable |

## Major coupling risks found

1. **Global shared state** — scripts directly read and update `requirements`, `activities`, `scoutRecords`, `studio` and shared renderer functions rather than using explicit imports/interfaces.
2. **Load-order dependencies** — `studio.js` consumes `app.js` globals; `docs-upgrade.js` mutates `HELP_TOPICS` created in `next-phase.js`; later scheduling scripts assume earlier functions exist.
3. **Function wrapping** — `next-phase.js` wraps `renderSchedule`; `forecast.js` replaces `buildSchedule` and `reviewWeek`, and also wraps `renderSchedule`; `theme-tracker.js` wraps `renderSchedule` again. The composed call order is *observable behaviour*; extraction must preserve it until equivalence is tested.
4. **Rendering and persistence coupled** — e.g. `setReqData()` calls `save()`, `writeStudio()`, `renderAll()`, `renderTree()` and `renderSchedule()`.
5. **Legacy DOM API** — dynamic HTML strings and direct `querySelector` interactions depend on stable selectors. The 122 static IDs and script source order are now pinned in `docs/migration/baseline.json`; intentional component replacements will require a reviewed contract change.

## Storage and export contracts

| Browser key | Owner | Purpose |
| --- | --- | --- |
| `oas-trailmap-v1` | `js/app.js` | `scoutRecords`, activities, Scout roster, supplemental requirements, requirement overrides |
| `oas-studio-v1` | `js/studio.js` | Named trees, per-tree graphs, order, tags, schedule, strategy, repeat evidence and snapshots |
| `oas-data-checkpoints-v1` | `js/data-manager.js` | Recovery checkpoints for state changes |

Existing export/import format markers seen in code: `oas-trailmap-backup` (legacy progress backup v1), `oas-trailmap-full-state` (schema v2), `oas-trailmap-progress` (schema v1), `oas-trailmap-activities` (schema v2), `oas-trailmap-schedule`, `oas-trailmap-trees` (schema v1). Requirements exports support schema v3 with `tree_graphs`, `tree_registry` and `tag_library`.

The fictional `tests/fixtures/legacy-state.synthetic.json` describes shapes found in code, **not** a validated production export. It contains no real Scout records. True round-trip and browser migration tests are required later.

## Source data and requirements

- `data/requirements.json` has **142** records: three streams and three stages; stable IDs, editable planning metadata, prerequisites, suggested links and repeat-opportunity metadata.
- `data/application-requirements.json` has **118** APP records across 10 categories (93 implemented-in-code, 7 partial, 3 planned, 15 future at baseline). Delivery statuses are *code inspection*, not acceptance tests.
- **APP-108 — Human-readable modular rewrite** is the existing future idea corresponding to this migration; it should be tracked as in-progress implementation work in migration documentation, while product status changes are reviewed separately.
- `docs/application-requirements.md` is a reference snapshot; edit the canonical JSON when app requirements change and regenerate the snapshot consistently.

## Confirmed and unverified

**Confirmed from code:** scripts, load order, static selectors, requirement IDs/counts, APP references, global coupling, explicit data formats and browser key names.

**Not yet verified in a running browser:** feature parity, appearance, Excel style/date parsing against the original workbook, data migration safety, tab focus, responsiveness, export round trips, 60-week performance, and whether reported limitations reproduce.

**Next:** run the tests in `browser-acceptance.md` against the unchanged app, capture screenshots at known viewport sizes, save only *synthetic* automated fixtures and record a red/green result for each scenario before replacing a UI entry point.
