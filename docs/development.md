# Graft development guide

This guide covers everything needed to develop, test and contribute to Graft. For an overview of what Graft does and how to run it, see the [README.md](../README.md). For setup, see [setup.md](setup.md). For the detailed architecture, see [architecture.md](architecture.md).

## Prerequisites

mise (with Zig, Bun, Node, jq and what-changed at the versions `mise.toml` locks), Git and the system packages Ziggy needs on your platform. [setup.md](setup.md) has the full list and how to install each.

## Setting up

See [setup.md](setup.md) for prerequisites and the full setup, including per-worktree setup. In short:

```bash
mise trust && mise install
bun install
```

## Running in development

There are two ways to run Graft while working on it.

The real app, which is how an agent runs Graft, takes screenshots of it and drives it the way the smoke tests do:

```bash
bun run linux    # Builds and runs Graft on Linux.
bun run windows  # Builds and runs Graft on Windows, in Git Bash.
bun run macos    # Builds and runs Graft on macOS.
```

Dev mode, which is for the developer:

```bash
bun run dev
```

Dev mode starts Vite's dev server, builds the dev backend and opens the frontend in the default browser once both are up. Saving a file under `frontend/` reloads the page through Vite. Saving a Zig file rebuilds and restarts the dev backend. The page reloads once it is back and running tasks are lost. Native-only features (the menu, screenshots and native calls) fail with `NativeCallMissing` in the browser. File and directory dialogs work only on Linux, through zenity. See Ziggy's [Dev mode](https://github.com/ashleydavis/ziggy/blob/v0.0.19/docs/user-guide/dev-mode.md).

## Project structure

```
frontend/            The frontend: index.html and the TypeScript and React code under src/, which runs in the system web view.
  src/main.tsx       Starts the frontend: the router and the answers to the smoke tests' commands. The router opens on the About page and holds the commits and Help pages.
  src/main.css       Tailwind's styles, with MaterialUI's styles in a CSS layer before Tailwind's classes.
  src/pages/         One directory per page, each with its index.tsx.
  src/components/    The components more than one page uses, such as the layout every page shows in.
  src/lib/           Plain, unit tested code the frontend shares, such as the commands the test hooks perform.
  src/test/          The frontend's Jest unit tests, mirroring the paths of the files they test.
backend/             The Zig backend.
  src/app.zig        Graft's declaration to Ziggy: its messages, tasks, menu and built frontend.
  src/lib/           The Git interface, the Git wrappers, the message handlers, task handlers and menu.
  src/test/          The backend's Zig unit tests and the mock of the Git interface function (git-mock.zig).
native/              The native project for each platform (linux, windows and macos).
scripts/             The scripts to set up, build, run, package, clean and check the app, each with a markdown file beside it.
  test/              The scripts tests use, such as create-test-repo.sh, which creates a test repo in a known state.
.githooks/           The Git pre-commit hook, which scripts/install-hooks.sh installs.
smoke-tests/         The smoke tests: one directory per test, each with a test.sh. The helpers are in lib/.
.github/workflows/   The CI workflow and one release workflow per platform.
.claude/commands/    The /ziggy: Claude Code commands that came with the template.
what-changed.yaml    The files each check watches, for scripts/test-everything.sh.
docs/                Setup, development, architecture, the user guide, the spec, the testing manual and the rules.
```

## Testing

### Type checking

```bash
bun run compile
```

Type-checks the frontend with `tsc --noEmit`. `bun run compile:zig` builds the backend for this machine, then for every other platform's target.

### Unit tests

```bash
bun run test      # The frontend's Jest unit tests.
bun run test:zig  # Builds the backend and runs its Zig unit tests.
```

### Smoke tests

```bash
bun run test:smoke                                # Every smoke test, on this machine's desktop platform.
bash smoke-tests/run-desktop.sh about-page        # One smoke test, by its directory name.
```

The runner builds the app with the test hooks, then runs each `test.sh` in a hidden window, with its own temporary directory and a timeout.

A smoke test that reads a repo creates its own with `scripts/test/create-test-repo.sh "$ZIGGY_TEST_DIR/repo"` and gives the app its path through `GRAFT_TEST_REPO`, so each smoke test running in parallel reads a repo of its own. A run of the app outside the smoke tests reads `/tmp/graft/test-repo`, which `./scripts/test/create-test-repo.sh` creates.

### Git in the unit tests

The unit tests of the Git interface function (`backend/src/test/git-interface.test.zig`) are the only ones that run `git`, in a repo of their own under the project's `tmp/`. Code that runs Git takes the Git interface function as an argument, and its unit tests pass `git_mock.mock_git` from `backend/src/test/git-mock.zig`, which checks the arguments it is given and answers as the test says.

Run one smoke test with `smoke-tests/run-desktop.sh`, not `bun run test:smoke`: `bun run` adds extra arguments to the end of the script, after the baseline capture.

### Changed tests

```bash
bash scripts/test-everything.sh          # The checks whose watched files changed since each last passed.
bash scripts/test-everything.sh --plan   # Lists the checks that changed and runs none.
```

what-changed decides which checks changed, from the files each target in `what-changed.yaml` watches. Each check's own `package.json` command records its baseline with `what-changed baseline capture <target>` when it passes, so `bun run test` records a pass whether the script or a person started it. The Git pre-commit hook runs the script before every commit and refuses the commit when a check fails. A change to a file that no check watches, such as a doc, runs no checks. `git commit --no-verify` skips the hook for one commit.

`/ziggy:check` runs every check this machine can run, cheapest first. It then fixes what fails.

## Code conventions

Graft follows the developer's global rules in https://github.com/ashleydavis/agent-config/tree/HEAD/rules and the project's own rules in [rules/](rules/README.md). [rules/coding-style.md](rules/coding-style.md) has the conventions.

## Adding a new feature

1. Write or update the feature's spec in `docs/spec/<id>/` and its manual test steps in `docs/testing-manual/<id>/`.
2. Add the backend work in Zig under `backend/src/lib/`: a message handler for a quick answer (`/ziggy:add-message`), or a task for anything slow such as running `git` or reading files (`/ziggy:add-task`). Register it in `backend/src/app.zig`.
3. Add or change the page under `frontend/src/pages/<page>/`. Keep its logic in plain functions under `src/lib/`. Give every element a smoke test touches a `data-id`.
4. Write unit tests for every new or changed function, TypeScript and Zig alike, to full coverage, with the Git interface, the file system and IO mocked.
5. Add a smoke test under `smoke-tests/<name>/test.sh` for each way the feature can be used. It runs the real app on a real `git` repo in the test's temporary directory.
6. Run the changed tests with `bash scripts/test-everything.sh`. Then run the app with `bun run <platform>` and screenshot every affected view once, as it shows. Graft has no light/dark mode yet.
7. Update the user guide, the architecture doc and any other doc the change affects.

## Related docs

- [setup.md](setup.md): how to set up the project and a worktree.
- [architecture.md](architecture.md): the parts, how they talk and why.
- [user-guide.md](user-guide.md): how a user installs and uses Graft.
- [spec/README.md](spec/README.md): what Graft does, feature by feature.
- [testing-manual/README.md](testing-manual/README.md): manual test steps for each feature.
- Ziggy's [user guide](https://github.com/ashleydavis/ziggy/blob/v0.0.19/docs/user-guide.md): messages, tasks, menus, native calls, testing and scripts.
