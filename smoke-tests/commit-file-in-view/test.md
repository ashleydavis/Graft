# commit-file-in-view/test.sh

Smoke test of the highlighted file in the commit details pane's file list staying in view. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then adds a newest commit, "Add many files", that adds far more files than the pane shows at once. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and presses keys through the native app as a user does.

It presses Down and Enter to open the commit pane from the Commits link, then Down and Enter to open the newest commit's details. It checks the first file's row is inside the visible part of the pane's scrolling area, with `wait_for_in_view_of`, and that it is the highlighted file, by pressing Enter and checking the file pane shows it, then Left to return to the file list. It presses Down to the file halfway down the list, then to the last file, and checks each time that the highlighted row is in view and is the highlighted file in the same way. Last, it presses Up back to the first file and checks the list scrolled back up to it.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-file-in-view
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
