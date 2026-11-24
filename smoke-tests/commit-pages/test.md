# commit-pages/test.sh

Smoke test of the commit list's pages. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and adds empty commits on top, so the repo has more commits than one page of the commit list and its last page is not full. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`.

It checks the newest commit is listed, then scrolls the list to its end with `scroll_to_end` until the repo's first commit, "Add the readme", is listed, so each scroll near the end reads the next page. It checks the loading row and the error row have gone, and that the right sidebar lists `git log --no-show-signature --max-count=50 --skip=50 <hash>`, the command that read the page after the first from the newest commit, as the most recent command.

Then it presses Escape to close the commit pane and Enter to open it again, which reads the first page afresh. It presses Down once for each commit in the repo, waiting before each press for the row it selects, so the selection moves across the pages to the first commit and the list scrolls each selected row into view. Enter then opens the commit details pane for "Add the readme".

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-pages
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
