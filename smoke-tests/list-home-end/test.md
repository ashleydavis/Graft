# list-home-end/test.sh

Smoke test of Home and End in every pane of the repo explorer. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, adds empty commits on top so the repo has more commits than one page of the commit list, then a newest commit, "Add many files", that adds far more files than the commit details pane shows at once. It changes notes.txt and leaves it unstaged, and changes and stages README.md, so the changes pane lists one Unstaged row and one Staged row. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and presses keys through the native app as a user does.

- In the repo details pane it presses End and Enter and checks the changes pane opens, so End selected the Commit link.
- In the changes pane it presses End and Enter and checks the file pane shows README.md, the last Staged row, then Left, Home and Enter and checks it shows notes.txt, the first Unstaged row.
- It presses Escape twice, then Home and Enter, and checks the commit pane opens, so Home selected the Commits link.
- In the commit pane it presses End and checks the last commit of the first page is in view of the list and the next page is read, then Enter opens that commit. Back in the commit pane with the details open, End opens the repo's first commit, "Add the readme", now its page is read, and Home opens the newest, each in view.
- In the commit details pane it opens the first file with Enter and returns with Left. End shows the last file's diff and Home the first file's, each in view of the pane's scrolling area.
- In the file pane it presses End and Home, then Left and Enter, and checks the first file opens again, so the keys left the selection as it was.
- It closes the file pane with Escape and checks End and Home in the commit details pane open the repo's first commit and its newest.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh list-home-end
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
