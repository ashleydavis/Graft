# new-window/test.sh

Smoke test of opening a new window. It starts the real app with remote control on and no repo open, chooses the File menu's New window item and checks window 2 returns ok for the remote control server's ready command and shows the welcome page with no repo open. It presses New window's shortcut CmdOrCtrl+N in window 1 and checks window 3 does the same. It reads each new window's process id from the line Ziggy writes to window 1's log for it and checks the two are different and running. It closes window 3 and checks its process ends while windows 1 and 2 keep running and showing the welcome page. Then it presses `?` and checks the keyboard shortcuts overlay lists New window with its shortcut as the platform shows it (`⌘N` on macOS and `Ctrl+N` on Linux and Windows). It reaches each new window by adding `"window": <n>` to its commands, which the remote control server reads to pick the window.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh new-window
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
