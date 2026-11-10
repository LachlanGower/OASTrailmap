# Standalone Vue draft, stacked on PR #40

The root page runs a Vue application. It does not run `js/app.js`, `js/studio.js`, the legacy UI, island mount modules, hidden button proxies, or a legacy DOM scaffold. The original PR #40 entry is preserved separately as `legacy.html`. `vue-preview.html` is now an alias entry into the same Vue application.

This is an architectural replacement with working core workflows, **not full feature parity**. It must remain draft. Phase 5 remains on hold. Main, gh-pages and all Actions workflows are untouched.

## Local development

Requires Node >=22.12 and npm:

```sh
npm ci
npm run dev
```

Open http://localhost:5173/ for Vue; http://localhost:5173/legacy.html for comparison. Changes to Vue files and styles hot reload at the root. Stop the dev server before running `npm ci` on Windows, because the running server holds the esbuild executable open.

```sh
npm run typecheck
npm test
npm run build
npm run check:dist
npx playwright install chromium
npm run test:vue
```

`test:vue` requires a running dev server. Set `OAS_TEST_URL` to test a different server (including `npm run preview`); the default is http://127.0.0.1:5173/. Set `OAS_TEST_HMR=1` for the additional dev-only stylesheet hot reload check. It temporarily adds a CSS custom property and restores the file in `finally`. Browser tests use isolated contexts and fictional Scouts; they never access the user's browser profile. Screenshots go to ignored `test-results/`.

## Ownership

- `src/App.vue`: application shell, hash navigation, workspace lifecycle and shared Scout scope. Direct hash URLs and browser back/forward work.
- `src/state.ts`: shared reactive application data, explicit change actions and cross-tab write protection. Components do not write to storage directly.
- `src/services/application-state.ts`: unchanged storage keys and payload fields, validated imports, workbook evidence merge, checkpointed persistence and rollback after partial write failures.
- `src/services/data-files.ts`: local JSON/YAML/OAS CSV readers and writers. SheetJS is dynamically bundled for workbook decoding, with the PR #40 pure workbook interpreter retained.
- `src/domain/schedule-engine.ts`: typed PR #40 heuristic port. Differential tests execute the original pure algorithm in a test-only VM and compare outputs across 24 strategy/location/Scout-scope combinations. Production never loads that JS.
- `src/workspaces/`: Vue templates and handlers for all workspaces; no legacy callbacks or DOM delegation.

Old island components and mount modules are still in the repository because the comparison app uses them. They are outside the root application's import graph. The shared Application Requirements component is self-contained and used directly by Vue.

## Delivered workflows

| Area | Vue implementation |
| --- | --- |
| Scout scope | All Scouts, individual Scout, subset checkboxes, explicit roster creation |
| Trailmap | Stage/stream/text/status/tag filtering, readiness counts, display-only duplicate grouping, requirement details |
| Evidence | Individual completion, dates, source and provenance display; imported and historical fields retained |
| Requirements | ID-preserving JSON field editor, graph validation, missing-link and mandatory-cycle rejection |
| Trees | Tree/tag filtering, add/rename/delete with reassignment, retained graph/order metadata, checkpoint undo through Data & State |
| Scheduler | Four original strategies, 1–60 weeks, locations/subsets, generation and regeneration previews, locked metadata preservation, stale-preview checks, week JSON editor, capacity/stage-limit metadata, move earlier |
| Forecast | Distinct planned opportunity counts and repeat targets; no completion awarded by planning |
| Activities | Search/tag filters, create/edit/delete, coverage suggestions, linked requirement details; JSON editor retains extra metadata |
| Weekly Themes / Tracker | Shared requirement browser with theme/stage/stream/status filters and per-requirement completion counts |
| Data & State | Six dataset kinds; JSON/YAML and original nested-record CSV semantics; preview/apply; actual XLSX decoding and additive workbook interpretation |
| Recovery | Six full checkpoints, explicit restore preview, full backup, targeted resets and factory reset with typed confirmation |
| Application Requirements | Existing filterable/exportable product catalogue, explicitly identified as describing PR #40 rather than certifying this draft |

## Remaining gaps and limits

1. Tree layout: no draggable canvas, drawn edges, private graph-layer editor, or legacy tree-history browser. Existing coordinates, private layers, history and unknown studio metadata remain stored and exported. Generic requirement editing edits the master graph only.
2. Scheduler review: no guided per-Scout session review/verification, new activity-file attachment UI, week-theme picker, drag rearrangement, or detailed timeline impact panel. Existing attachment and review metadata survive load/save and locked regeneration; changed unlocked weeks are cleared by the original generation algorithm. The generic week editor is available, but this is a usability gap.
3. Forecast: the full detailed readiness simulation, per-Scout projected achievements and milestone projections are not ported. The Vue forecast counts planned opportunities only.
4. Weekly Themes and Requirements Tracker are functional filtered views, not the full PR #40 specialized presentations. Multi-theme planner statistics, related-edge overlays and tag-library administration are not ported.
5. Activity and requirement editing currently use validated JSON forms rather than the complete structured editors. Bulk completion, manual session-occurrence controls and richer activity workflows remain pending.
6. Trello JSON exchange and help/design content are retained in the comparison app but have not been ported. The application catalogue may cite legacy implementations.
7. Workbook validation uses fictional files and style-parser unit fixtures. No real Scout workbook or production browser profile has been tested. Existing SheetJS fill-style limitations still apply; preview and independently verify a real workbook before acceptance.
8. localStorage cannot provide an atomic multi-key transaction. Every edit stores a full checkpoint before writes and attempts rollback on partial failure. Failure of both save and rollback is reported; stop editing and restore the checkpoint. Cross-tab changes block further writes until reload. Exported backups remain essential; both interfaces share the same origin's storage.
9. Empty standalone schedule imports retain the existing 1–60 week import rule. A full backup can represent an empty schedule.

## Safety and validation

Curriculum data files and the 142 IDs/text/stages/streams are unchanged. Scout keys stay `Scout::requirementId`; roster sentinels remain `Scout::__roster__`. Workbook dates, highlights, source sheet/row, workflow and existing manual evidence use the original additive merge semantics. Stage 1 readiness now follows the PR #40 rule in the shared TypeScript domain helper; its older test used a Stage 1 prerequisite as a blocker and was corrected to test a Stage 2 dependency.

Reads do not initialize or rewrite localStorage. Corrupt progress or checkpoints block initialization rather than silently resetting records. A safety-checkpoint write failure prevents the edit. Unknown progress/studio metadata is preserved on normal saves. JSON/YAML full exports retain the existing full-state format (including its original ten-entry exported studio-history limit).

Local verification covers baseline identities and comparison markup, existing domain tests, new storage/rollback/format/workbook tests, scheduler differential tests, Vue browser flow including reset/recovery and HMR, and generated legacy asset integrity. No GitHub Actions runs are requested, no workflow files are added or enabled, and branch/base names do not match the repository's existing push/PR workflow filters.

Verified locally: clean `npm ci` (zero reported dependency vulnerabilities), typecheck, all 68 unit tests, production build, asset/entry checks, Vue browser acceptance on dev and compiled output, and dev hot reload. The legacy comparison smoke explicitly disables duplicate display grouping before asserting all 142 visible cards after each reload; its prior reload assertion predated that PR #40 default.

Do not merge or deploy this draft as a parity-complete release. Complete the gaps above and real-workbook/manual acceptance first.
