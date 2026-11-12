# zoom-keys/test.sh

Smoke test of Graft's zoom keys and the View menu's zoom items. It starts the real app with remote control on and presses the keys through the native app, as a user does. Ctrl+Plus and then Ctrl+= each zoom in a step, Ctrl+Minus zooms out a step and Ctrl+0 puts the zoom back to the actual size. It then chooses the View menu's Zoom In, Zoom Out and Actual Size items. After each, it waits until the area the frontend is drawn in has the size of that zoom and Graft's state file holds its zoom level at `zoom.level`. Last, it presses `?` and checks the keyboard shortcuts overlay lists Zoom In, Zoom Out and Actual Size with their keys as the platform shows them.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh zoom-keys
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
