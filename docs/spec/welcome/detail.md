# Welcome page

## Overview

The welcome page is the page Graft opens on. Graft starts with no repo open, so the page shows which app the user is in and how to open a repo.

## Behaviour

- Graft opens on the welcome page when it starts. Its route is `/`, and the page is in `frontend/src/pages/welcome/`.
- The page shows the heading "Graft".
- Under the heading it shows an "Open repo" button with a folder icon.
- The button runs the `open-repo` action, the same action the File menu's "Open repo" item runs (see [open-repo](../open-repo/detail.md)). It shows the system folder picker and opens the folder chosen on the commits page. Cancelling the picker leaves Graft on the welcome page.
- A failed run of the action is written to the log.
- The breadcrumb trail of the welcome page holds only the repo step, so it is empty while no repo is open.

## Acceptance criteria

- [x] A welcome page under `frontend/src/pages/` with its own route is shown when no repo is open, which is how Graft starts.
- [x] It shows Graft's name and a button that opens a local repo, doing the same as the "Open repo" menu item.
- [x] It replaces the About page as the start page.
- [x] Every element a smoke test touches has a `data-id`.

## Open questions

None.
