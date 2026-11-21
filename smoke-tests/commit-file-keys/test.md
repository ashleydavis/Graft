# commit-file-keys/test.sh

Smoke test of Up, Down and Enter in a commit's file list while a file's diff is open. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then commits a change to README.md and notes.txt as "Change two files" with real `git`, so the newest commit lists two files. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and presses keys through the native app as a user does.

It presses Down and Enter on the repo details pane's Commits link, then Down and Enter on "Change two files", and checks the commit details pane lists README.md and notes.txt. It presses Down and Enter and checks the file pane shows the diff of README.md, then presses Left to make the file list active again. It presses Down and checks the file pane shows the diff of notes.txt without Enter, presses Up and checks it shows README.md's diff again, then presses Down to show notes.txt once more. It presses Enter, which makes the file pane active, presses Up and checks the file pane still shows notes.txt, because Up in the file pane leaves the selection as it is. Last, it presses Escape and checks the file pane closes and the commit details pane stays open.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-file-keys
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
