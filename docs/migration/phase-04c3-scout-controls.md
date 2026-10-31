# Phase 4C.3 — Vue Scout selection and completion controls

**Branch:** `migration/phase-04c3-vue-scout-progress`  
**Base:** `migration/trunk`, after the approved and merged Phase 4C.2 requirement map.

## Scope and current implementation

This increment converts the Scout-specific **selection dropdown, subset checkbox list, individual completion checkbox, completion date input and pack/subset completion checkboxes** to Vue 3. They are embedded in the existing Trailmap screen with unchanged IDs, classes, labels and source of truth.

The original `js/app.js` is still the authority for:
- Scout roster names, active scope, subset selection, readiness checks, progress counters and saved evidence
- Storage under the exact `oas-trailmap-v1` key and original version-1 payload structure
- Preserving unknown per-record fields such as `sourceSheet`, `sourceRow`, `highlighted`, original import provenance and custom historical metadata when updating a record
- Assigning source `manual` and retaining or clearing completion dates using **the original legacy edit rules**
- Applying/cancelling subset selections and showing/hiding the subset panel with the existing buttons
- The entire workbook reader, unmatched-row preview, workbook-only requirements, import/reimport and backup/restore flows

The Vue controls only receive **read-only snapshots** of this state. On user action they call the exact legacy function, which updates the original `scoutRecords` object and calls `save()`, `renderSummary()`, `renderMap()`, `renderDetail()` and `renderPlanner()`. Vue does not independently implement a storage format or create duplicate data stores.

The requirement map remains Vue from 4C.2. The **rest of the detail panel** (prerequisites, activity links, advisory links and static copy) stays legacy, and its existing event listeners remain in place.

## Fallback

- **Default:** http://localhost:5173/ — Vue Scout controls, as well as the approved Vue requirement map.
- **Old Scout controls:** http://localhost:5173/?scoutRenderer=legacy — selection, subsets, completion and date controls remain original JS.
- **Old requirement map independently:** `?trailmapRenderer=legacy`.
- Both flags can be combined to run the original Trailmap map and original Scout controls.
- Initialization waits for the legacy `init()` function to load progress and bind its event handlers. If Vue cannot take over, the original controls are restored with a compatible change listener. Completion-control mount failures revert to original detail rendering.

**No saved data is migrated**, no Scout records are committed, and the browser origin never transmits Scout completion data to GitHub. When switching branches at the same localhost origin, localStorage is shared: test only with fictional data or export a full backup first.

## Reviewer checklist

```bash
git fetch origin
git switch --track origin/migration/phase-04c3-vue-scout-progress
npm ci
npm run dev
```

In a fresh browser profile with **fictional** Scout progress, compare Vue and original versions side by side. Check:
1. All Scouts, individual Scout and selected-Scout subset, including opening the subset panel, checking names and applying/cancelling.
2. Individual requirement completion, changing an evidence date, unchecking, checking again, and reloading.
3. Pack-level completion checkboxes for different Scouts and the updated readiness colours and progress summaries.
4. Source sheet/row/highlight evidence remains intact after manual updates and the exported backup still contains all historic fields.
5. Mobile display and the original scheduler/Activity Studio/Data & State remain functional.

The buttons **Choose Scout subset / Apply / Cancel**, workbook importing, and most static detail content are intentionally still legacy. Their behavior has not been rewritten, even though Vue renders the subset options and completion controls.

## Automated gates

```bash
npm ci
npm audit --audit-level=moderate
npm test
npm run build
npm run check:dist
```

`tests/e2e/scout-progress-parity.cjs` is a browser-level golden-master comparison in both Vite dev and compiled build, at 1440×900 and 390×844. It uses two fictional Scouts and checks all selection states, group and individual edits, date changes, storage source and provenance, selected scope, reload and JSON backup content. Every other migration PR regression suite also runs on pull requests.

## Still outstanding

**4C.4** is the separate Excel importer migration: parsing the supplied original workbook, preview, style/date evidence, unmatched references, provenance preservation, reimporting and rollback with private workbook tests. No production deployment and no merge to `main`.

This draft PR should merge into **`migration/trunk` only after visual review and all automated checks succeed**.
