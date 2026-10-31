# Phase 4E.4a — Vue OAS requirements coverage tracker

Stacked on 4E.3b / PR #29. Migrates the *rendered* 142-skill coverage table and status summary to Vue; leaves `coverageRows`, search/status filtering, CSV export and evidence calculations authoritative in `js/theme-tracker.js`.

## Guarantees
- 142 canonical curriculum requirements are independent of the 118 web-application requirements.
- Vue receives a read-only, display-only projection of requirement, linked activity, planned-week count, repeat target and selected-Scout evidence totals. No raw Scout identity or record is passed to the component.
- The original filters and Export CSV button remain intact. `?requirementsTrackerRenderer=legacy` keeps the complete legacy tracker.
- Legacy summary/table DOM is preserved hidden for rollback, not replaced destructively.

## Acceptance
All 142 requirement IDs appear exactly once without filters; text, tags and ID search; status filtering; complete/partial/planned/unaddressed counts; repetition in distinct weeks; original CSV export parity; subset of fictional Scouts, no Scouts and no schedule; 1440x900 and 390x844; browser reload; no unexpected achievement writes.

## Verification
Implementation committed. Automated tests, browser parity and original workbook acceptance remain pending. Do not update production `main`.
