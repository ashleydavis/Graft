# copy-key/test.sh

Smoke test of the copy key in the repo explorer. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, changes README.md and adds docs/new.txt, which it stages with `git add`. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and presses keys through the native app as a user does.

To read the clipboard it presses `?`, which shows the keyboard shortcuts overlay with the focus in its search box, presses Ctrl+V (Cmd+V on macOS), checks the search box holds the text it expects and presses Escape to close the overlay.

It presses Down and Enter to open the commit pane, Down to select the newest commit and Ctrl+C (Cmd+C on macOS), and checks the clipboard holds the commit's full hash, as `git rev-parse HEAD` prints it. It presses Enter to open the commit's details, with notes.txt selected, presses Ctrl+C and checks the clipboard holds notes.txt. It presses Escape twice to close the commit details pane and the commit pane, then Down and Enter to open the changes pane with no row selected. It presses Ctrl+C there and checks the clipboard still holds notes.txt. It presses Down to select the unstaged README.md and Ctrl+C, and checks the clipboard holds README.md, then Down to select the staged docs/new.txt and Ctrl+C, and checks the clipboard holds docs/new.txt. Last, it types "Fix the copy key" in the commit message box, gives the box the focus, presses Ctrl+A and Ctrl+C, clears the box, presses Ctrl+V and checks the box holds "Fix the copy key" again, so Ctrl+C in a text box copies the text selected in it while a file is selected in the changes pane.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh copy-key
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
