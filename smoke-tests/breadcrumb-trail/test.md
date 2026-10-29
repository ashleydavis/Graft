# breadcrumb-trail/test.sh

Smoke test of the breadcrumb trail on each page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app its path through `GRAFT_TEST_REPO`. It starts the real app built with the test hooks and checks the trail in the top bar on the About page, then follows the left sidebar's links to the commits page and the Help page and checks the trail on each. Every trail starts with the repo's folder name (`repo`) and ends with the page's name.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh breadcrumb-trail
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
