# help-page/test.sh

Smoke test of the Help page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It waits for the welcome page Graft starts on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the Help page with the left sidebar's Help link. The heading "Help" and the line saying what the page holds show. So do the "Pages" heading with the Welcome, Repo explorer, Help and About entries and the "Moving between pages" heading with the Left sidebar, Breadcrumb trail, File menu and Keyboard entries, each with its text, and the `?` key cap in the Keyboard entry.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh help-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
