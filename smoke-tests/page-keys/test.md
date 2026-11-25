# page-keys/test.sh

Smoke test of Page Up and Page Down in the repo explorer. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then adds empty commits "Commit 001" onwards, so the repo has more commits than one page of the commit list. It then adds a newest commit, "Add many files", that adds more files than the commit details pane shows at once. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`. It presses keys through the native app as a user does.

It presses Down and Enter to open the commit pane, Down and Enter to open the newest commit's details and Left to make the commit pane active again. It presses Page Down and reads which commit the commit details pane shows, which gives the rows in a page. It checks the selection moved by more than one row and its row is in view of the commit list. It presses Page Down again and checks the selection moved by the same number of rows. It presses Page Down on past the first page of commits, checking each press moves by a page or stops at the last commit read. It checks the selection goes on into the next page once it is read. It zooms in twice, presses Page Up and checks it moved by fewer rows than before, then resets the zoom. It presses Page Up back to the newest commit, checks its row is in view and that one more Page Up leaves it selected.

It presses Right to make the commit details pane active, Enter to open the first file and Left to make the commit details pane active with the file pane open. It presses Page Down and checks the file pane shows a file more than one row down, whose row is in view of the pane. It presses Page Down on to the last file, checking each press moves by the same number of rows, checks one more Page Down leaves the last file open and Page Up moves back by a page. It presses Right to make the file pane active, then Page Down and Page Up. It checks the file pane still shows the same file.

Last, it presses Escape three times to close the file pane, the commit details pane and the commit pane, then Page Down and Enter and checks the changes pane opens, so Page Down moved to the last link. It presses Escape, then Page Up and Enter and checks the commit pane opens, so Page Up moved to the first link.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh page-keys
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
