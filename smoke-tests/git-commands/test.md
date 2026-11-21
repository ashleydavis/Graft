# git-commands/test.sh

Smoke test of the Git commands the right sidebar shows. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the right sidebar, which shows that the welcome page Graft starts on has run no Git commands. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, which shows the repo explorer page with the repo details pane alone, and checks the sidebar shows no commands. It opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`, and checks the sidebar shows `cd <repo>` and `git log --max-count=50`, marked as the most recent. It clicks the newest commit and checks `git log --max-count=1 <hash>` and the two `git diff-tree` commands for the changed files and their line counts are added, the line counts command first. It clicks notes.txt and checks the `git diff-tree` for the file's diff is added. It checks each command the repo explorer page ran shows how long it took and the panel shows their total time, each written as a duration such as `12 ms` or `1.4 s`. It closes the commit details pane and the sidebar, and checks the commands are still there when the sidebar opens again. It then runs every command the sidebar shows in a shell of its own, after the `cd` the sidebar shows, and fails when one fails or when `git log` does not list the newest commit. Last it goes back to the About page and checks the sidebar shows no commands there.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh git-commands
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
