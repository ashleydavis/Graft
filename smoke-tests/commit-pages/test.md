# commit-pages/test.sh

Smoke test of the commit list's pages. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and adds empty commits on top, so the repo has more commits than one page of the commit list and its last page is not full. It adds an empty file named HEAD, which every page names, and one named after the short hash of the repo's first commit, so the pages and that commit's details are read with a file of the same name in the repo. The first commit's file is named after its short hash only, because `git diff-tree`, which reads the commit's changed files, is given the full hash and reads it as ambiguous when a file has that name. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`.

It checks the newest commit is listed, then scrolls the list to its end with `scroll_to_end` until the repo's first commit, "Add the readme", is listed, so each scroll near the end reads the next page. It checks the loading row and the error row have gone, that the end of list row under the first commit reads "That is every commit." and that the right sidebar lists `git log --no-show-signature --max-count=50 --skip=50 --branches --remotes HEAD --`, the command that read the page after the first from every branch and HEAD, as the most recent command.

Then it presses Escape to close the commit pane and Enter to open it again, which reads the first page afresh. It presses Down once for each commit in the repo, waiting before each press for the row it selects, so the selection moves across the pages to the first commit and the list scrolls each selected row into view. Enter then opens the commit details pane for "Add the readme", whose heading names it by its short hash, which shows although a file has the commit's short hash as its name.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-pages
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
