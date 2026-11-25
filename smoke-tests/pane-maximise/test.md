# pane-maximise/test.sh

Smoke test of maximising a pane on the repo explorer page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`, and clicks the first commit, "Add the readme", so the commit details pane is open.

It clicks the commit details pane's maximise button and checks, through `bounds_of`, that the pane's left and right edges are the repo explorer's columns' edges and that the repo details pane and the commit pane are hidden, taking no room. It clicks the button again and checks the three panes show side by side once more. It then clicks the commit details pane's title, which makes it the active pane, presses M through the native app and checks the pane fills the repo explorer again, then presses M again and checks the panes are back.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh pane-maximise
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
