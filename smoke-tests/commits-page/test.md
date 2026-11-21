# commits-page/test.sh

Smoke test of the commits page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, adds a commit that only this run's repo has and starts the real app with remote control on. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, follows the left sidebar's "Commits" link to the commits page and checks that the page lists the repo's commits, the run's own commit first.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commits-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
