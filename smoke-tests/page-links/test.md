# page-links/test.sh

Smoke test of the links between the About page and the repo explorer page, which shows the router works. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on, on the welcome page. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, so the repo explorer page has a repo to read, then follows the left sidebar's "Repo explorer" link to the repo explorer page, then the repo explorer page's link back to the About page. It checks that each page shows.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh page-links
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
