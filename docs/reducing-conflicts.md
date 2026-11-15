# Reducing merge conflicts

A record of the merge conflicts in the Graft project during the pb:next and pb:review session of 2026-11-15, what caused them and the changes that would avoid them next time.

## The conflicts

Each line names the ticket that failed to merge, the ticket on main it clashed with and the files involved.

### First merge train (about-page-1, context-help-1, shortcuts-overlay-1, sidebar-state-1)

- about-page-1 landed.
- shortcuts-overlay-1 conflicted with context-help-1 in `frontend/src/components/app-layout.tsx`, `frontend/src/test/components/app-layout.test.ts` and `frontend/src/test/install-app-window.ts`.
- sidebar-state-1 conflicted with context-help-1 in `docs/spec/layout/detail.md`, `app-layout.tsx` and `app-layout.test.ts`.
- context-help-1 merged cleanly but broke the smoke tests. Its new `git-commands` smoke test clicked the About page's Commits link, which about-page-1 had removed.

### Follow-up trains

- After main was merged into all three, context-help-1 landed. shortcuts-overlay-1 and sidebar-state-1 then conflicted with it again in the same layout files, because each had merged a main that did not yet hold context-help-1.
- shortcuts-overlay-1 landed. sidebar-state-1 conflicted with it in `docs/user-guide.md`, `app-layout.tsx` and `app-layout.test.ts`, and landed on its third conflicts pass.

### commit-explorer-2 and open-repo-1

- Both had been branched before the first train landed. commit-explorer-2 conflicted in `backend/src/lib/git-diff-tree.zig`, its Zig tests and the commits spec and testing manuals. After the merge, main's `git-commands` smoke test failed because the ticket's extra `git diff-tree --numstat` command changed the order of the commands it checks.
- open-repo-1 conflicted in 21 paths on its first train (counted on 2026-11-15), among them `CLAUDE.md`, `README.md`, `backend/src/app.zig`, `backend/src/lib/actions.zig`, `app-layout.tsx`, `frontend/src/main.tsx`, the About page and many spec and testing manual docs.
- commit-explorer-2 landed. open-repo-1 then conflicted with it in `frontend/src/pages/commits/index.tsx`, its test, `docs/architecture.md`, `docs/user-guide.md` and the commits docs.
- Before open-repo-1's conflicts pass could merge main, its worktree held an uncommitted copy of the Ziggy v0.0.25 upgrade, which `git merge` refuses to run over. The upgrade was committed on main and on the ticket's branch before the merge went ahead.

### Third round (commit-explorer-3, shortcuts-overlay-2, welcome-page-1)

- shortcuts-overlay-2 landed.
- commit-explorer-3, branched before open-repo-1 landed, conflicted in `backend/src/lib/actions.zig`, `backend/src/test/actions.test.zig`, `docs/user-guide.md`, `app-layout.tsx`, `pages/commits/index.tsx` and their tests.
- welcome-page-1 conflicted with shortcuts-overlay-2 in the open-repo spec, the open-repo and shortcuts overlay testing manuals, `docs/user-guide.md` and the shortcuts overlay smoke test's `test.md`. Its conflicts pass also had to change main's new `open-repo-shortcut` smoke test, which waited for the About page at start.
- welcome-page-1 landed. commit-explorer-3 then merged cleanly but its `commit-keys` smoke test failed, because it waited for the About page at start and Graft now starts on the welcome page.

### Last round (new-window-1, zoom-1)

- Both conflicted with commit-explorer-3 in `actions.zig`, `actions.test.zig`, `docs/architecture.md` and `app-layout.tsx`. zoom-1 also conflicted in the open-repo spec and the shortcuts overlay testing manual, and its zoom smoke tests waited for the About page.
- zoom-1 landed. new-window-1 then conflicted with it in `actions.zig`, `actions.test.zig`, `docs/architecture.md` and the open-repo spec, and landed on its next train.

## What caused them

- **Shared lists that every feature edits.** Every keyboard shortcut ticket added an entry to the action list in `actions.zig`, a handler in `AppLayout` and a method to the shared test fakes. `actions.test.zig` checks each action by its index and checks the total, so every new action changes lines another ticket also changed.
- **Shared docs that every feature edits.** `docs/user-guide.md`, `docs/architecture.md` and the open-repo spec each carry a sentence or list that names every shortcut or every menu item, so each ticket rewrote the same lines.
- **Smoke tests tied to how Graft starts.** Many smoke tests waited for `about-page` or clicked a particular link to reach a page. about-page-1 and welcome-page-1 changed the start page and the links, and every test written on the old layout broke after the merge rather than in a merge conflict.
- **Branches built from an old main.** pb:next admitted tickets in parallel, and each branch was made from main as it stood at admission. Branches waited through review and earlier trains while main moved, and some tickets went through several conflicts passes because a sibling ticket landed while their pass ran.
- **Tickets that change the same area run at once.** Tickets that each add an action, or each change the commits page, were in flight together with no dependency between them.
- **Uncommitted changes in a worktree.** A change left uncommitted in a ticket's worktree blocks `git merge main`.

## Changes that would avoid them

### In Graft's code

- Give each action its own declaration next to the feature that owns it, and build the action list from those declarations, so adding an action adds a file rather than editing a shared list.
- Check actions in `actions.test.zig` by name, with no test of the total or of an index, so a new action leaves the existing tests alone.
- Move each feature's action handler out of `AppLayout` into a hook the feature owns (for example `useOpenRepoAction`), so `AppLayout` gains one line per feature and the hooks never touch each other.
- Build the shared `window.ziggy` test fakes from one small fake per feature, so a new bridge method adds a file rather than editing `install-app-window.ts`.

### In Graft's docs

- Keep each feature's description, keys and menu items in its own spec and user guide section, and have `docs/user-guide.md` and `docs/architecture.md` link to those sections instead of listing every shortcut in one sentence.
- Leave the shortcut list to the shortcuts overlay, which is built from the action list at run time, rather than repeating it in the docs.

### In Graft's smoke tests

- Add one helper to `smoke-tests/lib/common.sh` that starts Graft and waits for its start page, and one that opens a named page through the left sidebar. Every test calls them, so a change to the start page or the links is one edit in the shared library.

### In how tickets are planned

- When `pb:plan:break` or `pb:add` creates tickets that change the same shared file or area (the action list, the layout, the start page, a shared doc), add a dependency between them so they run one after another instead of side by side.
- Order the tickets that change how Graft starts or navigates (a new start page, a moved link) before the tickets that add smoke tests, so the new tests are written against the new layout.
- Keep tickets small, so each branch lives a short time and touches few shared files.

### In how the loop runs

- Merge main into a ticket's branch as part of its Commit stage, so every branch reaches human review on top of the newest main and its evidence already covers the merge.
- Review tickets soon after they reach human review, so branches age less.
- Merge the approved tickets that touch the same area one at a time, and merge main into the next one before its train is built.
- Commit dependency upgrades and other changes on main before running pb:next, and leave no uncommitted change in a ticket's worktree.
