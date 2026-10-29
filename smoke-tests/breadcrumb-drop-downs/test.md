# breadcrumb-drop-downs/test.sh

Smoke test of the breadcrumb trail's drop-downs. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app its path through `GRAFT_TEST_REPO`. It starts the real app, built with the test hooks, on the About page. It opens the trail's page step, checks it lists Help and About and picks Help, which opens the Help page. On the Help page it picks Help, which only closes the drop-down, then About, which opens the About page. On the About page it picks About, which only closes the drop-down. The repo step and the commits page's step are plain text, so this test uses only the page step of the About and Help pages.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh breadcrumb-drop-downs
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
