# Phase 4C.4 — Vue Cub Pack Excel importer (preview-first)

**Branch:** `migration/phase-04c4-vue-workbook-import`  
**Base:** `migration/trunk` after 4C.3 merge.

## Implemented

- A pure TypeScript importer in `src/features/workbook/workbook-parser.ts` consumes **SheetJS workbook objects**. SheetJS is still the XLSX file decoder; this migration does not introduce a new library or change the workbook file format.
- The original 9-sheet Stage 1–3 / Camping–Bushwalking–Bushcraft roster layout, header discovery, Plan/Do/Review/Verify workflow rows, punctuation-safe approximate matches, supplemental requirement IDs, Excel numeric dates, formatted date strings and highlighted-only completion evidence are parsed under the original rules.
- `src/features/workbook/WorkbookImportPreview.vue` renders the same preview text, unmatched-requirement rows (up to 80), and explicit **Apply import** / **Cancel** actions as the original interface.
- Original entry points `#workbookFile` and `#dataFile` continue to call `handleWorkbook()`. It delegates to Vue only when the new importer is ready; a missing bundle, `?workbookRenderer=legacy` or late initialization uses the existing implementation.
- Only `window.__oasWorkbookApply()`, extracted from the original browser implementation, changes `scoutRecords`. It retains unknown historical fields, existing achievements and timestamps when the workbook does not provide a replacement date; it updates the same `oas-trailmap-v1` payload via the original `save()` and `renderAll()`.
- Parsing or cancelling a new preview **does not modify storage or source requirements**. Unlike the old parser, missing requirement workflow labels are deferred until the explicit Apply step.
- Reimport of an unchanged workbook must be stable. The original stage/sheet/row/workflow/highlight evidence remains attached to completion records.
- The imported workbook never leaves the browser; there is no network upload or new storage key. Any workbook used for tests in GitHub is **fully fictional**.

## Private reference check

The original supplied Cub Pack workbook has nine worksheets (Stage 1/2/3 × three streams). It was inspected locally to confirm the row-4 roster and skill/evidence layout. **No Scout names, original sheets, private workbook bytes, completion records or screenshots of the actual workbook have been committed.**

The visible unit and browser tests use `tests/fixtures/workbook.synthetic.cjs` with fictional Scouts and imaginary workbook-only requirements. This synthetic fixture specifically tests a date-plus-highlight cell, a highlight-only cell, a number-encoded Excel date, date strings, an unmatched skill, an unused sheet and a second stage.

## Review instructions

```bash
git fetch origin
git switch --track origin/migration/phase-04c4-vue-workbook-import
npm ci
npm run dev
```

Open the Data & State workspace and import a **fictional** workbook first:
- Vue workbook preview: http://localhost:5173/
- Original workbook preview: http://localhost:5173/?workbookRenderer=legacy
- Combined original Scout/map/importer UI: `?scoutRenderer=legacy&trailmapRenderer=legacy&workbookRenderer=legacy`.

Compare preview counts, unmatched rows, highlighting and dates. Cancel and ensure no data changed. Apply, select a fictional Scout, inspect completion and provenance, export the backup and reimport to confirm the same records. Compare desktop and mobile layouts.

Before testing the original private workbook, create and download a **full backup** of your existing browser state in a separate browser profile. Confirm that reimporting doesn't clear unrelated manual progress. **Do not upload or paste private Scout rows into GitHub issues or CI logs.** Private workbook acceptance needs local user review; passing the fictional fixture is not proof of every real workbook style variation.

## Automated gates

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run check:dist
```

`tests/unit/workbook-import.test.cjs` pins pure parsing and preview isolation. `tests/e2e/workbook-import-parity.cjs` compares Vue and legacy import in both development and compiled builds at desktop 1440×900 and mobile 390×844. It checks pre-apply storage equality, Cancel, Apply, progress dates and highlighting, provenance, supplemental requirements, export and stable reimport. All existing migration browser checks also run on the PR.

## Remaining compatibility work and gate

The complex Data & State selective import/recovery UI remains legacy for now. XLSX decoding stays with the existing SheetJS runtime, and no new workbook parser library is installed. A private local check against the supplied original workbook's actual highlighting and date styles remains an **explicit manual approval gate** before this PR can merge.

Keep the PR Draft until all automated checks and visual/data-safety reviews pass. No production `main` changes.
