# Phase 4D.3 — Vue Skill Tree requirement editor

**Stack:** `migration/trunk` → draft [4D.2 Vue tree canvas](https://github.com/LachlanGower/OASTrailmap/pull/21) → `migration/phase-04d3-vue-tree-editor`.

This is a **stacked PR**, not an approval or merge of 4D.2. `main` and production remain unchanged.

## Delivered

The `#treeEditor` panel is now a Vue 3 component when `?treeEditorRenderer=legacy` is **not** present.

It preserves the original screen's markup structure, CSS classes, IDs, labels and input names for:

- Existing mandatory **parent and child links**, with targeted × Remove controls.
- Preferred and additional acceptable locations from `DATA_LOCATION_LIST`.
- Estimated distinct nights/events required (bounded 1–40) and original occurrence provenance display.
- Requirement name, description, tree and readonly stage.
- Tags, mandatory prerequisites and suggested/advisory learning links.
- Existing Save requirement button, private-custom versus shared-master scope text and no-selection prompt.

The Vue component receives an immutable-for-presentation snapshot built from the original `requirements`, `studio`, `mapperLinks` and `editingReq`. It does not create a second source of truth or touch localStorage itself.

**Save and Remove use the original JavaScript transaction.** The legacy and Vue editor now both call `commitTreeEditor(FormData)`: reject circular mandatory links before checkpointing, take the same original snapshot, apply text/tree/tags/locations/occurrence/graph edits, persist with existing `setReqData()`, and refresh the tree and map. In a custom tree, prerequisite edits only update `studio.treeGraphs[activeTree]`; in a master tree they update shared requirement data. Advisory links never become mandatory by rendering.

The canvas from 4D.2 continues to use its legacy cycle, edge overlay, ordering and selection logic. Master/custom options, tree creation/deletion, tag administration, history/restore and YAML remain the existing handlers.

## Review

```bash
git fetch origin
git switch --track origin/migration/phase-04d3-vue-tree-editor
npm ci
npm run dev
```

Open Skill Tree Mapper and compare:

- Vue editor with Vue canvas: http://localhost:5173/
- Original editor, Vue canvas: http://localhost:5173/?treeEditorRenderer=legacy
- Original editor and canvas: http://localhost:5173/?treeEditorRenderer=legacy&treeRenderer=legacy

Try selecting a skill, updating its text/description, switching tags and locations, adjusting occurrence counts, rejecting an invalid mandatory cycle, breaking one existing parent/child link and undoing it. Toggle between master/custom link modes and confirm private custom edits do not change the master graph. Compare the right-hand editor on desktop and below the graph on mobile.

**Use fictional data or a separate profile with a full backup.** Both URLs share the same localhost localStorage, so form edits persist across them.

## Automated gates

The new `tests/e2e/tree-editor-parity.cjs` compares Vue and legacy editing at 1440×900 and 390×844 in both Vite dev and compiled `dist`. It verifies exact form names/selections, edit save semantics, source/metadata, cycle rejection without history mutation, direct-link break/undo, custom/master graph isolation, original storage keys, and unaffected fictional Scout progress. `tests/unit/tree-editor.test.cjs` tests presentation scope and occurrence limits.

CI also runs prior map, Scout progress, workbook, navigation, help and legacy baseline tests. Neither test suite uses actual Scout records, source workbook bytes, nor production data.

## Next

**4D.4 — Vue tree administration and recovery:** tree creation/rename and tag library, snapshots/history/undo, rollback and YAML import/export safeguards. Full 4D acceptance requires matching the original workflows and safe recovery, not just passing the editor and canvas tests.

**Merge only after user visual review of this PR and the parent 4D.2, with all checks green. Never merge to production `main` without explicit Phase 6 approval.**
