# commit-columns-close/test.sh

Smoke test of the columns on the commits page closing. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the commits page, clicks the first commit, "Add the readme", checks it has no parents and that its changed file, README.md, was added with one line, and clicks README.md, so the commit details pane and the file pane are both open. It closes the file pane and checks it has gone while the commit details pane stays. It then closes the commit details pane and checks it has gone while the commit pane stays.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-columns-close
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
