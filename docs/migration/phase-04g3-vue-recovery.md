# Phase 4G.3 — Recovery controls and checkpoint safety

Stacked on 4G.2 / PR #34. The reset/recovery action controls are rendered by Vue, but the original handlers, preview/apply/cancel paths, file backup/export and storage format remain authoritative. The original controls stay mounted and hidden so the Vue controls can delegate to their existing confirmation flow. `?recoveryRenderer=legacy` restores the original controls.

## Safety fix
Previously, `dataCheckpoint` swallowed localStorage quota/write failures, potentially allowing a destructive reset or import to continue without its claimed checkpoint. It now throws on failure. Import apply stops before mutation, and recovery confirmation does not report success when snapshot creation was aborted.

## Scope
- Clear achievements, clear roster, clear schedule, restore default requirements, factory reset buttons.
- Typed phrase confirmation, second confirmation, full backup link, checkpoint failure safety, import preview, and original IDs are retained.
- Recovery confirmation and rollback/history panels remain original implementations to avoid introducing a second storage writer.
- No Scout data, personal names or backup contents are passed to Vue.

## Test gates
- `npm ci`, `npm test`, `npm run build`, `npm run check:dist`.
- Chromium parity on desktop/mobile under both Vite and built `dist`; ensure Vue controls invoke existing review, Cancel writes nothing, and recovery dialog is present.
- Inject a synthetic localStorage failure for checkpoint creation; assert destructive schedule reset is rejected, schedule preserved, and success toast absent.
- Confirm unchanged Scout state following unrelated schedule reset; data import remains selective.
- Manual Phase 5: full/selective backup, restore, corrupted input, quota failures, original Excel reimport, snapshot history, rollback, factory reset and long-term preservation.

No merge to `main`; draft until complete acceptance.
