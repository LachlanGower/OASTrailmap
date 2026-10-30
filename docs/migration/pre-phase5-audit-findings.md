# Final Phase 4 Vue integration audit — defect register

**Branch:** `migration/pre-phase5-full-audit`; based on PR #37. **Gate:** Phase 5 is prohibited until the owner has exercised full functionality and explicitly authorises entry. The audit PR must stay draft; production `main` is untouched.

## Scope and automatic checks
- Vue/TypeScript compilation, unit/domain contracts, legacy byte-preservation and Vite build.
- All existing `tests/e2e/*.cjs` executed against both Vite development and compiled static dist by `.github/workflows/pre-phase5-full-audit.yml`.
- Component lifecycle, input routing, visual/accessible controls, tab continuity, workbook import provenance, schedule/evidence separation, snapshot/restore safety, repeated opportunities and activity coverage.
- Human acceptance checklist: `OAS_Trailmap_Pre_Phase5_Manual_Test_Checklist.pdf` supplied in conversation, not stored in the public repository to prevent inadvertent private test notes.

## Confirmed issues and remediation

| ID | Severity | Finding | Correction | Status |
| --- | --- | --- | --- | --- |
| AUD-001 | Test integrity | Activity Studio browser regression asserted the entire serialized Scout state was unchanged on activity creation, although unrelated application metadata can be recomputed. | Assert that `scoutRecords` evidence is unchanged, and compare stable user-visible activity fields instead of generated IDs/timestamps. | Code corrected; full-suite rerun pending. |
| AUD-002 | Functional navigation | Vue Data dashboard mount automatically clicked its tab, potentially stealing focus from Trailmap on initial load. | Removed implicit navigation; the user's active workspace remains authoritative. | Code corrected; dedicated navigation regression added. |
| AUD-003 | Functional navigation | Lazy Vue scheduler week-card mount automatically clicked Scheduler, potentially changing the current workspace. | Removed programmatic tab click after Vue initialisation. | Code corrected; broader browser parity pending. |
| AUD-004 | Scheduler display | Removing that synthetic tab click exposed an implicit refresh dependency: Vue week cards could start blank when mounted from a preloaded schedule. | Exposed a no-navigation `renderSchedule` refresh and added a preloaded-week browser regression. | Code corrected; full-suite rerun pending. |
| AUD-005 | Test integrity | Activity editor parity test read activities from the wrong local storage key and compared two objects using reference equality. | Read from the Scout/app state key containing activities and use deep equality of stable user-facing fields. | Test corrected; rerun pending. |
| AUD-006 | Test timing | Accessibility test made a brittle direct-focus assertion immediately after a workspace change. | Use the actual keyboard `Enter` interaction on the button and assert the review panel appears. | Test corrected; rerun pending. |

## Non-negotiable manual checks
These cannot be proven by synthetic CI data alone. Verify in a private browser: (1) original Excel assessment colors/dates/provenance, including reimport after later manual evidence; (2) full-backup to fresh-profile restore; (3) selective restore and reset, rollback and corrupted-input handling; (4) 1/40/60-week scheduling, locked-week integrity and no automatic awards; (5) full mobile/desktop navigation, keyboard and visual parity; (6) multi-activity leader confirmation; (7) official versus inferred repeat counts.

## Reporting a defect
Include the feature, query-string renderer overrides, device/browser, exact fictional reproduction steps, expected/actual result, console error and severity. Never paste a real Scout name, workbook, backup or evidence into GitHub. Fix any confirmed data-loss, corruption, incorrect award, privacy or blocking defects before Phase 5.

**Audit status:** implementation and CI still in progress. Passing earlier feature-slice workflows is not equivalent to full end-to-end acceptance.
