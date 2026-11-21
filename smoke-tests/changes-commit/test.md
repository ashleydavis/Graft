# changes-commit/test.sh

Smoke test of the commit section of the changes pane. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, changes notes.txt and adds later.txt, which stays unstaged. The app runs git with the test's environment, so the test switches off the user's global and system git config and fixes the commit's author and committer. It starts the real app with remote control on, opens the right sidebar's Git commands panel and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It clicks the repo details pane's Commit link and checks the Commit button shows "Nothing to commit". It stages notes.txt and checks the button shows "Commit 1 file". It adds a pre-commit hook to the test repo that writes an error and fails, types a commit message of two paragraphs and clicks Commit. It checks the commit section shows git's error text with the hook's output, git's newest commit is still the test repo's own last commit, notes.txt is still staged and the message box keeps the message. It removes the hook and clicks Commit again. It checks git's newest commit has the whole message, the Staged list shows "Nothing staged yet." while later.txt stays in the Unstaged list, the error has gone, the button shows "Nothing to commit", the message box is empty, git lists only later.txt and the Git commands panel shows `git commit --message` and then `git status`. Last, it opens the commit pane with the Commits link and checks it lists the new commit.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh changes-commit
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
