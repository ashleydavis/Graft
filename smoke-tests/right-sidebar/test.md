# right-sidebar/test.sh

Smoke test of the right sidebar. It starts the real app, built with the test hooks, and checks the right sidebar starts closed, with its content absent. It slides the sidebar in with the top bar's button and checks its content shows, then slides it out with the same button and checks its content is gone. The About page stays in the main content area throughout.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh right-sidebar
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
