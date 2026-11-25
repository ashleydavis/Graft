# breadcrumb-collapse/test.sh

Smoke test of the breadcrumb trail in a window too narrow for it. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, starts the real app with remote control on and opens the test repo with the welcome page's Open repo button, through `open_repo_with_button`. On the repo explorer page it opens the commit pane, the newest commit and its file `notes.txt`, so the trail is at its longest, and checks no step is collapsed. It then presses Ctrl+Plus, which zooms in and so leaves the trail less room, until the trail shows its collapsed step, and fails when it has not after `ZOOM_STEP_COUNT_MAX` presses. With the trail collapsed it checks the repo step, the collapsed step and the file's step are inside the window from side to side and inside the top bar from top to bottom, so the trail has not wrapped, and that the "Repo explorer" step is hidden. It clicks the collapsed step and checks its list shows "Repo explorer", then presses Escape and checks the list closes. It presses Ctrl+0, which puts the zoom back to the actual size, and checks the collapsed step goes and every step is back inside the window and the top bar. Last it opens the Help page, zooms in by the same number of steps and checks the repo step and the Help drop-down are inside the window and the top bar.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh breadcrumb-collapse
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
