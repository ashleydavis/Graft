# page-links/test.sh

Smoke test of the links between the About page and the commits page, which shows the router works. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app its path through `GRAFT_TEST_REPO`, so the commits page has a repo to read. It starts the real app with remote control on, follows the left sidebar's "Commits" link from the About page to the commits page, then the commits page's link back to the About page. It checks that each page shows.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh page-links
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
