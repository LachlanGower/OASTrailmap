# Phase 4G.2 — Vue Data & State dashboard and import review

Stacked on draft PR #33. Vue renders the dataset counts and export actions. The existing `dataRender` computes counts and still populates hidden original controls. Export clicks delegate to the existing `dataExport` handler. All import selectors, preview/apply/cancel logic, Excel importer, checkpoints and restore remain unchanged and active.

The existing HTML and IDs are retained. `?dataDashboardRenderer=legacy` restores the full original dashboard. This incremental slice deliberately does not migrate dangerous recovery controls (4G.3).

## Test checklist
- Verify 142 curriculum requirement IDs separately from the 118 application register IDs
- Dataset counts reflect fictional activities/schedule/Scout records
- Individual YAML/JSON exports match legacy exactly in structure; full backup is the only one containing Scout records alongside reference data
- Import preview and cancel do not modify any stored keys; invalid or mismatched references are rejected before apply
- Excel preview/reimport and metadata preserved, full original workbook tested only privately
- Desktop/mobile and dev/static production build; no duplicate export handlers or storage writes on dashboard display
- Recovery buttons remain original and require the existing confirmations

CI workflow runs npm test, build, compiled bundle verification and Playwright parity at 1440×900 and 390×844. Manual approval still required.
