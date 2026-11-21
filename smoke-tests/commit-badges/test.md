# commit-badges/test.sh

Smoke test of the commit pane's badge column. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and gives the repo's first commit, "Add the readme", the branch first-branch and the tags v0.1.0 to v0.5.0, more badges than the column has room for. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the repo explorer page and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`.

It checks the first commit's title is shown and inside the window, and that its badge column shows the "…" button. It clicks the "…" and checks the drop-down opens and lists the branch and every tag, presses Escape and checks the drop-down closes. It opens the drop-down again, clicks outside it and checks it closes. Last, it checks the commit details pane never opened, so the clicks on the "…" did not open the commit.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-badges
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
