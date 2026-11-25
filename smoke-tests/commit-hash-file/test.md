# commit-hash-file/test.sh

Smoke test of a commit's details when a file in the repo has the commit's full hash as its name. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and adds an empty file named after the full hash of the newest commit, "Change the note". git reads that hash as ambiguous unless `--` follows it. It starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`. It clicks the newest commit and checks the commit details pane names its short hash and lists its changed file, notes.txt, and that the "Commit details" pane its "Commit details" row opens shows the commit's title and hash. It opens the right sidebar, presses Right to make the commit details pane active and checks the sidebar lists the two `git diff-tree` commands for the changed files and their line counts, each with `--` after the hash. It then clicks notes.txt, checks the file pane shows the file's diff, presses Right to make the file pane active and checks the sidebar lists the `git diff-tree` for the file's diff.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-hash-file
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
