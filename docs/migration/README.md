# OAS Trailmap migration trunk

This directory governs a **behaviour-preserving refactor** of the existing OAS Trailmap. The goal is maintainable, component-based code that still builds to static files for GitHub Pages. The user interface, language, interaction patterns, navigation, persisted records, imports, exports and planning semantics are compatibility contracts—not redesign opportunities.

## Branch arrangement

- `main`: the existing production website; do not modify or change its GitHub Pages source as part of early migration phases.
- `migration/trunk`: long-lived integration branch, created from `main` at commit `231341e842f90d0774334a563cf1f6e1e48ef149`. **Not a Pages deployment branch.**
- `migration/phase-01-baseline`, `migration/phase-02-foundation`, etc.: short-lived, targeted phase branches created from the latest `migration/trunk`.
- Make draft PRs targeting `migration/trunk`, not `main`; only integrate when each phase's acceptance gate passes.
- Merge the finished, tested trunk into `main` in one deliberate, separately reviewed release. Do not auto-deploy feature or migration branches.

## Preservation contract

1. No new layout, navigation, feature or workflow design unless repairing a **reproduced and documented defect**.
2. If a defect is found: add a failing regression test, document expected versus actual behaviour, implement a narrow repair and link it to an existing `APP-xxx` requirement.
3. Keep all workspaces working: Trailmap, Skill Tree Mapper, Scheduler, Activity Studio, Data & State, Help & Design, forecast, current requirements tracker and Application Requirements register.
4. Retain all 142 existing OAS requirement IDs **and wording**, and all 118 application-requirement IDs. The fixture `baseline.json` records their original identities. Updating it requires an explicitly reviewed content change.
5. Existing workbook import semantics, completion evidence, readiness, ordering, planner, schedule strategies, prerequisites, tree overrides, activity linking and export/import formats must survive the rewrite.
6. Preserve browser records and progress provenance. The initial storage keys are `oas-trailmap-v1`, `oas-studio-v1` and `oas-data-checkpoints-v1`. Do not silently delete, reset or reinterpret existing browser records.
7. Keep Scout data in the browser. Never commit personal Scout data or exported local backups. No server/API/database is part of the migration.
8. Keep the original CSS and visible DOM behaviour as the visual baseline. Screen-level migration requires before/after visual and functional verification; the lack of browser automation at trunk setup is a recorded gap, not a pass.
9. Do not treat `implemented` in the Application Requirements register as browser acceptance-test evidence. Use its status definitions honestly.

## Authoritative references

- `data/application-requirements.json`: canonical application requirements register (118 entries at trunk creation). `docs/application-requirements.md` is a review snapshot.
- `data/requirements.yaml`: human-editable OAS requirement definitions.
- `data/requirements.json`: the browser-ready copy (142 entries at trunk creation).
- `README.md`, `docs/workflows.md`, `docs/repeat-counts.md`: documented behaviour and limitations.
- `docs/migration/baseline.json`: machine-checkable migration fixture, generated from the production code and public requirement text; contains no Scout records.

The current register lists the modular rewrite as `APP-108` (future idea at baseline); this migration is now approved work. Reconcile its status and add implementation/verification references during Phase 1, without changing unrelated application functionality.

## Phase gates

| Phase | Scope | Exit gate |
| --- | --- | --- |
| 0 | Migration trunk | Branch isolated from production; pinned baseline fixture; dependency-free checks and CI |
| 1 | Repository audit and black-box baseline | Route/action inventory, browser screenshots, representative **synthetic** storage/export fixtures, APP-001…APP-118 traceability |
| 2 | Toolchain + transitional shell | Vue 3 / Vite / TypeScript, GitHub Pages subpath build, legacy pages still working; no production deployment |
| 3 | Domain and storage extraction | Data models, validated adapters, legacy import/export and persistence parity tests |
| 4 | Incremental UI conversion | Component-by-component parity of every workspace; remove old implementation only after equivalent tests pass |
| 5 | Regression and compatibility | End-to-end browser and real workbook checks, visual, keyboard, mobile, URL, saved-data tests |
| 6 | Reviewed release | Docs, CI passing, tested production deploy and reversible code/data migration strategy |

## Develop and review

On the trunk, run `npm run check:baseline` (Node.js 22; no dependencies installed yet). Phase 2 will introduce a package lockfile and reproducible `npm ci` builds. This performs static structural checks only; it does **not** certify browser behaviour. Later phases add type checks, unit tests, screenshot tests and user-journey tests to the same CI. Baseline fixtures should be updated only after a documented, reviewed change to the preservation contract.

**Release rule:** Do not merge the migration trunk into `main` until all existing app requirements are either verified to behave the same or have a documented, approved fix; incomplete pre-existing features should not be silently converted into new assumptions.
