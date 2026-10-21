# Phase 4D — Skill Tree Mapper (first contract slice)

**Stack base:** `migration/phase-04c-trailmap`. Includes unmerged 4B/4C changes.

This slice adds pure TypeScript models for **master versus custom per-tree links**, mandatory dependency cycle rejection, self/dangling edge rejection and descendant traversal. Advisory/suggested links **do not** become mandatory. Source requirements and existing tree graph metadata are never modified by a read.

Automated tests use a three-skill fictional graph, including custom overrides. Run `npm ci && npm test` on this branch.

**Not yet migrated:** the live drag-and-drop tree canvas, link editor, tag library, tree snapshots/history, rollback, YAML import/export, graph path visuals or original `js/studio.js` runtime. They must be migrated incrementally with golden-master browser tests before 4D can be called complete.

Morning review: `npm run dev` displays the legacy mapper, which must remain intact. **Draft starting slice; not whole mapper acceptance.** No Scout/private data or production changes.
