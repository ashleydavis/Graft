# open-repo-shortcut/test.sh

Smoke test of opening a repo with Open repo's keyboard shortcut. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`. It starts the real app with remote control on, so Graft starts with no repo open. It gives the folder picker the test repo's path first with remote control's `pick-answer` command, through `answer_picker`, so no dialog shows, then presses `CmdOrCtrl+O` through the native app as a user does and checks the repo explorer page shows, opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`, and checks it lists the repo's commits with the repo's folder name in the breadcrumb trail. It then presses `?` and checks the keyboard shortcuts overlay lists Open repo with its shortcut as the platform shows it: `⌘O` on macOS and `Ctrl+O` on Linux and Windows.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh open-repo-shortcut
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
