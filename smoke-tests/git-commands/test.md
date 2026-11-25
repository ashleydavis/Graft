# git-commands/test.sh

Smoke test of the Git commands the right sidebar shows for the active pane. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the right sidebar, which shows that the welcome page Graft starts on has run no Git commands. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and checks the sidebar shows only `git for-each-ref --sort=refname '--format=%(HEAD) %(refname)' refs/heads/`, which the active repo details pane ran to read the repo's branches, and runs it. It opens the commit pane through `open_commit_pane`, presses Right to make it active and checks the sidebar shows `cd <repo>` and `git log --no-show-signature --max-count=50 --branches --remotes HEAD --`. It runs the commands the sidebar shows, after the `cd` it shows, and fails when `git log` does not list the newest commit. It clicks the newest commit, which leaves the commit pane active, and checks the sidebar still lists only the `git log`. It presses Right and checks the sidebar lists only the commit details pane's two `git diff-tree` commands, the line counts command first, then runs them. It presses Left and checks the `git log` shows again, and Left again and checks the repo details pane shows only the `git for-each-ref`. It clicks notes.txt, presses Right to make the file pane active and checks the sidebar lists only the `git diff-tree` for the file's diff, then runs it. It checks each command listed shows how long it took and the panel shows the total time of every command the pane ran, each written as a duration such as `12 ms` or `1.4 s`. It closes the file pane with Escape, opens the file again and checks its command is still listed, then closes and opens the sidebar and checks it again. Last it opens the About page with the left sidebar's About link and checks the sidebar shows the page has run no commands.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh git-commands
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
