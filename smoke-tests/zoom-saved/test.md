# zoom-saved/test.sh

Smoke test of Graft remembering its zoom. It starts the real app with remote control on, presses Ctrl+Plus twice and waits until Graft's state file holds `zoom.level` as `1.2`. It starts Graft again on the same state file and checks the area the frontend is drawn in has the size it had two steps in. It then presses Ctrl+0, waits until the state file holds `1`, starts Graft again and checks it starts at the actual size.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh zoom-saved
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
