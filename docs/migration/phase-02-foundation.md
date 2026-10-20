# Phase 2 — parallel Vue/Vite/TypeScript foundation

**Status:** In progress on \`migration/phase-02-foundation\`. No end-user feature is migrated yet.

## Approach

- The shipped site remains \`index.html\`, \`css/\`, \`js/\`, \`data/\` and \`docs/\`.
- A **separate, optional** \`vue-preview.html\` mounts a Vue component and fetches the *public* OAS requirement dataset. It **never** reads or writes browser Scout records.
- \`vite.config.ts\` intentionally bundles only the preview entry and copies the legacy site **unmodified** into \`dist/\`. This keeps the current site identical in the interim while testing Vite's asset path handling.
- The original home page and legacy script order cannot change unnoticed; Phase 1 baseline contracts run on this branch too.
- The branch builds locally and on GitHub Actions; it does **not** publish to production GitHub Pages.

## Commands

Requires Node.js 22:

\`\`\`bash
npm install
npm run check:baseline
npm run typecheck
npm run dev
# visit http://localhost:5173/ (unchanged app)
# visit http://localhost:5173/vue-preview.html (opt-in Vue foundation preview)

npm run build
npm run check:dist
npm run preview
\`\`\`

The build outputs \`dist/index.html\` and the untouched legacy directories as well as \`dist/vue-preview.html\` and bundled Vue assets.

To simulate repository-path hosting:

\`\`\`bash
OAS_PUBLIC_BASE=/OASTrailmap/ npm run build
\`\`\`

This is an **output-only** build setting. It does not switch GitHub Pages, and there is no deployment action on migration branches.

## Verification gates

1. TypeScript + Vue preview compiles under the pinned toolchain.
2. Every legacy file listed in the copy manifest is **byte-for-byte identical** in \`dist/\` to the source.
3. \`npm run check:baseline\` still passes.
4. Chromium tests the unchanged built site and a separate Vue preview in desktop/mobile sizes.
5. Verify the preview works both under \`/\` and the real repository base path.
6. Record any remaining gaps; leave the PR as draft until CI evidence is reviewed.

## What this phase intentionally does not do

No conversion of legacy functions, no changes to requirements IDs or wording, no storage migration, no new navigation, no redesign, no auto-approval of existing application requirements. Vue components will progressively take ownership later in Phase 4 once business logic extraction is tested in Phase 3.
