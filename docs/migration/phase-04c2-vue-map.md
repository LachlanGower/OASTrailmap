# Phase 4C.2 — Vue Requirement Map (isolated UI replacement)

**Branch:** `migration/phase-04c2-vue-requirement-map`
**Base:** `migration/trunk` (all previously merged 4A and 4B–4H foundations)

## Implemented

The **stage/stream requirement-card map** (`#mapCanvas`) now renders in Vue 3 and TypeScript, using the original CSS classes, marker text, badges and hierarchy:

- The existing 142 requirement IDs, texts, stage/stream grouping, and priority ordering stay authoritative. Imported workbook-only supplemental requirements are also included when present.
- Completion / readiness / blocked colours, Scout-scope ready counts, activity badges, and selected-node styling are computed by **the existing legacy rules**, exposed as a read-only view-model snapshot.
- Search, stage/stream/status/tag filters, planner mode and Scout subset selection still belong to the original toolbar; when they change, the legacy `renderMap()` forwards an updated snapshot to Vue instead of overwriting Vue's DOM.
- Clicking a Vue node delegates to the original `renderDetail()` workflow. Closing or following a related link, toggling completion, and changing evidence dates update Vue via the same old functions.
- The original advisory-edge overlay is drawn after each Vue DOM update to preserve measured node positions, `CSS.escape` IDs, scroll and selected related-skill connectors.

### Compatibility strategy

Only `#mapCanvas` is replaced. **The Scout detail panel and its saving logic, localStorage keys, current Excel importer, existing workflow files and all other workspaces remain the original implementation.** The new Vue component cannot mutate Scout records, award an achievement or parse a workbook; those operations continue in the existing application.

- Normal Vue map: http://localhost:5173/
- Original map fallback: http://localhost:5173/?trailmapRenderer=legacy
- Diagnostics: `document.documentElement.dataset.oasTrailmapRenderer === 'vue'` in Vue mode.
- No auto-conversion of stored data, no new storage keys, no network transport of Scout progress.
- If the map doesn't initialize, the original map remains. If a Vue update throws, the existing renderer takes over.

## Reviewer instructions

```bash
git fetch origin
git switch --track origin/migration/phase-04c2-vue-requirement-map
npm ci
npm test
npm run dev
```

Use the two URLs above side-by-side. Verify the visual fidelity of the complete three-stage map, search and filters, pack versus individual Scout readiness, planner priority sorting and tags, opening a requirement, editing completion for a **fictional** Scout, closing the detail panel, and showing/hiding advisory links. Compare mobile at 390px.

For local-only data safety, use a fresh browser profile and export a full backup of any saved progress **before testing any manual completion editing**. Dev and production origins can have different records, and localhost branches share localStorage.

## Automated tests

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run check:dist
```

`tests/unit/trailmap-map.test.cjs` verifies map group order, planner sorting and status copy. `tests/e2e/trailmap-map-parity.cjs` compares **Vue vs original map** at desktop/mobile in the dev server and compiled `dist/`. With a fictional example Scout it compares stage/stream/status/search/planner filters, requirement ID order, status classes, badge text, summaries, selected details, completion change, saved record shape and empty results. Existing full-app browser workflows remain in CI on the PR.

## Remaining Phase 4C

**4C.3:** Migrate Scout selection, detail panel completion editing, evidence dates, subset management, planner controls and associated saved-state writes, with import/rollback safeguards.

**4C.4:** Migrate the original Excel workbook parser and preview/apply/reimport flows with private workbook tests and historical-field preservation before removing the legacy implementation. No real Scout records or workbook are uploaded to GitHub.

This PR is *not* a declaration that Phase 4C is fully finished. Final manual visual approval is required before merging into `migration/trunk`. Production `main` remains unchanged.
