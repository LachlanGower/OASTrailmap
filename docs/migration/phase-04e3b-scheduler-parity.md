# Phase 4E.3b — Scheduler parity and apply guards

Stacked on draft PR #28. This slice hardens regeneration without changing the ranking heuristic, curriculum rules or Scout evidence.

## Code and tests
- Pure TypeScript `inspectRegeneration` rejects a plan outside 1–60 weeks and a changed/missing locked week, while counting changed unlocked weeks.
- `assertUnchangedSincePreview` detects stale previews even when another interaction edits the same schedule.
- The browser regeneration handler checks the exact proposal and captures the previous schedule before Apply. It refuses a changed/invalid plan rather than silently overwriting newer edits.
- Unit tests cover boundary, locked-week attachment preservation, and stale preview cases.
- Existing `?scheduleWeeksRenderer=legacy` fallback remains valid.

## Acceptance matrix for browser parity
- 1, 40 and 60 weeks; 0/1/many fictional Scouts; selected subsets and empty skills.
- Multiple locked sessions with activity attachments; compare proposal and stored week JSON before/after.
- While preview is open, lock/edit a week and then attempt Apply: reject stale preview.
- Confirm repeat opportunities count distinct weeks, not duplicate IDs in one week.
- Compare location on/off and external-week suggestions; disabling location must remove location scoring.
- Compare root Vite dev and static `dist`, desktop 1440×900 and phone 390×844, with Vue and legacy flags.
- Confirm no scheduled session grants Scout completion, and original Excel metadata remains unchanged.

**Not yet acceptance-tested:** full browser parity, 60-week performance and real private Excel reimport. Do not treat unit tests as Phase 5 signoff.
