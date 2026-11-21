# left-sidebar/test.sh

Smoke test of the left sidebar. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, so the repo explorer page has a repo to read, and checks the left sidebar starts expanded with the names of its Repo explorer, Help and About links showing. It follows each link, then minimises the sidebar with the top bar's menu button and checks the names are gone while the links stay. It follows each link again while the sidebar is minimised, then expands it with the same button and checks the names show again.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh left-sidebar
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
