# commit-pages-merge/test.sh

Smoke test of the commit list's pages on a repo with a merge. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then adds a side branch and the main line, each of empty commits, and merges the side branch into main. The side branch's commits are dated between the main line's, so git log lists one from each side in turn and a page boundary falls among them. Together they are more commits than one page of the commit list. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`.

It checks the merge is listed first, then scrolls the list to its end with `scroll_to_end` until the repo's first commit, "Add the readme", is listed. It checks the loading row and the error row have gone, that "Side 1", the oldest commit only on the side branch, is listed, and that the right sidebar lists `git log --no-show-signature --max-count=50 --skip=50 <hash>`, where the hash is the merge's, as the most recent command.

Then it presses Escape to close the commit pane and Enter to open it again, which reads the first page afresh. It presses Down once for each commit `git rev-list --count HEAD` counts, waiting before each press for the row of the commit at that place in `git rev-list HEAD`, so every commit must be listed, in git's order. Enter then opens the commit details pane, which must show "Add the readme", so the list holds no commit twice.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-pages-merge
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
