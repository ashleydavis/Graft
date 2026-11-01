# commit-columns-close/test.sh

Smoke test of the columns on the commits page closing. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app the repo's path through `GRAFT_TEST_REPO`. It starts the real app, built with the test hooks, opens the commits page, clicks the first commit, "Add the readme" and clicks its changed file, README.md, so the commit details pane and the file pane are both open. It closes the file pane and checks it has gone while the commit details pane stays. It then closes the commit details pane and checks it has gone while the commit pane stays.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-columns-close
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
