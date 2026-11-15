# shortcuts-overlay/test.sh

Smoke test of the keyboard shortcuts overlay. It starts the real app with remote control on, on a test repo of its own, opens the About page with the left sidebar's About link and presses keys through the native app as a user does. It presses `?` and checks the overlay shows its title and placeholder text, then presses `?` and checks the overlay has closed. It presses `?` again, then Escape, and checks Escape closes it. It then opens the breadcrumb trail's drop-down, whose search box has the focus, presses `?` and checks the search box typed it (the drop-down finds no page matching "?") and the overlay stayed closed.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh shortcuts-overlay
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
