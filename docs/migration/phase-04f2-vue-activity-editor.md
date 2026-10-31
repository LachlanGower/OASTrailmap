# Phase 4F.2 — Vue Activity Studio editor

Stacked from PR #31. The Vue form displays activity title, description, duration, location, tags, equipment, preparation, instructions, safety, review prompts and leader-confirmed coverage. It mirrors values into the original hidden form and dispatches to the original **Suggest**, **Save** and **Cancel** handlers. Original activity IDs, persistence, unknown fields and import/export are unchanged.

Fallback: `?activityRenderer=legacy`. The existing Activity Studio library list and Data & State exports remain authoritative. This is an editor conversion, not the 4F.3 multi-activity coverage workflow.

**Acceptance:** create/edit/cancel/reload existing activity, tags and coverage changes, suggestion override, retained IDs and unknown fields, duration/location/options, export and import parity, fictional Scout privacy, desktop/mobile layout, no automatic Scout achievements. No known browser acceptance runs have been completed for this PR.
