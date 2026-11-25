# commit-info-pane/test.sh

Smoke test of the "Commit details" pane, which shows a commit's message and facts. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the repo explorer page and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`. It clicks the newest commit, "Change the note", and checks the commit details pane names its short hash and lists its changed file, notes.txt.

It clicks the commit details pane's "Commit details" row and checks the "Commit details" pane opens with the commit's title, its author and its full hash, and that the breadcrumb trail shows a "Commit details" step. It presses Down and checks the diff of notes.txt opens in place of the "Commit details" pane, then presses Up and checks the "Commit details" pane opens again in place of the diff. Last, it presses Escape and checks the "Commit details" pane closes and the commit details pane stays open. It then presses Down and checks the commit details pane shows the commit below, "Add the notes", which holds only when the commit details pane is the active pane.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-info-pane
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
