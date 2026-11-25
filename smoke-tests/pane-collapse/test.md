# pane-collapse/test.sh

Smoke test of collapsing a pane on the repo explorer page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`. It clicks the commit pane's collapse button and checks the pane is replaced by its strip with "Commits" down it, then clicks the strip's restore button and checks the commit list is back. It then presses C, which collapses the active pane, the commit pane, checks the strip shows again, presses C once more and checks the commit list is back.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh pane-collapse
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
