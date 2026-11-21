# Welcome page

## Overview

The welcome page is the page Graft opens on. Graft starts with no repo open, so the page shows which app the user is in and how to open a repo.

## Behaviour

- Graft opens on the welcome page when it starts. Its route is `/`, and the page is in `frontend/src/pages/welcome/`.
- The page shows Graft's mark, the branch icon the About page shows, in the accent colour.
- Under the mark it shows the heading "Graft", and under the heading the line "A desktop Git client. Open a local Git repo to start working with it." in the muted text colour.
- Under that line it shows an "Open repo" button with a folder icon.
- The mark, heading, line and button sit one under another, centred in the main content area, in the style guide's type sizes, colours and spacing in the light and the dark theme.
- The button runs the `open-repo` action, the same action the File menu's "Open repo" item runs (see [open-repo](../open-repo/detail.md)). It shows the system folder picker and opens the folder chosen on the repo explorer page. Cancelling the picker leaves Graft on the welcome page.
- A failed run of the action is written to the log.
- The breadcrumb trail of the welcome page is "Welcome" alone, as the page's title in plain text, whether or not a repo is open. The welcome page is Graft's start page, the same whichever repo is open, so its trail names only the page.
- The left sidebar's "Welcome" link, at its top, opens the welcome page from every page, so a user who has moved to the About or Help page can get back to it. The link is highlighted while the welcome page shows.

## Acceptance criteria

- [x] A welcome page under `frontend/src/pages/` with its own route is shown when no repo is open, which is how Graft starts.
- [x] It shows Graft's name and a button that opens a local repo, doing the same as the "Open repo" menu item.
- [x] It replaces the About page as the start page.
- [x] Every element a smoke test touches has a `data-id`.
- [x] It shows Graft's mark and a line describing Graft and inviting the user to open a repo to work with it.
- [x] Its layout, type and colours follow the Graft style guide in the light and the dark theme.
- [x] The left sidebar's Welcome link opens it, from the About and Help pages among others.
- [x] The breadcrumb trail shows a "Welcome" step while it is shown, with no repo step before it, even while a repo is open.

## Open questions

None.
