# breadcrumb-drop-downs/test.sh

Smoke test of the breadcrumb trail's drop-downs. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the About page with the left sidebar's About link. It opens the trail's page step, checks it lists Help and About and picks Help, which opens the Help page. On the Help page it picks Help, which only closes the drop-down, then About, which opens the About page. On the About page it picks About, which only closes the drop-down. The repo step and the repo explorer page's step are plain text, so this test uses only the page step of the About and Help pages.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh breadcrumb-drop-downs
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
