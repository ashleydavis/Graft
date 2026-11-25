# Help pane in the right sidebar

## Overview

Graft shows help about what the user is working in, beside it, so a user learns what each pane shows and how to use it without leaving it. The right sidebar holds a pane headed "Help" under the Git commands panel (see [git-commands](../git-commands/detail.md)), with help for the selected pane or page.

## Behaviour

- The selected pane or page is the active pane while the repo explorer page shows a repo (the pane the keys act on, see [keys](../../repo-explorer/keys/detail.md)) and the page shown on every other page. The layout keeps it as one value, worked out by `selectedView` in `frontend/src/lib/selected-view.ts` from the page shown, the open repo and the active pane, which the repo explorer page sets through `ActivePaneContext`.
- The Help pane shows whenever the right sidebar is open, under the Git commands panel and set off from it by a line. It is headed "Help" with the question mark icon, laid out and coloured with the same Graft style guide tokens as the Git commands panel, in the light and dark themes. It scrolls with the rest of the right sidebar's content.
- On the repo explorer page it shows the active pane's name, what the pane shows, the keys that work in the pane, each drawn as key caps as the Help page and the keyboard shortcuts overlay draw them, with what they do there, then what a click does in the pane. Only the keys that do something in the pane are listed. There is help for each pane: the repo details pane, the commit pane, the commit details pane, the file pane, the changes pane and the changes pane's file pane.
  - Repo details pane: Up and Down, Right, Enter and Escape. A click on Commits or Commit, or anywhere in the pane.
  - Commit pane, commit details pane and changes pane: Up and Down, Left, Right, Enter and Escape. A click on a row, on the commit pane's "…" refs button, on the commit details pane's close button, on the changes pane's stage buttons and Commit button, or anywhere in the pane.
  - File pane and the changes pane's file pane: Left and Escape. A click on the close button, or anywhere in the pane.
- When another pane becomes active, by Left, Right, Enter, Escape or a click, the Help pane shows that pane's help at once.
- On every other page it shows the page's name and the Help page's text for the page (see [help](../../help/detail.md)): the welcome page, the repo explorer page with no repo open, the Help page and the About page. A page's help is its name and its text alone.
- On a path with no page of its own it shows "There is no help for this page."
- The help text for each pane and page is written in one place, `frontend/src/lib/context-help.ts`. The Help page's Pages section and the Help pane both read the page descriptions from it, so the two never differ.

## Acceptance criteria

- [x] The right sidebar shows a Help pane under the Git commands panel, headed "Help", whenever the sidebar is open.
- [x] On the repo explorer page the Help pane shows the active pane's name, what it shows and the keys and clicks that work in it.
- [x] There is help for each pane: the repo details pane, the commit pane, the commit details pane, the file pane, the changes pane and the changes pane's file pane.
- [x] When another pane becomes active, by Left, Right, Enter, Escape or a click, the Help pane shows that pane's help at once.
- [x] On every other page the Help pane shows the page's name and the Help page's text for it.
- [x] The help text for each pane and page is written in one place in the frontend, which the Help page and the Help pane both read.
- [x] Keys in the help text are drawn as key caps.
- [x] The Help pane follows the Graft style guide's tokens in the light and dark themes and scrolls with the rest of the right sidebar's content.

## Open questions

None.
