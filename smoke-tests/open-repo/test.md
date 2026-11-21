# open-repo/test.sh

Smoke test of opening a repo from the File menu. It creates two test repos of its own in its temporary directory with `scripts/test/create-test-repo.sh` and adds a commit that only the second has. It starts the real app with remote control on, so Graft starts with no repo open, and checks the welcome page shows with no Repo explorer link in the left sidebar and a breadcrumb trail of "Welcome" alone. It then chooses File, Open repo three times, each time giving the folder picker its paths first with remote control's `pick-answer` command, through `answer_picker`, so no dialog shows. The first is no folder, a cancelled picker, which leaves Graft on the welcome page with no repo open. The second is the first repo, which opens the repo explorer page. The test opens the commit pane with the repo details pane's Commits link, through `open_commit_pane`, and checks it lists the repo's commits, with the repo's folder name and "Repo explorer" in the trail and the Repo explorer link back in the sidebar. The test moves to the About page and back with the left sidebar, opens the commit pane again and checks the repo stays open. The third is the second repo, which the repo explorer page then shows in place of the first, on its repo details pane. The test opens the commit pane again and checks it lists the second repo's own commit.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh open-repo
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
