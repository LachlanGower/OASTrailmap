# Phase 4E.2b — Vue scheduler week cards

Stacked on PR #24 / 4E.2a; this PR is intentionally draft.

## Changed
Vue now renders week cards, lock checkboxes, theme selector, capacity, requirement list, move/edit buttons, activity-file attachment input, leader review button and the existing review placeholder. Original DOM IDs, data attributes and CSS class names stay compatible.

`js/studio.js` builds a read-only view model and retains the original event handlers, scheduling algorithms, confirmation prompts, leader-review evidence writes, and localStorage format. Event listeners are attached after Vue finishes updating the DOM. Toolbar settings, schedule generation, import/export, forecast and coverage tracker remain legacy. No new interpretation of official OAS counts.

## Fallback and review
- `?scheduleWeeksRenderer=legacy` restores original week-card HTML and handlers.
- `?scheduleRenderer=legacy&scheduleWeeksRenderer=legacy` restores the original timeline and cards.
- Compare 1, 40 and 60 weeks at 1440×900 and 390×844.
- Using fictional Scouts, test week locking, theme change, capacity adjustment, move earlier, Edit skills cancellation, activity attachment, Review skills expand/save, reload, and reimport evidence preservation.
- Confirm week edit and review write only after deliberate interaction. Locked weeks must survive regeneration.
- Check the forecast remains hypothetical; no scheduled activity automatically marks completion.

**Pending:** CI/browser parity and manual visual acceptance. Never merge production `main` without explicit permission.
