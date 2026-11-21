# commit-keys/test.sh

Smoke test of the repo explorer's keyboard shortcuts. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and presses keys through the native app as a user does.

It waits for the welcome page Graft starts on, opens the repo there and opens the About page with the left sidebar's About link. On the About page it opens the breadcrumb trail's drop-down, whose search box has the focus, types "a", presses Left and types "b", and checks the drop-down finds no page matching "ba", so Left moved the search box's cursor. It presses Escape to close the drop-down and Ctrl+1 (Cmd+1 on macOS) to open the repo explorer, which shows the repo details pane alone. It presses Down and Enter on the repo details pane's Commits link and checks the commit pane lists the commits. It presses Down twice and Enter and checks the commit details pane shows "Add the notes", then Left and Up and checks it shows "Change the note" at once. It presses Down and checks it shows "Add the notes", then Up and checks it shows "Change the note" again, and presses Enter to make the commit details pane active. It presses Down and Enter and checks the file pane shows the diff of notes.txt. It presses Escape four times and checks the first closes the file pane, the second closes the commit details pane, the third closes the commit pane and the fourth leaves the repo details pane open. Last, it opens the Help page from the left sidebar, presses Ctrl+1, then Down and Enter, and checks the repo explorer shows again with the commit pane listing the commits.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-keys
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
