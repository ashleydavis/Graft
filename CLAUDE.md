# Graft

This is the project repo: the application code and its docs. The spec is in `docs/spec/`.

The developer's global rules for TypeScript, React, Bun, Zig, writing and more are in the `rules/` directory of https://github.com/ashleydavis/agent-config. Load the ones that apply to the work in this repository and follow them.

## What it does

Graft is a desktop Git client with a simple, intuitive UI that supports the developer's own process instead of getting in the way. It follows the conventions of existing Git clients and of GitHub's web pages for commits, branches and so on. It differs where the developer's own use shows a better way. It grows one ticket at a time, in small testable increments, without overengineering and without adding every feature at once.

## Stack

- Built on Ziggy (https://github.com/ashleydavis/ziggy), locked to a release tag in `package.json` and `build.zig.zon`. Graft owns the code that came from the Ziggy template. Ziggy itself is a dependency.
- A Bun mono repo with Zig components.
- Frontend: TypeScript, React, TanStack, Vite, HTML, CSS, MaterialUI, Tailwind and the free version of Font Awesome for icons, hosted in the system web view. Most of the code is in the frontend.
- Backend and native apps: Zig (Swift for the macOS native project).
- Tests: Jest for the frontend, Zig unit tests for the backend and shell smoke tests that drive the real app.

## Constraints

See `docs/architecture.md` for the reasons.

- Every access to Git, the file system and the computer goes through the Zig backend. The frontend never reaches them itself.
- Expensive work runs in a Ziggy task on a worker thread, never on the backend's main thread or the UI thread.
- Threads share no state and use no locks. They talk only by messages.
- Several instances of Graft can run at once, for example on different virtual desktops. Each instance is a separate process with one window.
- Graft runs on Linux, Windows and macOS (Intel and Apple silicon).

## How to run

- `bun run linux`, `bun run windows` or `bun run macos`: builds and runs the real app. This is how an agent runs Graft, takes screenshots of it and drives it the way the smoke tests do.
- `bun run dev`: runs the frontend in a browser with live reload. Dev mode is for the developer.

## How to test

Run the suites whose watched files changed, as what-changed reports them (the pre-commit hook runs this before every commit):

```bash
bash scripts/check-changed.sh changed
```

Run every suite, one after another:

```bash
bun run compile && bun run test && bun run test:zig && bun run test:smoke
```

- `bun run compile`: type-checks the frontend.
- `bun run test`: the frontend's Jest unit tests.
- `bun run test:zig`: builds the backend and runs its Zig unit tests.
- `bun run test:smoke`: builds the app with the test hooks and runs the smoke tests in a hidden window.

## Configuration

- `mise.toml`: the exact versions of Zig, Bun, Node, jq and what-changed.
- `what-changed.yaml`: which files each check watches, for `scripts/check-changed.sh`.
- `ZIGGY_TEST_MODE` and `ZIGGY_TEST_PORT_FILE`: read only by a build with the test hooks (`-Dtest-hooks=true`). The first switches the test hooks on and the second names the file the control connection's port is written to. The smoke test scripts set both. Neither is set by default.
- Graft's own settings and state files are not decided yet.

## Docs

- `docs/setup.md`: set up the project and a worktree.
- `docs/development.md`: develop, test and contribute.
- `docs/architecture.md`: the parts, how they fit together and why.
- `docs/user-guide.md`: how a user installs and uses Graft.
- `docs/spec/`: what the app does, feature by feature.
- `docs/testing-manual/`: manual test steps, mirroring the spec.

## Rules

The enforced rule set is in `docs/rules/` (coding style, testing, documentation, Git, Zig and any others). Every change must follow it.

## Communication style

- Be simple and direct.
- Only give directly relevant information. No waffle.
- Use bullet points where possible.
- Keep it easy to understand.
