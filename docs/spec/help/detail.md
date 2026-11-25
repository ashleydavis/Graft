# Help page

## Overview

The Help page shows a user how to find their way around Graft: what each of its pages is for and the ways to move between them. It is on the router beside the About and repo explorer pages.

## Behaviour

- The Help page's path is `/help`.
- The left sidebar's "Help" link opens it. So does the "Help" entry of the breadcrumb trail's drop-down on the About page.
- The page shows the heading "Help" and under it: "Graft shows one page at a time in the middle of its window. These are its pages and the ways to move between them."
- Under that it shows the section heading "Pages" and a list of Graft's pages, each with what it is for:
  - "Welcome": "The page Graft starts on. Its Open repo button opens a local Git repo."
  - "Repo explorer": "Shows the open repo. Its Commits link lists the repo's commits."
  - "Help": "This page."
  - "About": "What Graft is, its version and where to find out more."
- The pages and what each is for are read from `PAGE_HELP` in `frontend/src/lib/context-help.ts`, which the right sidebar's Help pane also reads (see [help-pane](../layout/help-pane/detail.md)), so the two never differ.
- Under that it shows the section heading "Moving between pages" and a list of the ways to move between them, each with how it works:
  - "Left sidebar": "Repo explorer is at the top while a repo is open. Help and About are at the bottom. The menu button at the left of the top bar shrinks the sidebar to its icons and expands it again."
  - "Breadcrumb trail": "The top bar shows the open repo and the page you are on. On the Help and About pages, click the page's name to switch between them."
  - "File menu": "Open repo opens a local Git repo in the repo explorer. New window opens another Graft window on the welcome page."
  - "Keyboard": "Press `?` to list Graft's keyboard shortcuts, such as the ones that open a repo and return to the repo explorer." The `?` is drawn as a key cap, as the keyboard shortcuts overlay draws its keys.
- The Keyboard entry names `?` alone and leaves the other keys to the keyboard shortcuts overlay, which shows each in the platform's own form, Ctrl on Linux and Windows and Cmd on macOS, so the Help page's text is right on every platform.
- The page shows the heading, the line under it and the Pages and Moving between pages sections only.
- The page is laid out as the About page is. Its type, colours and spacing come from the Graft style guide's design tokens: the heading is the page title size, each section heading is the section heading size, each entry's name is in the text colour at the medium weight and its text is under it in the muted text colour. The page follows the light or dark theme Graft is in.

## Acceptance criteria

- [x] A Help page exists on the router beside the About and repo explorer pages.
- [x] The page shows the heading "Help" and says how to move between Graft's pages.
- [x] The left sidebar links to the Help page.
- [x] The page lists Graft's pages, the welcome page, the repo explorer, Help and About, with what each is for.
- [x] The page explains each way to move between the pages: the left sidebar, the breadcrumb trail, the File menu and the keyboard shortcuts overlay's `?` key.
- [x] The page's layout, type and colours follow the Graft style guide in the light and the dark theme.

## Open questions

None.
