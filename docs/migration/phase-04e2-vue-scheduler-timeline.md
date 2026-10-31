# Phase 4E.2a — Vue scheduler timeline

This slice is stacked on the **unmerged 4D.4 draft branch**. It migrates the 1–60 week **timeline buttons only**, not the full scheduler workspace. The original scheduler still owns generation, week cards and edits, locked-week rules, Scout impact, external-week preferences, forecasts, import/export and persistence.

## Compatibility boundary

`js/studio.js` publishes a read-only timeline snapshot (week, title, location, skill count, lock and preferred venue flags). Vue renders the original timeline button structure and CSS classes, then delegates selection to the original `showScheduleTimelineImpact` handler. Week-impact calculations remain authoritative in legacy code. No private Scout records are passed to Vue and no new storage format or keys are introduced. If Vue is unavailable, the original timeline is rendered. Use `?scheduleRenderer=legacy` to compare.

## Review checklist

- Confirm 1, 40 and 60 weeks display correctly, with no truncation.
- Verify a locked week and preferred external week retain their original CSS presentation and impact pane.
- Select several weeks in the Vue and legacy timelines and compare requirement count, affected Scouts and ready Scouts.
- Regenerate unlocked sessions and ensure locks and original Week cards remain intact.
- Verify forecast never awards Scout completion and that workbook data/reimports are unchanged.
- Check both desktop and phone widths; avoid real Scout data in browser screenshots.

## Scope discipline

This is **4E.2a**, a first independently reviewable portion of the original 4E.2. Toolbar controls and editable week cards are deferred to 4E.2b; regeneration logic to 4E.3. Do not merge the stack or production `main` without user approval.
