# pane-resize/test.sh

Smoke test of the resize handles between the repo explorer's panes. It creates a test repo of its own, starts the real app with remote control on, opens the repo, the commit pane and the newest commit's details, gives the keyboard focus to the resize handle after the commit pane and presses Right. It checks the commit pane is 16 pixels wider and Graft's state file holds that width at `paneWidths.commits`. It starts Graft again on the same state file, opens the same panes and checks the commit pane opens at the saved width. It then double-clicks the handle and checks the commit pane is back to its starting width and `paneWidths.commits` is gone from the state file.

The smoke test keeps its state file in its own temporary directory, so each run reads and writes a file of its own.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh pane-resize
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
