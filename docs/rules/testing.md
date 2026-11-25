# Testing

Graft has three kinds of test, laid out as in the Ziggy template:

- **Frontend unit tests**: Jest with ts-jest, configured in `jest.config.js`. They live under `frontend/src/test/`, mirroring the path of the file they test. Their names end in `.test.ts`. Run them with `bun run test`.
- **Backend unit tests**: Zig tests under `backend/src/test/`, named after the file they test (`git-log.test.zig`), found by the build's `addDirectoryTests`. They start the backend with Ziggy's fake native app and send it what the frontend would. Run them with `bun run test:zig`.
- **Smoke tests**: one directory per test under `smoke-tests/`, each with a `test.sh`. Run them all with `bun run test:smoke` or one with `bash smoke-tests/run-desktop.sh <directory>`. Never pass arguments to a `bun run` check script: `bun run` adds them after its baseline capture.

Run the suites whose watched files changed with `bash scripts/test-everything.sh`, which the Git pre-commit hook also runs. Never run it with `--force`.

## Testing rules

These apply to every change.

- All code is unit tested to 100% coverage as it is written, TypeScript and Zig alike: 100% unit test coverage over every source file. This rule is for unit tests. It has nothing to do with smoke tests. Smoke tests never count towards unit test coverage. Coverage is the percentage Jest (TypeScript) and kcov (Zig) report.
- The unit tests of the Git interface function, the one that starts `git`, run the real `git` on a temporary repo and check only that the interface works with it. They are the only unit tests allowed to use `git` or any other external dependency. Every other unit test mocks them: the Git interface, the file system, IO, the network and anything else. TypeScript unit tests use Jest's `__mocks__` for this.
- Each feature is smoke tested in as many ways as it can be used.
- Smoke tests use real `git`.
- Every test, of every kind, must be able to run in parallel with every other test, including the tests of another worktree running at the same time. Tests never share a fixed path, port, build output or any other resource.
- Smoke tests are written the way the Ziggy template's are. Each one is a `test.sh` in its own directory under `smoke-tests/` that sources `../lib/common.sh`, starts the real app with remote control on with `start_app_on_start_page`, which waits for Graft's start page, opens pages from the left sidebar with `open_sidebar_page`, and drives it through the remote control server with `click`, `text_of` and `wait_for_text`, which find elements by their `data-id`. Each test gets its own temporary directory from `lib/test-lib.sh`. `bun run test:smoke` runs them all through `smoke-tests/run.sh`.
- **A UI-affecting change must be screenshotted once in every affected view, as Graft shows it.** Agent review rejects a UI-affecting change with no screenshots. A removal is a UI change too: capture the resulting after-state.
- **Every visual or interactive component must be testable within the running app.** The developer must be able to open the app, reach the component and try it out in each of its states. Screenshots alone are not enough. A component no page uses yet is still made reachable in the app in the same ticket. "No page consumes it yet" and "a later ticket wires it in" are not reasons to leave it out of the app.
- **Screenshots are taken in the context of the running app.** Every required screenshot must show the change inside the running app, in its real window with the surrounding chrome present, reached the way a user reaches the view. Never screenshot a component rendered in isolation (a scratch render or story outside the app).
- **A new or changed UI component must be screenshotted in the running app in each of its states, including any empty case.** A component ticket may not declare its Test Plan `N/A` on the grounds that it has no consumer yet.
- Screenshots of the running app are taken from the real app (`bun run <platform>` or remote control's `screenshot` command in a smoke test), never from dev mode in a browser.
