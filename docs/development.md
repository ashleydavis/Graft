# Graft development guide

This guide covers everything needed to develop, test and contribute to Graft. For an overview of what Graft does and how to run it, see the [README.md](../README.md). For setup, see [setup.md](setup.md). For the detailed architecture, see [architecture.md](architecture.md).

## Prerequisites

mise (with Zig, Bun, Node and jq at the versions `mise.toml` locks), Git and the system packages Ziggy needs on your platform. [setup.md](setup.md) has the full list and how to install each.

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

Dev mode starts Vite's dev server, builds the dev backend and opens the frontend in the default browser once both are up. Saving a file under `frontend/` reloads the page through Vite. Saving a Zig file rebuilds and restarts the dev backend. The page reloads once it is back and running tasks are lost. Native-only features (the menu, screenshots and native calls) fail with `NativeCallMissing` in the browser. File and directory dialogs work only on Linux, through zenity. See Ziggy's [Dev mode](https://github.com/ashleydavis/ziggy/blob/v0.0.13/docs/user-guide/dev-mode.md).

## Project structure

```
frontend/            The frontend: index.html and the TypeScript and React code under src/, which runs in the system web view.
  src/lib/           Plain, unit tested code the frontend shares, such as the commands the test hooks perform.
  src/test/          The frontend's Jest unit tests, mirroring the paths of the files they test.
backend/             The Zig backend.
  src/app.zig        Graft's declaration to Ziggy: its messages, tasks, menu and built frontend.
  src/lib/           The message handlers, task handlers and menu.
  src/test/          The backend's Zig unit tests.
native/              The native project for each platform (linux, windows and macos).
scripts/             The scripts to set up, build, run, package and clean the app, each with a markdown file beside it.
smoke-tests/         The smoke tests: one directory per test, each with a test.sh. The helpers are in lib/.
.github/workflows/   The CI workflow and one release workflow per platform.
.claude/commands/    The /ziggy: Claude Code commands that came with the template.
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
bun run test:smoke                  # Every smoke test, on this machine's desktop platform.
bun run test:smoke hello-world-app  # One smoke test, by its directory name.
```

The runner builds the app with the test hooks, then runs each `test.sh` in a hidden window, with its own temporary directory and a timeout.

### All tests

```bash
bun run compile && bun run test && bun run test:zig && bun run test:smoke
```

`/ziggy:check` runs every check this machine can run, cheapest first. It then fixes what fails.

## Code conventions

Graft follows the developer's global rules in https://github.com/ashleydavis/agent-config/tree/HEAD/rules and the project's own rules in [rules/](rules/README.md). [rules/coding-style.md](rules/coding-style.md) has the conventions.

## Adding a new feature

1. Write or update the feature's spec in `docs/spec/<id>/` and its manual test steps in `docs/testing-manual/<id>/`.
2. Add the backend work in Zig under `backend/src/lib/`: a message handler for a quick answer (`/ziggy:add-message`), or a task for anything slow such as running `git` or reading files (`/ziggy:add-task`). Register it in `backend/src/app.zig`.
3. Add or change the page under `frontend/src/pages/<page>/`. Keep its logic in plain functions under `src/lib/`. Give every element a smoke test touches a `data-id`.
4. Write unit tests for every new or changed function, TypeScript and Zig alike, to full coverage, with the Git interface, the file system and IO mocked.
5. Add a smoke test under `smoke-tests/<name>/test.sh` for each way the feature can be used. It runs the real app on a real `git` repo in the test's temporary directory.
6. Run all the tests. Then run the app with `bun run <platform>` and screenshot every affected view in light and dark mode.
7. Update the user guide, the architecture doc and any other doc the change affects.

## Related docs

- [setup.md](setup.md): how to set up the project and a worktree.
- [architecture.md](architecture.md): the parts, how they talk and why.
- [user-guide.md](user-guide.md): how a user installs and uses Graft.
- [spec/README.md](spec/README.md): what Graft does, feature by feature.
- [testing-manual/README.md](testing-manual/README.md): manual test steps for each feature.
- Ziggy's [user guide](https://github.com/ashleydavis/ziggy/blob/v0.0.13/docs/user-guide.md): messages, tasks, menus, native calls, testing and scripts.
