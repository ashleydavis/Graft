# commit-columns/test.sh

Smoke test of the columns on the commits page opening. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commits page. It checks the newest commit's row shows its title, its HEAD ref, its author, a date and its short hash, and that the row of the commit before it shows its tag, v1.0. It clicks the newest commit, "Change the note", and checks the commit details pane is scrolled into view inside the window and shows the commit's title, description, hash, parent, author and committer with their emails and dates and its changed file, notes.txt, with its change type and the line it added and the line it deleted. It then clicks notes.txt and checks the file pane, which opens beyond the right edge of the window, is scrolled into view inside the window and shows the file's path and its diff, with the commit pane still there.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-columns
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
