# Keyboard shortcuts overlay

## Overview

The keyboard shortcuts overlay is a dialog over Graft's window. It is the place Graft lists its keyboard shortcuts. It is built from Ziggy's action list, so each shortcut is written only where its action is declared, and a search box filters it.

## Behaviour

- Showing and closing the overlay is Graft's Keyboard Shortcuts action, a Ziggy action named `toggle-shortcuts-overlay` with the shortcut `?`. Ziggy handles the key: pressing `?` runs the action, which shows the overlay when it is closed and closes it when it is open.
- While the focus is in a text box, such as the search box of the breadcrumb trail's drop-down, the text box types the `?` and the overlay stays closed.
- The overlay reads its shortcuts from `window.ziggy.listActions()`, which gives every action of Graft's and every standard item of its menu with its shortcut as the platform shows it (`Ctrl+O` on Linux and Windows, `⌘O` on macOS). The overlay lists each one that has a shortcut, with its label and its keys, in the order Ziggy lists them, so Graft's own actions come first and the list starts with Open repo's `Ctrl+O`. Any tooltip that shows a shortcut reads it from the same list.
- The shortcuts are listed in one column, which scrolls when it is taller than the overlay leaves room for.
- A search box at the top of the overlay has the focus when the overlay opens. Typing there filters the list to the shortcuts whose label or keys contain the text, ignoring case. When none matches, the overlay says no shortcut matches the text. The search is cleared each time the overlay closes.
- The search box is a text box, so `?` typed there types a question mark and the overlay stays open. Escape closes the overlay.
- When Ziggy cannot give the action list, the overlay shows why in place of the list.
- A click outside the overlay leaves it open.
- The overlay shows over every page. The page behind it is dimmed.
- The overlay shows the heading "Keyboard shortcuts", then the search box, then the shortcuts.

## Acceptance criteria

- [x] `?` shows the keyboard shortcuts overlay.
- [x] `?` or Escape closes it.
- [x] `?` typed in a text box types the character and leaves the overlay closed.
- [x] Showing and closing the overlay is a Ziggy action with the shortcut `?`, so Ziggy handles the key.
- [x] The overlay and any tooltip read the shortcuts from `window.ziggy.listActions()`. No shortcut is written into the overlay itself.
- [x] The overlay shows each action's label and shortcut and lists Ctrl+O first.
- [x] The shortcuts are listed in one column that scrolls when it is long.
- [x] A search box at the top of the overlay has the focus when it opens. Typing filters the shortcuts to those whose label or keys match.
- [x] While typing in the search box, `?` types a question mark and does not close the overlay. Escape still closes it.

## Open questions

None.
