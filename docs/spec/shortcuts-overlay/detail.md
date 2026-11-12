# Keyboard shortcuts overlay

## Overview

The keyboard shortcuts overlay is a dialog over Graft's window. It is the place Graft lists its keyboard shortcuts. It shows placeholder text in place of the shortcuts.

## Behaviour

- Showing and closing the overlay is Graft's Keyboard Shortcuts action, a Ziggy action named `toggle-shortcuts-overlay` with the shortcut `?`. Ziggy handles the key: pressing `?` runs the action, which shows the overlay when it is closed and closes it when it is open.
- While the focus is in a text box, such as the search box of the breadcrumb trail's drop-down, the text box types the `?` and the overlay stays closed.
- Escape closes the overlay.
- A click outside the overlay leaves it open.
- The overlay shows over every page. The page behind it is dimmed.
- The overlay shows the heading "Keyboard shortcuts" and under it the placeholder text "Placeholder: Graft's keyboard shortcuts are listed here."

## Acceptance criteria

- [x] `?` shows the keyboard shortcuts overlay.
- [x] `?` or Escape closes it.
- [x] `?` typed in a text box types the character and leaves the overlay closed.
- [x] Showing and closing the overlay is a Ziggy action with the shortcut `?`, so Ziggy handles the key.
- [x] The overlay shows placeholder text in place of the shortcuts.

## Open questions

None.
