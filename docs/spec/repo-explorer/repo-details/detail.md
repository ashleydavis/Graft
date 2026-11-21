# Repo details pane

## Overview

Opening a repo shows the repo explorer page with the repo details pane as its first pane. The pane shows which repo is open and leads to the panes about the repo. Its Commits link opens the commit pane to its right, and the commit details pane and the file pane open to the right of that (see [columns](../columns/detail.md)).

## Behaviour

- The repo explorer page opens with the repo details pane alone and active, with no item selected. Opening another repo shows its repo details pane afresh.
- The pane is a rounded card headed "Repo" with the repo's name beside it in muted text, laid out as the other panes of the repo explorer are, with the Graft style guide's tokens in the light and dark themes. It never shrinks.
- It shows two labelled facts, as the commit details pane lays out a commit's facts: "Name" with the repo's folder name and "Path" with the repo's full path in the code font.
- Below the facts it shows the Commits link, a row with the commit icon and "Commits". The row is a MaterialUI `ListItemButton`, as the rows of the other panes are: it shows the hover and selected colours, and a bar on its left edge while the commit pane is open.
- Clicking the Commits link selects it, opens the commit pane to the right of the repo details pane and leaves the repo details pane active. The commit pane opens afresh, with no commit selected or open, and reads the commits.
- The keys move through the repo details pane as through the other panes (see [keys](../keys/detail.md)): Down selects the Commits link, Enter opens the commit pane and makes it active and Escape in the commit pane closes it and makes the repo details pane active.
- The repo details pane shows what Graft already holds about the repo. The right sidebar's Git commands panel lists the page's first commands once the commit pane opens and reads the commits.

## Acceptance criteria

- [x] The repo explorer is named the repo explorer in code, specs, testing manuals, user guide and UI text.
- [x] Opening a repo shows the repo explorer with a repo details pane as its first pane.
- [x] The repo details pane shows the repo's details (at least its name and path) and a Commits link.
- [x] Clicking Commits opens the commit pane to the right of the repo details pane, and the existing commit details and file panes open to its right as before.
- [x] The keyboard moves between the panes, the repo details pane among them, with the same keys as between the other panes.
- [x] The repo details pane follows the Graft style guide.

## Open questions

None.
