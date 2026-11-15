# Zoom

## Overview

A user makes everything in Graft's window bigger or smaller with the zoom keys or the View menu, and Graft starts at the same zoom the next time it opens.

## Behaviour

- Zoom In, Zoom Out and Actual Size are Graft's actions, declared in `backend/src/lib/actions.zig` as `zoom-in-step`, `zoom-out-step` and `zoom-actual-size`, with the shortcuts `CmdOrCtrl+Plus`, `CmdOrCtrl+Minus` and `CmdOrCtrl+0`. Ziggy keeps the names `zoom-in`, `zoom-out` and `zoom-reset` for its standard actions.
- The View menu's Zoom In, Zoom Out and Actual Size items run the actions. Ziggy shows each action's label and shortcut on the item in the platform's own form.
- Ziggy runs a `Plus` shortcut on `=` too, so Ctrl+= zooms in as Ctrl+Plus does, without Shift. On macOS the keys are Command+Plus, Command+=, Command+Minus and Command+0.
- The actions' handlers are in the frontend (`frontend/src/components/page-zoom.ts`). Each sends the backend's `zoom` message, which has the native app run its own `zoom-in`, `zoom-out` or `zoom-reset` action. The native app's zoom changes the size of everything in the window by 0.1 a step.
- Zoom In stops at 5 and Zoom Out stops at 0.3, the limits every platform's native app allows. At a limit, the key and the menu item leave the zoom and the state file as they are. Actual Size at the actual size leaves them as they are too.
- Each zoom saves the window's zoom level in Graft's state file, through Ziggy's state system, as `zoom.level`, such as `1.2` for two steps in.
- When Graft starts, it reads `zoom.level` and zooms the window to it. A missing value, or any value other than a number, starts at the actual size. A level between two steps goes to the nearest step and a level past a limit goes to that limit.
- Each window keeps its own zoom. When several windows of Graft are open, the level saved is the last one any window zoomed to, and the next window to start uses it.
- The keyboard shortcuts overlay lists Zoom In, Zoom Out and Actual Size from Ziggy's action list, after Graft's other actions, using the overlay as it is.

## Acceptance criteria

- [x] Ctrl+Plus and Ctrl+= zoom in, Ctrl+Minus zooms out and Ctrl+0 returns to the actual size.
- [x] The View menu's Zoom In, Zoom Out and Actual Size items do the same.
- [x] The zoom level is saved in Graft's state file, through Ziggy's state system, and used the next time Graft starts.
- [x] The zoom keys are in Ziggy's action list, and the shortcuts overlay lists them with no change to the overlay.

## Open questions

None.
