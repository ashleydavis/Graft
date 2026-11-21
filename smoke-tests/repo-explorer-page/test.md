# repo-explorer-page/test.sh

Smoke test of the repo explorer page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, adds a commit that only this run's repo has and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and checks the repo explorer page shows the repo details pane alone, headed "Repo", with the repo's name, its path and the Commits link. It clicks the Commits link, through `open_commit_pane`, and checks the commit pane opens to its right and lists the repo's commits, the run's own commit first.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh repo-explorer-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
