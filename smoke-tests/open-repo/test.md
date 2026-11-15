# open-repo/test.sh

Smoke test of opening a repo from the File menu. It creates two test repos of its own in its temporary directory with `scripts/test/create-test-repo.sh` and adds a commit that only the second has. It starts the real app with remote control on and without `GRAFT_TEST_REPO`, so Graft starts with no repo open, and checks the welcome page shows with no Commits link in the left sidebar and an empty breadcrumb trail. It then chooses File, Open repo three times, each time giving the folder picker its paths first with remote control's `pick-answer` command, so no dialog shows. The first is no folder, a cancelled picker, which leaves Graft on the welcome page with no repo open. The second is the first repo, which opens the commits page listing its commits, with the repo's folder name in the trail and the Commits link back in the sidebar. The test moves to the About page and back with the left sidebar to check the repo stays open. The third is the second repo, which the commits page then shows in place of the first, with its own commit listed.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh open-repo
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
