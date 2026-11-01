# left-sidebar/test.sh

Smoke test of the left sidebar. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app its path through `GRAFT_TEST_REPO`, so the commits page has a repo to read. It starts the real app, built with the test hooks, and checks the left sidebar starts expanded with the names of its Commits and About links showing. It follows both links, then minimises the sidebar with the top bar's menu button and checks the names are gone while the links stay. It follows both links again while the sidebar is minimised, then expands it with the same button and checks the names show again.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh left-sidebar
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
