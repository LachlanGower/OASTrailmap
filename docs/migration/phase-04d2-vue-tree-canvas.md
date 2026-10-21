# Phase 4D.2 — Vue Skill Tree Mapper canvas

**Branch:** `migration/phase-04d2-vue-tree-canvas`
**Base:** `migration/trunk` (includes approved 4C.4 Excel importer)

## What is actually migrated

Vue 3 + TypeScript now renders `#treeCanvas` — its tree/tag heading, skill-card lanes at each prerequisite depth, requirement text, stage, ready-Scout counts, mandatory/advisory counts, selected-node state and contextual ↑ / ↓ / × quick-link buttons.

The existing `js/studio.js` remains the single source of truth for the data and algorithms:
- Master and per-tree custom prerequisite graphs; tag views use the master graph.
- `treeLevels()`, ancestor/descendant focus, depth sorting and barycentric grouping within each lane.
- Selection, quick-link add/remove, cycle protection, snapshots, safe link edits, drag reorder and persistence in `oas-studio-v1`.
- Arrow rendering in `drawTreeEdges()` after Vue updates the node DOM. Recommended links remain dashed/advisory.
- The full requirement editor, location/tags, 1–40 repeat-count adjustment, tree administration, YAML imports/exports, undo, history and recovery **remain legacy**.

No new storage keys or schema changes. All Scout progress is still read from local storage only and no scheduled opportunity marks Scout completion. The legacy renderer remains an explicit fallback.

## Manual comparison

```bash
git fetch origin
git switch --track origin/migration/phase-04d2-vue-tree-canvas
npm ci
npm run dev
```

Open **Skill Tree Mapper** in:
- Vue canvas: http://localhost:5173/
- Original canvas: http://localhost:5173/?treeRenderer=legacy

Review at desktop and mobile widths: matching lane/depth positions, visible solid and dashed arrows, selecting a skill and inspecting the editor, entering focus mode, quick-link arrows and removing a link, dragging within a depth, switching between named trees and tag views, switching master/custom links, and saving/restoring a snapshot.

The new Vue canvas is mounted only after the original mapper has been initialized; on mount failure it restores the original markup. The new UI invokes existing handler functions instead of rewriting graph mutation logic. To avoid overwriting existing progress in your shared localhost storage, use fictional test data or a separate browser profile with a full backup.

## Automated tests

`tests/unit/tree-canvas.test.cjs` checks depth and quick-action safety rules. `tests/e2e/tree-canvas-parity.cjs` compares Vue versus legacy at 1440×900 and 390×844 in Vite dev and compiled static build, including scope, selected node, focus, quick links, drag reorder, custom graph mode, tree/tag switching, and keeping fictional Scout progress untouched.

This PR is **4D.2 only**, not the whole Skill Tree Mapper migration. Review it visually before merging into `migration/trunk`. `main` and the deployed production app remain unchanged.

## Remaining Phase 4D

- **4D.3:** Vue requirement editor and quick-link management, including master/custom graph modes, tree/tag assignment, controlled location vocabulary, occurrence estimates and cycle validation. Test full edit/save/undo transactions against the original app.
- **4D.4:** Vue tree administration, snapshots/history/rollback, YAML import/export and stronger recovery/failure handling; complete mapper-level visual/regression acceptance.

The original implementation stays present until those workspaces are fully verified.
