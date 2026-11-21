# New window

## Overview

A user opens another window of Graft, for example to work on a second repo or on another virtual desktop. Each window is a separate process with one window, as Graft's architecture requires.

## Behaviour

- The File menu has a "New window" item, its first item. It runs the `new-window` action, declared in `backend/src/features/new-window.zig`.
- The `new-window` action has the shortcut `CmdOrCtrl+N`: Command+N on macOS and Ctrl+N on Linux and Windows. Ziggy shows it beside the menu item in each platform's own form. Pressing it opens a new window the same way the menu item does.
- The action's frontend handler, `openNewWindow` in `frontend/src/lib/new-window.ts`, calls Ziggy's `window.ziggy.newWindow([])`. Ziggy starts the new window as a process of its own, with one window and its own backend and task queue.
- The new window gets the command line and environment of the window that started it and no arguments of its own, so it starts as Graft does: on the welcome page with no repo open.
- Closing a window ends that window's process and leaves every other window running.
- When the window cannot be started, the handler's promise rejects and Ziggy writes the error, named for the `new-window` action, to the log.
- The keyboard shortcuts overlay lists "New window" with its shortcut, from Ziggy's action list. It comes after Open repo and Keyboard Shortcuts, so the overlay still lists Open repo first.
- A smoke test reaches a new window through Ziggy's remote control server, which numbers each window in the order it connects, by adding `"window": <n>` to its commands.

## Acceptance criteria

- [x] The File menu has a "New window" item that starts a new instance of Graft with Ziggy's new window support: a separate process with one window and its own backend and task queue.
- [x] Graft adds no code of its own to start a process.
- [x] Closing one window leaves the others running.
- [x] The new window opens on the welcome page, with no repo open.
- [x] "New window" is a Ziggy action with the shortcut `CmdOrCtrl+N`, and the shortcuts overlay lists it with no change to the overlay.

## Open questions

None.
