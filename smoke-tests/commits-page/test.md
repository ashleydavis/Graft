# commits-page/test.sh

Smoke test of the commits page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, adds a commit that only this run's repo has and gives the app the repo's path through `GRAFT_TEST_REPO`. It starts the real app, built with the test hooks, follows the About page's link to the commits page and checks that the page lists the repo's commits, the run's own commit first.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commits-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
