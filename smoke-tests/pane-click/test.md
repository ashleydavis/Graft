# pane-click/test.sh

Smoke test of making a repo explorer pane active by clicking it. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and drives the app through the remote control server as a user does.

It opens the repo explorer from the left sidebar, opens the commit pane with the repo details pane's Commits link, clicks the newest commit, "Change the note", and clicks its changed file, notes.txt, which opens the file pane with the commit details pane active. It clicks the file pane's title bar, then presses Left twice, Down and Enter, and checks the commit details pane shows "Add the notes" and no changes pane opened. That holds only when the click made the file pane active: Left twice then reaches the commit pane, where Down selects the second commit. Had the commit details pane stayed active, Left twice would reach the repo details pane, where Down and Enter open the changes pane.

It then clicks the repo details pane's empty space, presses Down and Enter and checks the changes pane opens. That holds only when the click made the repo details pane active, where Down selects the Changes link. Had the commit details pane stayed active, Down and Enter would open a file's diff instead.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh pane-click
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
