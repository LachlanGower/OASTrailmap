# Phase 4H.2a — UI/accessibility consolidation

Stacked on PR #35. This is a contained accessibility improvement, not a claim of whole-app WCAG conformance.

- Activity editor has a labelled section, required/clamped duration and an accessible confirmed-requirements group.
- Recovery action buttons refer to their explicit checkpoint/destructive-action warning.
- Original recovery confirmation, typed phrase, Cancel and keyboard actions remain available.
- New Playwright test runs on desktop and mobile, including keyboard-only activation and Cancel. CI runs domain tests and built-site validation.
- Preserve all legacy fallbacks, local-first Scout records and imported evidence without structural migration.

Further full-product tab/focus/contrast/screen-reader review remains part of the user's pre-Phase-5 functional acceptance gate.
