# Phase 4 stacked review chain

The Phase 4 conversion is intentionally stacked. Review the changes in **order**:

| PR | Branch | Base | Review objective | Completion gate |
| --- | --- | --- | --- | --- |
| 4B | `migration/phase-04b-vue-navigation` | `migration/trunk` | Vue navigation shell; seven legacy-backed workspaces | Navigation/browser parity + manual check |
| 4C | `migration/phase-04c-trailmap` | 4B | Trailmap and Scout progress work | Progress and original workbook/import fidelity |
| 4D | `migration/phase-04d-tree-mapper` | 4C | Master/custom tree graph editing work | Cycles, snapshots and tree-edit UI fidelity |
| 4E | `migration/phase-04e-scheduler` | 4D | Scheduler and conditional forecast work | Lock, repeat, location/theme and week review fidelity |
| 4F | `migration/phase-04f-activity-studio` | 4E | Activity editor and requirement mapping work | Safe edit/save/export and UI fidelity |
| 4G | `migration/phase-04g-data-state` | 4F | Import/export, rollback and recovery work | Restoration with no data loss |
| 4H | `migration/phase-04h-help-cleanup` | 4G | Help & Design Vue UI and final legacy cleanup work | Help/search UI parity; remove legacy only after other features pass |

**These branches and PRs are not an assertion that each whole workspace is complete.** Each can contain small, safe increments. Detailed tasks and residual legacy modules must be documented in each PR; no blanket acceptance of future functionality.

In the morning, the latest branch includes all preceding unmerged changes, so it is a useful **combined preview**, not a replacement for reviewing each PR. A change to a parent branch after descendants exist must be carried forward to descendants; do not squash/merge stacked PRs out of order.

## Running any review branch

```sh
git fetch --all
git switch <branch-name>
npm ci
npm run dev
```

Compare with `?navRenderer=legacy` and `?appReqRenderer=legacy` when investigating the new navigation and Application Requirements. Prefer a separate browser profile when testing fictional Scout data; the localhost origin shares localStorage across branches.

## Production safety

- `main` and GitHub Pages remain unchanged pending separate Phase 6 approval.
- Keep all stacked PRs in **Draft** until automated checks and explicit user reviews succeed.
- No real Scout records, source Excel workbook or backups are committed to GitHub.
- Changes requiring real data or risky imports must have an explicit backup, preview, rollback and manual regression gate.
