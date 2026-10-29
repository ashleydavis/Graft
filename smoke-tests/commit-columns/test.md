# commit-columns/test.sh

Smoke test of the columns on the commits page opening. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the app the repo's path through `GRAFT_TEST_REPO`. It starts the real app, built with the test hooks, opens the commits page and clicks the newest commit, "Change the note". It checks the commit details pane shows the commit's title, description, hash, author, committer and its changed file, notes.txt. It then clicks notes.txt and checks the file pane shows the file's path and its diff, with the commit pane still there.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-columns
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the app's test control connection and its own temporary directory through the environment, which `../lib/common.sh` reads.
