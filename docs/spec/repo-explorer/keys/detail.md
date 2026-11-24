# Keyboard shortcuts for the repo explorer

## Overview

The repo explorer is the repo explorer page's columns: the repo details pane (see [repo-details](../repo-details/detail.md)), the commit pane, the commit details pane and the file pane (see [columns](../columns/detail.md)), or the changes pane and its file pane (see [changes](../changes/detail.md)). Its keys work as in the column view of macOS Finder: Left and Right move between the panes, Up and Down move between the items in a pane, Enter opens and Escape goes back. Ctrl+1 (Cmd+1 on macOS) returns to the repo explorer from any page.

## Behaviour

- One of the open panes is the active pane, which the keys act on. Its border is in the theme's primary colour. The repo details pane is active when the repo explorer page opens.
- Each pane's items, the Commits and Commit links in the repo details pane, the commits in the commit pane, the changed files in the commit details pane and the rows of the changes pane, are MaterialUI `ListItemButton`s. The selected item has `selected` set, so it shows MaterialUI's own selection styling. No item is selected when the repo explorer page opens or a pane opens. The title of the commit whose details are open is bold.
- Up and Down move the selection to the item above or below in the active pane. At the first or last item the selection stays where it is. With no item selected, either key selects the first item. In the changes pane they move through the Unstaged rows, then the Staged rows. In the file pane, which shows a diff, Up and Down leave the selection as it is. In the commit pane they move through every commit read so far, across the pages, and the list scrolls by the least amount that brings the selected commit's row into view. Moving the selection near the last commit read scrolls the list there, which reads the next page, so Down reaches the repo's first commit.
- The selected file in the commit details pane is always in view. When it becomes selected, from the first file as the list opens or as Up and Down move through a list longer than the pane, the pane scrolls by the least amount that shows its whole row.
- While a commit's details are open, Up and Down in the commit pane also open the newly selected commit, so the commit details pane shows it at once. The commit pane stays active and any file pane closes. At the first or last commit the details stay as they are.
- With the commit details pane active and no file pane open, as after Enter on a commit, a click in the commit details pane or Right, Up and Down open the commit above or below, as they do in the commit pane, so the commit details pane shows it at once. The commit details pane stays active. At the first or last commit the details stay as they are.
- While a file's diff is open in the file pane, Up and Down in a commit's changed files also show the newly selected file's diff in the file pane at once, without Enter, and the commit details pane stays active.
- Right makes the pane to the right active, when there is one. Left makes the pane to the left active, when there is one.
- Enter on the selected Commits link opens the commit pane and makes it active. Enter on a selected commit opens its details in the commit details pane with its file pane closed and makes the commit details pane active, also when Up or Down already opened them. Enter on a selected file, in the commit details pane or the changes pane, opens its diff in the file pane and makes the file pane active. Enter on the selected Commit link opens the changes pane and makes it active. With no item selected, Enter leaves the panes as they are.
- Escape closes the rightmost pane and makes the pane to its left active. Closing the commit details pane keeps the commit selected. Closing the commit pane keeps the Commits link selected, and closing the changes pane keeps the Commit link selected. With only the repo details pane open, Escape leaves it open and active.
- Clicking the Commits link selects it, opens the commit pane and makes the repo details pane active. Clicking a commit selects it, opens its details and makes the commit pane active. Clicking a changed file selects it, opens its diff and makes the commit details pane active. Each close button closes its pane and makes the pane to its left active when the closed pane was active.
- Clicking anywhere in a pane, its title bar, an item, a button or its empty space, makes it the active pane, in every pane: the repo details pane, the commit pane, the commit details pane, the changes pane and the file pane. A click on an item or a button still does what it does, and where that sets the active pane itself, as a click on a commit or a close button does, that pane is the one left active. A click in the space between the panes leaves the active pane as it is.
- The repo explorer page takes the keyboard focus when it opens, so the keys work at once after the left sidebar's link or Ctrl+1 opened it.
- The arrow keys, Enter and Escape are the repo explorer page's own keys, apart from Ziggy's shortcuts. The page handles them itself while it is shown and keeps them from the rest of the page, so an arrow key moves the selection and leaves the page's scroll as it is. It leaves them alone while a text box, link, button, menu or dialog has the focus or Ctrl, Alt or Cmd is held.
- Returning to the repo explorer is Graft's Repo Explorer action, a Ziggy action named `open-repo-explorer` with the shortcut `CmdOrCtrl+1`. Its handler opens the repo explorer page. Ziggy runs it from any page, also while a text box has the focus, because the shortcut holds Ctrl or Cmd.

## Acceptance criteria

- [x] Up and Down move the selection to the item above or below in the active pane.
- [x] Keyboard selection works across pages of commits, and the selected row scrolls into view.
- [x] When the commit details pane's file list opens, the first file is selected and in view.
- [x] Moving with Up and Down scrolls the commit details pane so the selected file is always in view.
- [x] While a commit's details are open, Up and Down in the commit pane select the next commit and the commit details pane shows it at once. Enter then makes the commit details pane active.
- [x] With the commit details pane active and no file pane open, Up and Down open the commit above or below and the commit details pane stays active.
- [x] While a file's diff is open, Up and Down in the commit's changed files select the file above or below and the file pane shows its diff at once. Enter then makes the file pane active.
- [x] Right makes the pane to the right active, when there is one. Left makes the pane to the left active.
- [x] Enter on a commit opens its details in the pane to the right, and Enter on a file opens its diff in the pane to the right. The new pane becomes active.
- [x] Escape closes the rightmost pane and makes the pane to its left active. With only the repo details pane open it leaves that pane open and active.
- [x] Each pane's items are MaterialUI `ListItemButton`s, and the selected one has `selected` set.
- [x] The active pane is marked with a border in the theme's primary colour.
- [x] Clicking an item selects it and makes its pane active.
- [x] Clicking anywhere in a pane (title bar, body, empty space) makes it the active pane, in every pane, the changes pane among them. A click on an item or button still does what it did.
- [x] Ctrl+1 returns to the repo explorer from any page. It is a Ziggy action with the shortcut `CmdOrCtrl+1`.
- [x] The repo explorer page handles the arrow keys, Enter and Escape itself while it is shown, apart from Ziggy's shortcuts. It leaves them to a text box that has the focus.

## Open questions

None.
