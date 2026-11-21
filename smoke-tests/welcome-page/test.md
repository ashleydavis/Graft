# welcome-page/test.sh

Smoke test of the welcome page. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`. It starts the real app with remote control on, so Graft starts with no repo open, and checks the app opens on the welcome page with the heading "Graft" and its Open repo button, with no Commits link in the left sidebar and no repo step in the breadcrumb trail. It then clicks Open repo twice, each time giving the folder picker its paths first with remote control's `pick-answer` command, through `answer_picker`, so no dialog shows. The first is no folder, a cancelled picker, which leaves Graft on the welcome page with no repo open. The second is the test repo, opened through `open_repo_with_button`, which opens the commits page listing its commits, with the repo's folder name in the trail and the Commits link in the sidebar.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh welcome-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
