# Phase 4F — Activity Studio (first planning/coverage slice)

**Stack base:** `migration/phase-04e-scheduler`. All parent Phase 4 branches are included in this preview.

This slice adds pure, tested TypeScript helpers for existing Activity Studio **tag and location suggestions**, labels, reverse requirement coverage and immutable edit preparation. It never certifies a Scout or writes localStorage.

The **actual Activity Studio screen and editor remain legacy**. Pending migration work includes create/edit/delete forms, equipment/safety/instructions, confirmation of proposed requirement coverage, activity import/export and integration with the schedule. Do not treat suggested matches as automatically verified Scout accomplishments.

Run `npm ci && npm test && npm run dev`. Review with fictional activities, not private Scout records. Draft starting slice; production `main` unchanged.
