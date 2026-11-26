# Root cause: the git-commands smoke test asserts an order two concurrent commands do not have

## The failure

Release Linux, job `app-smoke-tests`, step "Run the smoke tests", on commit `bd3d9cc7559119883af233776d79955a85477b14`: https://github.com/ashleydavis/graft/actions/runs/45764726375

```
FAILED: git-command-0-text never showed "git for-each-ref --sort=refname '--format=%(refname:strip=2)' refs/tags". It showed: git for-each-ref --sort=refname '--format=%(HEAD) %(refname)' refs/heads/
FAILED: git-commands (exit 1).
Passed 50, failed 1.
Failed: git-commands
```

The full extract is `logs/ci-release-linux-45764726375.txt`.

The same test failed the same way in Release macOS arm64 runs 45764726271 and 45754038345. Those runs also fail `file-path-menu`, which is a separate matter: that test waits for "Open in file manager", the Linux label, and macOS shows "Reveal in Finder". Release Windows run 45764726292 is not covered here: its "Run the smoke tests" step has no conclusion and the job ended after 54 minutes, so it did not report a failing test this investigation could use.

## Root cause

When a repo opens, the repo explorer queues two tasks that each run `git for-each-ref`, one for the branches and one for the tags (`frontend/src/pages/repo-explorer/index.tsx`: `readBranchList` then `readTags`). Ziggy runs tasks on its worker pool, so the two `git` processes run concurrently and finish in either order. The Git commands panel lists each command when its event arrives, newest first (`addGitCommand` puts each arrival at the front of the list, `shownGitCommands` shows the front two). `smoke-tests/git-commands/test.sh` asserted that the tags command is always first and the branches command always second, which holds only when the tags command happens to finish last. When the branches command finishes last, the test fails with the line above.

The fixed-order assertion was added by commit `f723e6d` ("repo-details-2: Added tags and a tag pane to the repo details pane"), before which the test asserted only the single branches command. The failure first appears in the run after that commit.

Local runs on a 24-CPU machine passed 20 of 20. The failure appears once the run is limited to 4 CPUs with `taskset -c 0-3`, and it also appears on the CI runner itself (side A below).

## Experiments, both sides

The failure is intermittent, so each side is shown by how many of its runs fail: runs fail with the CI's line with the cause present, and none fail with only the cause removed.

Side A, the cause present:

- `root-cause/experiments/test-fixed-order.sh` is `smoke-tests/git-commands/test.sh` as it was on the failing commit.
- Locally, pinned to CPUs 0-3 with `taskset -c 0-3`: 11 of 20 runs failed, each with the CI's line (`logs/local-4cpu-fixed-order.txt`).
- On GitHub's `ubuntu-latest` runner, in run https://github.com/ashleydavis/graft/actions/runs/45776647537: 2 of 20 runs failed, each with the same line (`logs/ci-experiment-45776647537.txt`).

Side B, only the cause removed:

- `root-cause/experiments/test-either-order.sh` differs from side A only in the two repo details order assertions: it requires the tags command and the branches command to be listed, one each, in either order. Nothing else changed, and the app code is identical on both sides.
- Locally, pinned to CPUs 0-3: 20 of 20 runs passed (`logs/local-4cpu-either-order.txt`).
- On the same CI runner and run as side A: 20 of 20 runs passed (`logs/ci-experiment-45776647537.txt`).
- That side also checks both commands are listed, so it rules out "the tags command did not run".

The arrival order was observed directly (`logs/local-4cpu-arrivals.txt`), with the app rendering a hidden `git-command-arrivals` element listing each git-command event in the order the frontend receives it (commit on this branch, `frontend/src/components/app-layout.tsx`). In every one of the six runs, both commands arrived, and the panel order was the reverse of the arrival order. The one failing run had the tags event arriving before the branches event; the five passing runs had the branches event first.

## Files

- `experiments/test-fixed-order.sh`: the test as it was on the failing commit, used for side A.
- `experiments/test-either-order.sh`: the test for side B, differing only in the two order assertions.
- `logs/ci-release-linux-45764726375.txt`: the failing CI run's runner image, git-commands block and summary.
- `logs/local-4cpu-fixed-order.txt`: 20 local side A runs pinned to 4 CPUs.
- `logs/local-4cpu-fixed-order/run-NN.log`: the full log of each of those runs, the source of the summary above.
- `logs/local-4cpu-either-order.txt`: 20 local side B runs pinned to 4 CPUs.
- `logs/local-4cpu-either-order/run-NN.log`: the full log of each of those runs.
- `logs/local-24cpu-fixed-order.txt`: 20 local side A runs with no CPU limit, all passing.
- `logs/local-24cpu-fixed-order/run-NN.log`: the full log of each of those runs.
- `logs/local-4cpu-arrivals.txt`: six local runs showing each command's arrival order and the panel order.
- `logs/local-4cpu-arrivals/run-NN.log`: the full log of each of those six runs.
- `logs/ci-experiment-45776647537.txt`: the CI experiment run's phase A and phase B results, copied from its job log.

## How it was run again

The experiment workflow is `.github/workflows/root-cause-git-commands.yml`. It triggers on a push that changes that file only, so a later commit to this branch does not start it. It builds the app once and runs the test 20 times per side.
