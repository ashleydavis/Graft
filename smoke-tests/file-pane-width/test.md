# file-pane-width/test.sh

Smoke test of the file pane's width. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and changes `notes.txt` in its working tree. It starts the real app with remote control on and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It opens the changes pane with the repo details pane's Commit link and clicks `notes.txt`. In the smoke test's narrow window it checks, with `bounds_of`, that the file pane is as wide as the page's visible area less the repo explorer's margins. It then presses Ctrl+Minus until the zoom is 0.3, so the window shows more pixels across than the open panes need, and checks the file pane's right edge is at the right edge of the repo explorer's columns and the pane is wider than 840 pixels. It opens the commit pane, the newest commit and its `notes.txt` and checks the commit's file pane fills the rest in the same way. Last, it presses Ctrl+0 to go back to the actual size and checks the commit's file pane narrows with the window.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh file-pane-width
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
