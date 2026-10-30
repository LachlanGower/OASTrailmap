# Phase 4D.4 — Vue tree administration and recovery controls

**Stack:** `migration/trunk` → [4D.2 canvas (PR #21)](https://github.com/LachlanGower/OASTrailmap/pull/21) → [4D.3 editor (PR #22)](https://github.com/LachlanGower/OASTrailmap/pull/22) → `migration/phase-04d4-vue-tree-administration`.

This is **not** approval or a merge of either parent PR. Review the combined branch after the stack is implemented. Production `main` stays unchanged.

## This increment

Vue now renders the original **Skill Tree Mapper administration toolbar** and the **History / rollback** panel:

- Named tree and tag views, shared-master and private-custom graph mode selection, original scope warning
- New tree, Rename tree, Tag library and Save snapshot buttons
- History panel's checkpoint titles/times and Restore controls
- Original schema-v3 requirements.yaml export button and YAML/JSON file import picker

The toolbar retains the same public DOM IDs, form semantics, labels, order and stylesheet classes so existing screenshots and keyboard paths work. The history list is displayed through Vue but does not contain Scout names or progress. `?treeAdminRenderer=legacy` retains the original toolbar and history markup.

**Every administration and data mutation continues to run in the existing `js/studio.js` implementation.** Before the toolbar is replaced, the Vue bridge captures the initialized legacy button, select and file-input handlers; user actions invoke those same handlers with the new control's event. The Vue component cannot create or rename a tree or import YAML independently.

Snapshot restore is extracted into `restoreTreeHistory(index)`, called by **both** the legacy and Vue Restore buttons:

1. Present the original confirmation before restoring
2. Read the selected history entry; create an explicit `Before rollback` safety checkpoint
3. Restore the exact saved requirements, tree registry, tag library, card order and master/custom tree graphs
4. Persist with the original `setReqData()`, close the history panel and notify the user

`studio.history` remains capped at 20 original checkpoints. The existing Undo action and failure paths stay in place. YAML import keeps `validateReqs` / `validateTreeGraphs` plus the original confirmation and safety snapshot before replacing records; export retains `schema_version: 3` and the original filename. No storage keys, file formats, Scout progress, or workbook imports change.

## Compare locally

```bash
git fetch origin
git switch --track origin/migration/phase-04d4-vue-tree-administration
npm ci
npm run dev
```

Open Skill Tree Mapper:

- **Complete current Vue stack:** http://localhost:5173/
- **Original administration/history only:** http://localhost:5173/?treeAdminRenderer=legacy
- **Original tree canvas, editor and administration:** http://localhost:5173/?treeRenderer=legacy&treeEditorRenderer=legacy&treeAdminRenderer=legacy

Use fictional state or a separate browser profile with a full backup. Review tree creation/renaming, tag add/rename/delete, toggling master/custom and tag views, saving a named checkpoint, editing the tree after the checkpoint, restoring the prior state, export of the requirements YAML, validation and confirmation before import, and rollback after import. Compare both desktop and mobile layouts.

**No real Cub Pack workbook or Scout data is in this PR or its test artifacts.** Do not use an actual production browser profile for rollback tests until after exporting a backup.

## Automated evidence

`tests/unit/tree-administration.test.cjs` pins the tree/tag view and custom/master warning contract.

`tests/e2e/tree-administration-parity.cjs` runs the same fictional sequence in Vue and legacy modes in Chromium at 1440×900 and 390×844, for Vite dev and compiled `dist`:

- Create and rename a tree, add a tag and use a read-only tag view
- Create a manual checkpoint, add a temporary tag, restore the previous checkpoint
- Export the original schema-v3 file and compare requirements, tree registry and tag-library shape
- Reject malformed JSON import without modifying requirements/history
- Import a valid fictional requirements edit with confirmation, then roll back
- Assert every step keeps Scout completion records unchanged

The dedicated CI job also runs the baseline/domain tests, npm audit, Vite build and legacy asset check. Existing migration regression workflows run on the stacked PR as well.

## Remaining after full Phase 4D sign-off

With 4D.2–4D.4 together, the full tree **UI** is migrated, but original graph storage/validation and safety fallback remain as deliberate compatibility layers. Follow-up integration should check large trees, snapshots after reload, long histories, corrupt YAML/JSON and keyboard accessibility before retiring those paths in final Phase 4H cleanup.

Next workspace: **Phase 4E.2 — Vue Scheduler timeline and week controls**, followed by regeneration/strategy parity and conditional forecasts. Phase 5 is still required for complete product-wide acceptance.

**Leave this PR Draft pending your cumulative visual approval. Merge in stack order only after all checks pass.**
