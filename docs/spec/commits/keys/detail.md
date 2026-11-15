# Keyboard shortcuts for the commit explorer

## Overview

The commit explorer is the commits page's columns: the commit pane, the commit details pane and the file pane (see [columns](../columns/detail.md)). Its keys work as in the column view of macOS Finder: Left and Right move between the panes, Up and Down move between the items in a pane, Enter opens and Escape goes back. Ctrl+1 (Cmd+1 on macOS) returns to the commit explorer from any page.

## Behaviour

- One of the open panes is the active pane, which the keys act on. Its border is in the theme's primary colour. The commit pane is active when the commits page opens.
- Each pane's items, the commits in the commit pane and the changed files in the commit details pane, are MaterialUI `ListItemButton`s. The selected item has `selected` set, so it shows MaterialUI's own selection styling. No item is selected when the commits page opens. The title of the commit whose details are open is bold.
- Up and Down move the selection to the item above or below in the active pane. At the first or last item the selection stays where it is. With no item selected, either key selects the first item. In the file pane, which shows a diff, Up and Down leave the selection as it is.
- Right makes the pane to the right active, when there is one. Left makes the pane to the left active, when there is one.
- Enter on a selected commit opens its details in the commit details pane without a file pane and makes the commit details pane active. Enter on a selected file opens its diff in the file pane and makes the file pane active. With no item selected, Enter leaves the panes as they are.
- Escape closes the rightmost pane and makes the pane to its left active. Closing the commit details pane keeps the commit selected. With only the commit pane open, Escape leaves it open and active.
- Clicking a commit selects it, opens its details and makes the commit pane active. Clicking a changed file selects it, opens its diff and makes the commit details pane active. Each close button closes its pane and makes the pane to its left active when the closed pane was active.
- The commits page takes the keyboard focus when it opens, so the keys work at once after the left sidebar's link or Ctrl+1 opened it.
- The arrow keys, Enter and Escape are not Ziggy shortcuts. The commits page handles them itself while it is shown and keeps them from the rest of the page, so an arrow key does not also scroll the page. It leaves them alone while a text box, link, button, menu or dialog has the focus or Ctrl, Alt or Cmd is held.
- Returning to the commit explorer is Graft's Commit Explorer action, a Ziggy action named `open-commit-explorer` with the shortcut `CmdOrCtrl+1`. Its handler opens the commits page. Ziggy runs it from any page, also while a text box has the focus, because the shortcut holds Ctrl or Cmd.

## Acceptance criteria

- [x] Up and Down move the selection to the item above or below in the active pane.
- [x] Right makes the pane to the right active, when there is one. Left makes the pane to the left active.
- [x] Enter on a commit opens its details in the pane to the right, and Enter on a file opens its diff in the pane to the right. The new pane becomes active.
- [x] Escape closes the rightmost pane and makes the pane to its left active. With only the commit list open it does nothing.
- [x] Each pane's items are MaterialUI `ListItemButton`s, and the selected one has `selected` set.
- [x] The active pane is marked with a border in the theme's primary colour.
- [x] Clicking an item selects it and makes its pane active.
- [x] Ctrl+1 returns to the commit explorer from any page. It is a Ziggy action with the shortcut `CmdOrCtrl+1`.
- [x] The arrow keys, Enter and Escape are handled by the commit explorer page while it is shown, are not Ziggy shortcuts, and are ignored while a text box has the focus.

## Open questions

None.
