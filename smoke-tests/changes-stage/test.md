# changes-stage/test.sh

Smoke test of the changes pane, headed "Commit", staging and unstaging files. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then changes notes.txt, deletes README.md and adds docs/new.txt, a new file in a new directory. It starts the real app with remote control on, opens the right sidebar's Git commands panel and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It clicks the repo details pane's Commit link and checks the changes pane opens in view with "3 files, 0 staged", all three files in the Unstaged list, the Staged list showing "Nothing staged yet." and `git status` in the Git commands panel. It clicks notes.txt and checks the file pane shows its unstaged diff and `git diff -- notes.txt`. It stages notes.txt and checks it moves to the Staged list, git lists it as staged, the panel lists only the staged diff the file pane reads again above `git status`, the two most recent commands, so `git add -- notes.txt` is not listed. It checks the untracked docs/new.txt's file pane is titled "new.txt" alone, its diff and `git diff --no-index`, stages README.md and docs/new.txt and checks the Unstaged list shows "Everything is staged." and git lists all three staged. Last, it opens README.md's staged diff, unstages notes.txt and checks it moves back to the Unstaged list, git lists only the other two staged and the panel lists only two commands, `git status` the second, so `git restore --staged -- notes.txt` is not listed. Then it uses the keys: Escape closes the file pane and then the changes pane, Enter on the selected Commit link opens the changes pane again, Down selects its first row and Enter opens that row's file pane with notes.txt's diff.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh changes-stage
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
