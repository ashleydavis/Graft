# Root cause: the file-path-menu test clicks the changes pane's row before the pane has drawn it

## The failure

Release macOS arm64, job `app-smoke-tests`, step "Run the smoke tests", run https://github.com/ashleydavis/graft/actions/runs/45815238348 on commit `7a461b5832a0a3032c4598ee3e23d671c2666952`, runner `macos-26-arm64` image `20261117.0516.1`:

```
--- file-path-menu
Created the test repo at /var/folders/q2/p1t6rgxj5fj32g1dc7dmd49r0000gn/T//ziggy-tests/graft-file-path-menu-GOt1Pi/repo:
3c4f50f (HEAD -> main) Change the note
eef13fb (tag: v1.0) Add the notes
45fd1d6 Add the readme
FAILED: click change-unstaged-notes.txt failed: {"ok":false,"error":"No element has the data-id change-unstaged-notes.txt."}
FAILED: file-path-menu (exit 1). Its files are in /var/folders/q2/p1t6rgxj5fj32g1dc7dmd49r0000gn/T//ziggy-tests/graft-file-path-menu-GOt1Pi
Passed 50, failed 1.
Failed: file-path-menu
```

The full job log is `logs/ci-release-macos-arm64-45815238348.txt`.

It is intermittent. The same job and test passed in the previous Release macOS arm64 run on the same runner image (run https://github.com/ashleydavis/graft/actions/runs/45801074776, log `logs/ci-release-macos-arm64-45801074776-passing.txt`), where `file-path-menu` took from 10:32:57 to 10:33:08 and passed. The failing run reached the same click 10 seconds after the test started.

The same race has already failed tests on this runner: `smoke-tests/file-pane-width/test.sh` in Release macOS arm64 runs 45782860661 and 45754038345, and this test's commit row in run 45786995959. Both were fixed by waiting for the element, in commits `069a371` ("Wait for the changes pane's row before clicking it in the file-pane-width smoke test") and `5785512` ("Wait for the commit row before clicking it in the file-path-menu smoke test"). This failure is at the click this test still sends without waiting.

## Root cause

Clicking the repo details pane's Changes link opens the changes pane at once, but the pane's rows are drawn only when the `working-changes` task returns. Until then `changes` is `undefined` and the pane shows "Loading the changes." (`frontend/src/pages/repo-explorer/components/changes-pane.tsx`, `ChangesContent`; `frontend/src/pages/repo-explorer/index.tsx` starts the read in the effect that runs when `isChangesOpen` becomes true).

`smoke-tests/file-path-menu/test.sh` clicks `repo-details-changes`, waits only for the pane itself (`wait_for_element changes-pane 30`), and sends the click on the row in the next control command. The row exists only after the task's result has been drawn, so whether the click finds it depends on whether the `git status` behind the task has finished before the click arrives. On the macOS arm64 runner that is not always the case, and the remote control answers `No element has the data-id change-unstaged-notes.txt.`.

## The experiment

The suspected cause is that the click is sent before the row is drawn. The experiment removes only that: one line is added to the test, `wait_for_element "change-unstaged-notes.txt" 30`, before the click. The app is built once and is identical on both sides.

- Side A is `smoke-tests/file-path-menu/test.sh` as it is on the failing commit, unchanged. 20 runs.
- Side B replaces that file with `root-cause/experiments/test-with-row-wait.sh`, which differs only in that one added wait. 20 runs.

The experiment workflow is `.github/workflows/root-cause-macos-arm64-file-path-menu.yml`, which builds the app once with `bun run build:macos --configuration Release` and then runs `bash smoke-tests/run-desktop.sh file-path-menu` 20 times per side on `macos-latest` (the `macos-26-arm64` runner that failed). The experiment counts as: side A failing with the CI's own line in at least one run, and side B passing 20 of 20. One side A failure is enough because the failure is the race: the cause is present in every side A run, and it shows whenever the race is lost.

## Result

The experiment ran in https://github.com/ashleydavis/graft/actions/runs/45891125521 on the same runner as the failure, `macos-26-arm64` image `20261117.0516.1`. Its log is `logs/ci-experiment-45891125521.txt`.

```
PHASE A: passed 16, failed 4 of 20
PHASE B: passed 20, failed 0 of 20
```

Side A failed in runs 3, 7, 10 and 11, each with the same line as the CI failure:

```
FAILED: click change-unstaged-notes.txt failed: {"ok":false,"error":"No element has the data-id change-unstaged-notes.txt."}
FAILED: file-path-menu (exit 1).
```

Side B passed every run. With only the wait for the row added, the same test passed 20 of 20 on the runner that lost the race 4 times in 20 without it. The row is drawn later than the click, and waiting for it removes the failure.

Five runs of the same test on Linux, pinned to two CPUs, all passed, so the failure did not reproduce away from the runner. Those logs are `logs/local-linux-2cpu-run-1.txt` to `-5.txt` with `logs/local-linux-2cpu-summary.txt`.

## How it was run again

Push a change to `.github/workflows/root-cause-macos-arm64-file-path-menu.yml` on the experiment branch. Only that file's change starts the experiment, so other commits on the branch run nothing.

## Files

- `logs/ci-release-macos-arm64-45815238348.txt`: the failing run's complete job log.
- `logs/ci-release-macos-arm64-45801074776-passing.txt`: the previous Release macOS arm64 run's job log, showing the same runner image and the same test passing.
- `logs/ci-experiment-45891125521.txt`: the experiment run's complete job log, with every run's result in both phases and the failing line of each side A failure.
- `logs/local-linux-2cpu-run-1.txt` to `-5.txt` and `logs/local-linux-2cpu-summary.txt`: the five local Linux runs pinned to two CPUs, all passing, and why the failure does not reproduce there.
- `root-cause/experiments/test-with-row-wait.sh`: the test for side B, the failing test with one wait added.
- `.github/workflows/root-cause-macos-arm64-file-path-menu.yml`: the experiment workflow that ran both sides on the failing runner.
