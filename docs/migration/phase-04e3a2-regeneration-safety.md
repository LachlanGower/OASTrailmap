# Phase 4E.3a continuation — regeneration safety and Vue parity

Stacked directly on draft PR #27. This continuation is limited to the existing 4E.3a interactions, not the broader 4E.3b scheduling algorithm and load tests.

## Changes
- Clearing a themed week now requires an explicit additional confirmation and creates a schedule checkpoint before removing planned requirements.
- Regenerating a week with an attached or confirmed activity now warns before invalidating that attachment; Cancel preserves the previous week.
- Applying theme regeneration or clearing a theme removes the old single-file activity as well as multi-activity confirmation fields so the week cannot silently display stale coverage.
- The Vue card snapshot prioritises the stored explicit `week.theme` over `week.tags[0]`, matching the original theme UI.
- Legacy forecast enhancement and Vue's post-render hooks no longer duplicate swap buttons on the same card.

## Verification checklist
1. With a locked themed week, Cancel lock confirmation and confirm absolutely no change.
2. Clear a theme, Cancel destructive confirmation, compare full week object before and after; then accept and check checkpoint history, lock, cleared attachment and review.
3. Attach an activity and change a theme; Cancel attachment warning and verify old week retained; accept and verify attachment, activityIds, confirmedSession and reviewed fields cleared.
4. Render Vue weeks repeatedly; assert exactly one reroll control and one swap button per skill. Check the explicit theme selection remains stable across reloads.
5. Confirm a saved Scout completion record, date and workbook provenance are unchanged after every scheduling interaction.
6. Compare with `?scheduleWeeksRenderer=legacy` at desktop and mobile; confirm scheduler export/import remains valid.

**No new OAS rules, location policy, storage schema or Scout achievement writes.** CI/browser acceptance is pending; do not equate code commit with passed tests.
