# breadcrumb-trail/test.sh

Smoke test of the breadcrumb trail on each page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`. It starts the real app with remote control on and no repo open, and checks the welcome page's trail has no repo step. It then opens the test repo with the welcome page's Open repo button, through `open_repo_with_button`. On the About page, then on the commits and Help pages, each reached with the left sidebar's links, it checks the trail starts with the repo's folder name (`repo`) inside the window and ends with the page's name.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh breadcrumb-trail
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
