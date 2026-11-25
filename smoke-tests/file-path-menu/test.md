# file-path-menu/test.sh

Smoke test of the file path menu, the drop-down button beside each file path. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then changes notes.txt and adds docs/guide.md. It writes an editor script to its temporary directory that writes the path it is given to a file. It starts the real app with remote control on, sets `editor` in the test's own config file to that script and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It opens the commit pane and the head commit, clicks the menu button of the commit details pane's notes.txt row and checks the menu opens and the file pane stays closed, so the click never reached the row. Escape closes the menu. It opens notes.txt's file pane, opens the menu in the pane's title bar and checks its items: "Copy full file path", "Copy relative file path", "Copy file name", "Open in file manager" and "Open in editor". It chooses "Open in editor" and checks the editor script was given notes.txt's full path and the menu closed.

It opens the changes pane, opens notes.txt's file pane from the Unstaged list, clicks the menu button of docs/guide.md's row and checks the file pane still shows notes.txt. It chooses "Open in editor" and checks the editor script was given docs/guide.md's full path. Last, it deletes docs/guide.md, chooses "Open in editor" from its row's menu again and checks the menu shows that the file is not in the working tree.

The test runs in a hidden window, where a file manager window cannot be seen, so the Zig unit tests check the file manager command on each platform.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh file-path-menu
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
