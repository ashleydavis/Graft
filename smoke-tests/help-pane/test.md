# help-pane/test.sh

Smoke test of the Help pane in the right sidebar. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh` and starts the real app with remote control on. It opens the right sidebar on the welcome page Graft starts on and checks the Help pane, headed "Help", shows the welcome page's name and the Help page's text for it. It opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and checks the Help pane shows the repo details pane's help, still after `open_commit_pane` clicks the Commits link, which leaves the repo details pane active. It presses Right and checks the commit pane's help shows, with Up and Down as key caps and the line on clicking a commit. It clicks the newest commit, which leaves the commit pane active, presses Right and checks the commit details pane's help shows. It clicks notes.txt, which leaves the commit details pane active, presses Right and checks the file pane's help shows, with Left as a key cap. It presses Escape and checks the commit details pane's help shows, then Left and checks the commit pane's help shows. Last it opens the Help page and the About page with the left sidebar's links and checks each page's help shows.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh help-pane
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
