# changes-stage/test.sh

Smoke test of the changes pane, headed "Changes", staging and unstaging files. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then changes notes.txt, deletes README.md and adds docs/new.txt, a new file in a new directory. It starts the real app with remote control on, opens the right sidebar's Git commands panel and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It clicks the repo details pane's Changes link and checks the changes pane opens in view with "3 files, 0 staged", all three files in the Unstaged list and the Staged list showing "Nothing staged yet.". It presses Right to make the changes pane active and checks the Git commands panel lists `git status`. It clicks notes.txt, checks the file pane shows its unstaged diff, presses Right to make the file pane active and checks the panel lists `git diff -- notes.txt`. It stages notes.txt and checks it moves to the Staged list and git lists it as staged. The click makes the changes pane active, and the panel lists only its two most recent commands, `git status` above `git add -- notes.txt`. Right makes the file pane active, and the panel lists only the staged diff the file pane reads again above the unstaged diff. It checks the untracked docs/new.txt's file pane is titled "new.txt" alone, its diff and, with the file pane active, `git diff --no-index`, stages README.md and docs/new.txt and checks the Unstaged list shows "Everything is staged." and git lists all three staged. Last, it opens README.md's staged diff, unstages notes.txt and checks it moves back to the Unstaged list, git lists only the other two staged and the panel lists only the changes pane's two most recent commands, `git status` above `git restore --staged -- notes.txt`. Then it uses the keys: Escape closes the file pane and then the changes pane, Enter on the selected Changes link opens the changes pane again, Down selects its first row and Enter opens that row's file pane with notes.txt's diff.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh changes-stage
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
