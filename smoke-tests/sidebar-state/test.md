# sidebar-state/test.sh

Smoke test of Graft remembering its sidebars. It starts the real app with remote control on and no repo open, and checks by the About link's name that the left sidebar starts expanded and the right sidebar closed. It minimises the left sidebar and opens the right sidebar with the top bar's buttons, and waits until Graft's state file holds `sidebar.left.minimised` and `sidebar.right.open` as `true`. It starts Graft again on the same state file and checks the left sidebar is minimised and the right sidebar is open. It then expands the left sidebar and closes the right sidebar, waits until the state file holds both as `false`, starts Graft again and checks the left sidebar is expanded and the right sidebar closed.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh sidebar-state
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
