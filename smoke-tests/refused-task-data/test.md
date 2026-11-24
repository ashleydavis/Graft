# refused-task-data/test.sh

Smoke test of how the backend refuses invalid task data. It starts the real app with remote control on, so Graft starts on the welcome page with no repo open. It then queues each task through the frontend with remote control's `run-task` command, through `run_task`: the commits, commit details and file diff tasks with an empty repo path and the pick-repo-folder task with data that is not null. It checks each task fails with the text naming what was wrong and what to do, and that the app still handles the `ready` command after each one, so a refusal leaves the backend running. Last it checks the welcome page still shows.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh refused-task-data
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
