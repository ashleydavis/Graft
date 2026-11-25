# commit-columns-close/test.sh

Smoke test of the columns on the repo explorer page closing. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the repo explorer page, opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`, clicks the first commit, "Add the readme", clicks the commit details pane's "Commit details" row and checks the "Commit details" pane says the commit has no parents, closes that pane with its close button and checks it has gone while the commit details pane stays, checks the commit's changed file, README.md, is listed and clicks README.md, so the commit details pane and the file pane are both open. It closes the file pane and checks it has gone while the commit details pane stays. It then closes the commit details pane and checks it has gone while the commit pane stays. It clicks the commit and README.md again, so the commit details pane and the file pane are open once more, then closes the commit pane with its close button and checks the commit pane, the commit details pane and the file pane have all gone while the repo details pane stays.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-columns-close
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
