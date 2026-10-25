# Testing

Graft has three kinds of test, laid out as in the Ziggy template:

- **Frontend unit tests**: Jest with ts-jest, configured in `jest.config.js`. They live under `frontend/src/test/`, mirroring the path of the file they test. Their names end in `.test.ts`. Run them with `bun run test`.
- **Backend unit tests**: Zig tests under `backend/src/test/`, named after the file they test (`hello-world.test.zig`), found by the build's `addDirectoryTests`. They start the backend with Ziggy's fake native app and send it what the frontend would. Run them with `bun run test:zig`.
- **Smoke tests**: one directory per test under `smoke-tests/`, each with a `test.sh`. Run them all with `bun run test:smoke` or one with `bash smoke-tests/run-desktop.sh <directory>`. Never pass arguments to a `bun run` check script: `bun run` adds them after its baseline capture.

Run the suites whose watched files changed with `bash scripts/test-everything.sh`, which the Git pre-commit hook also runs. Run every suite with:

```bash
bash scripts/test-everything.sh --force
```

## Testing rules

These apply to every change.

- All code is unit tested to 100% coverage as it is written, TypeScript and Zig alike.
- The unit tests of the Git interface function, the one that starts `git`, run the real `git` on a temporary repo and check only that the interface works with it. They are the only unit tests allowed to use `git` or any other external dependency. Every other unit test mocks them: the Git interface, the file system, IO, the network and anything else. TypeScript unit tests use Jest's `__mocks__` for this.
- Each feature is smoke tested in as many ways as it can be used.
- Smoke tests use real `git`.
- Smoke tests are written the way the Ziggy template's are. Each one is a `test.sh` in its own directory under `smoke-tests/` that sources `../lib/common.sh`, starts the real app built with the test hooks with `start_test_app`, and drives it through the test control connection with `click`, `text_of` and `wait_for_text`, which find elements by their `data-id`. Each test gets its own temporary directory from `lib/test-lib.sh`. `bun run test:smoke` runs them all through `smoke-tests/run.sh`.
- **A UI-affecting change must be screenshotted in every affected view.** When the app has a light/dark mode setting, each view is screenshotted in both light and dark mode. Graft has none yet, so each view is screenshotted once, in the mode it shows by default, which is taken to be dark mode. Do not try to change the mode: agent review does not check which mode a screenshot shows. Agent review rejects a UI-affecting change with no screenshots. A removal is a UI change too: capture the resulting after-state.
- **Screenshots are taken in the context of the running app.** Every required screenshot must show the change inside the running app, in its real window with the surrounding chrome present, reached the way a user reaches the view. Do **not** screenshot a component rendered in isolation (a gallery, scratch render or story) when the component is reachable in the app. Isolation rendering is permitted **only** as the fallback in the next rule, for a component no page consumes yet; the moment a page renders it, its screenshots must come from the running app.
- **A new or changed UI component must be screenshotted even before any page consumes it.** Only if no page renders it yet (its consumers arrive in later tickets), render it **in isolation** (a scratch render or story mounting it with sample props, covering each distinct state including any null or empty case) and screenshot it, in each mode the previous rule requires. "No page consumes it yet", "not wired in", "nothing to render" and "the e2e ticket covers it later" are not valid reasons to skip a component's screenshots; they are also the only grounds for capturing in isolation rather than in the running app. A component ticket may not declare its Test Plan `N/A` on the grounds that it has no consumer yet.
- Screenshots of the running app are taken from the real app (`bun run <platform>` or the test hooks' `screenshot` command in a smoke test), never from dev mode in a browser.
