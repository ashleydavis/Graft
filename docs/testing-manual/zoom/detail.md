# Zoom: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, build and run Graft with the command for your platform:

```bash
bun run linux
```

```bash
bun run windows
```

```bash
bun run macos
```

On macOS, press Command in place of Ctrl in every step.

## Steps

1. Wait for Graft's window to open on the welcome page.
2. Press Ctrl+Plus. Check everything in the window gets bigger.
3. Press Ctrl+= (the same key without Shift). Check everything gets bigger again.
4. Press Ctrl+Minus. Check everything gets smaller by one step.
5. Press Ctrl+0. Check the window is back to its normal size.
6. Open the View menu. Check it lists Zoom In, Zoom Out and Actual Size, each with its keys. Choose Zoom In and check everything gets bigger. Choose Zoom Out and check it is back to its normal size.
7. Press `?`. Check the keyboard shortcuts overlay lists Zoom In, Zoom Out and Actual Size with their keys. Press Escape.
8. Press Ctrl+Plus twice, then close the window. Open Graft again and check it starts zoomed in by two steps.
9. Press Ctrl+0, close the window and open Graft again. Check it starts at its normal size.
10. Close the window.

## Expected result

Ctrl+Plus and Ctrl+= zoom in, Ctrl+Minus zooms out and Ctrl+0 returns to the normal size, as the View menu's items do. The overlay lists the zoom actions. Graft starts at the zoom it was left at.
