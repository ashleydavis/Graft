# commit-branches/test.sh

Smoke test that the commit pane lists the commits of every branch and HEAD. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, with main checked out. It adds a branch other, started from "Add the notes", holding the commit "Other branch commit" that only it reaches, and a remote-tracking branch origin/remote-only holding the commit "Remote branch commit" that only it reaches. It adds a branch empty that points at the first commit, "Add the readme", and a stash, whose commit only refs/stash reaches.

It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`. It checks "Remote branch commit" is listed with the origin/remote-only badge, "Other branch commit" with the other badge, main's newest commit with the main badge and the first commit with the empty badge, and that the stash's commit is not listed.

Last it opens the right sidebar and checks it shows `git log --no-show-signature --max-count=50 --branches --remotes HEAD --` as the most recent command. It runs that command after the `cd` the sidebar shows, in a shell of its own, with `--format=%H` added before the `--`, and checks it lists the same commits in the same order: the remote-tracking branch's commit, the other branch's commit and main's three commits.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-branches
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
