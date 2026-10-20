# Phase 3 — requirements, progress, scheduling rules and storage ports

**Branch:** `migration/phase-03-domain-storage` → PR targets `migration/trunk`.
**Release safety:** this phase **does not** modify `index.html`, `js/`, `css/`, `data/` or the production Pages configuration. The current app runs exactly as before; the new TypeScript modules are unconnected to its runtime.

## Extracted modules

| Source | Responsibility | Legacy source mirrored |
| --- | --- | --- |
| `src/domain/models.ts` | Existing requirement, Scout record, schedule week and studio payload types; allows unknown historical metadata | `js/app.js`, `js/studio.js`, `js/data-manager.js` |
| `src/domain/requirements.ts` | Validate IDs, wording shape, mandatory prerequisite DAG and suggested links; load existing requirements file; tag selection | `data/requirements.json`, `js/studio.js:validateReqs`, planner |
| `src/domain/progress.ts` | Legacy `Scout::requirement` keys, Scout selection and subset, blocked/readiness colours, repeat evidence | `js/app.js`, `js/forecast.js` |
| `src/domain/scheduling.ts` | Prerequisite-first ordering, per-week repeat opportunity counts, 1–60-week/reference checks | `js/studio.js`, `js/forecast.js` |
| `src/services/legacy-state.ts` | Explicit injected localStorage interface, read-only snapshots, non-destructive parse errors, opt-in legacy write | `js/app.js:load/save`, `js/studio.js:readStudio` |
| `src/services/import-validation.ts` | Existing full/progress/requirements/activities/schedule/tree envelope checks | `js/data-manager.js:dataValidate` |
| `src/services/legacy-exports.ts` | Current six Data & State export envelopes and field names, with injected export timestamp | `js/data-manager.js:dataBundle`, `js/studio.js:scheduleExport` |
| `src/services/public-requirements.ts` | Injectable HTTP reader of `data/requirements.json` | `js/app.js:init` |

## Preserved compatibility decisions

- The shipped `data/requirements.json` remains **the only browser-ready default OAS requirement dataset**. All 142 IDs and wording are unchanged; no newly invented ID generation, data normalization or authoritative new prerequisites.
- User data remains local to existing storage keys `oas-trailmap-v1`, `oas-studio-v1`, `oas-data-checkpoints-v1`. No keys are renamed or silently migrated.
- Existing Scout completion records remain authoritative, even if a requirement now needs multiple proposed evidence sessions. Distinct `sessionEvidence` entries count once; a planned week never marks a Scout completed.
- Selected-Scout and pack/group readiness deliberately preserve old semantics, including an empty cohort being shown as ready.
- Session ordering and schedule import ID checks mirror original rules without rewriting weeks, heuristics or tags.
- Existing export envelopes keep their `format`, `schema_version` and field names, including `requirements` schema v3 tree keys.
- The injected storage adapter throws on corruption rather than silently discarding records; that is a **safety improvement in new, currently unused code**, not a production behaviour change.
- All operations are opt-in. `readLegacySnapshot()` does not write. The adapter's explicit writer touches only the original progress key; backup and user confirmation remain caller responsibilities.

## Testing

```bash
npm ci
npm run test:domain
npm run check:baseline
npm run typecheck
npm run build
npm run check:dist
```

The test runner uses existing TypeScript + Node 22 and has **no new npm dependencies**. It compiles only the extracted services into ignored `.phase3-test-dist/`, then executes `tests/unit/*.test.cjs`. Test cases cover the canonical 142 requirements, cycles/dangling IDs, tags, completion/readiness statuses, repeat opportunities, prerequisites ordering, saved synthetic Scout data, unknown field preservation, corrupt JSON, invalid writes, the six original export formats and public-data loading.

CI: `.github/workflows/phase-03-domain.yml` runs those checks along with `npm audit --audit-level=moderate`. Prior legacy/Vue browser smoke suites still run on PRs targeting `migration/trunk`.

## Deliberate gaps / next gates

- The legacy UI and Excel workbook parser have **not** been switched to these modules. Preserve the original importer until browser tests with the actual workbook and merge/reimport scenarios pass.
- The **complete scheduler heuristic**, theme regeneration, activity suggestions, per-tree graph override editor, complex checkpoint recovery and YAML parser remain legacy. They require separate golden-master behavioural tests before replacing the current functions.
- The new validators cover the base JSON envelopes. Exact `tree_graphs` internal graph cycles, ad hoc user extension fields, and import preview deltas require stronger app-level tests before production integration.
- This phase alone **does not** demonstrate that exporting arbitrary previous browser data is byte-for-byte identical or that historical full-state files round-trip losslessly. It tests representative synthetic formats; real private user data must never be committed.
- There are **no migrations on page load**. Do not replace the original storage loader until rollback, snapshot and corrupt-data handling have been accepted.

## Phase 3 acceptance gate

1. All TypeScript, Node, legacy baseline and Vue build tests pass in GitHub Actions.
2. Built legacy files still compare byte-for-byte against repository sources; old user experience is untouched.
3. No Scout data is submitted, committed or transmitted. All test identities are fictional.
4. Review the module interfaces and storage/error strategy before connecting these ports to future Vue components.
5. Integrate to `migration/trunk` only; production `main` must remain untouched.
