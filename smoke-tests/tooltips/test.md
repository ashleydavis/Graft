# tooltips/test.sh

Smoke test of Graft's tooltips. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and commits one more file, `src/graph/lanes.ts`, so the file pane's title, which shows only the file's name, has a longer full path for its tooltip. It starts the real app with remote control on. It opens the repo with the welcome page's Open repo button through `open_repo_with_button`, then opens the commit pane with the repo details pane's Commits link through `open_commit_pane`. It rests the pointer on the newest commit's short hash with `hover` and checks the tooltip shows the full hash, then moves the pointer off with `unhover` and checks the tooltip closes. It opens the commit, rests the pointer on its changed file, presses P, moves the pointer off and checks the file's tooltip stays open, then presses Escape and checks the tooltip closes while the commit details pane stays open. It then opens the file, rests the pointer on the file pane's title and checks the tooltip shows the file's full path.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh tooltips
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
