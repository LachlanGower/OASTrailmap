# 4E.2c — Scheduler toolbar Vue bridge

Stacked on PR #25. Vue displays scheduling strategy, 1–60 weeks, 1–12 requirement capacity, optional location consideration, generation/regeneration buttons, schedule import/export and preferred external week controls. Original controls remain mounted but visually hidden. Vue writes into their inputs and delegates to their original event handlers; it does not implement scheduler persistence, import validation, generation or export.

**Fallback:** `?scheduleToolbarRenderer=legacy` leaves both original toolbars visible. Combine with `?scheduleRenderer=legacy&scheduleWeeksRenderer=legacy` for a complete pre-Vue scheduler. Import uses a native File object delegated through the original file input.

**Manual/CI parity:** compare generate and regenerate (including confirmation/cancel), 1/40/60-week bounds, capacity 1/4/12, all four strategies, disabled location scoring, preferred weeks and invalid numbers, YAML/JSON import preview and cancel, export schema and mobile layouts. Confirm schedule-only changes never award Scout achievements; locked sessions survive regeneration. Confirm external weeks remain suggestions and workbook evidence is untouched.

**Status:** code change only. Build/CI and full desktop/mobile visual acceptance must be verified before relying on the preview.
