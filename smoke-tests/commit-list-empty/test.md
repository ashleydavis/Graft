# commit-list-empty/test.sh

Smoke test of the commit list in a repo with no commits. It makes a repo in its temporary directory with `git init` and makes no commit in it. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`.

It checks the commit list shows "There are no commits." and that the placeholder rows, the error row and "That is every commit." are not shown.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-list-empty
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
