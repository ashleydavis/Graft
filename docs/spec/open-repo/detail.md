# Open repo

## Overview

A user opens a local repo by choosing its folder. Graft starts with no repo open, so opening a repo is how the user reaches the commit explorer.

## Behaviour

- Graft starts with no repo open, on the About page.
- The File menu has an "Open repo" item, above "Close Window". It runs the `open-repo` action, declared in `backend/src/lib/actions.zig`, so a shortcut or a button can run the same action.
- The action shows the system folder picker, titled "Open repo", through Ziggy's folder dialog native call. The picker runs in the backend's `pick-repo-folder` task, because it waits for the user.
- Choosing a folder opens it in the commit explorer: the commits page shows, listing the folder's commits. The folder is opened in place of any repo open before. Graft opens any folder chosen. When the folder is outside a Git repo, the commits page shows why git could not read it.
- Cancelling the picker leaves the page and the open repo as they were.
- The open repo's path is kept in `RepoContext` in `frontend/src/components/repo-context.tsx`, with its provider `RepoProvider` and hook `useRepo`, provided at the root of the app above the router's pages. The layout and the pages read it, so the repo stays loaded while the user moves between pages. The path lasts as long as the window, so each run of Graft starts with no repo open.
- While no repo is open, the left sidebar's "Commits" link and the About page's "Commits" link are hidden and the breadcrumb trail starts with the page.
- A smoke test gives the app its own test repo through `GRAFT_TEST_REPO`, which the app reads only when it was started with `--remote-control`. The app starts with that repo open.

## Acceptance criteria

- [x] The File menu has an "Open repo" item that shows the system folder picker, through Ziggy's folder dialog native call.
- [x] Choosing a folder opens it in the commit explorer in place of the repo shown before. There is no check that the folder is a Git repo.
- [x] "Open repo" is a Ziggy action named `open-repo`, declared in `backend/src/lib/actions.zig`.
- [x] The open repo's path is kept in `RepoContext` in `frontend/src/components/repo-context.tsx`, with its provider `RepoProvider` and hook `useRepo`, provided at the root of the app above the router's pages.
- [x] The repo stays loaded while the user moves between pages. The path is not saved between runs.
- [x] Graft starts with no repo open, on the About page.
- [x] While no repo is open, the left sidebar's "Commits" link is hidden.
- [x] Smoke tests give the app their own test repo with `GRAFT_TEST_REPO`.

## Open questions

None.
