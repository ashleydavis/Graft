# repo-details-branches/test.sh

Smoke test of the repo details pane's Branches list and the branch pane. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, makes the branch feature/x, gives it a commit of its own that main does not have and leaves main checked out. It starts the real app with remote control on and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`. It checks the repo details pane shows the Branches heading with a count of 2, a row for feature/x, which has a slash in its name, and a row for main with the HEAD badge. It clicks feature/x and checks the branch pane opens titled "feature/x" and lists the branch's own commit and main's newest commit. It then clicks main and checks the branch pane is titled "main", lists main's newest commit and leaves out feature/x's own commit.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh repo-details-branches
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
