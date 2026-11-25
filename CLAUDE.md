# Graft

This is the project repo: the application code and its docs. The spec is in `docs/spec/`.

The developer's global rules for TypeScript, React, Bun, Zig, writing and more are in the `rules/` directory of https://github.com/ashleydavis/agent-config. Load the ones that apply to the work in this repository and follow them.

## What it does

Graft is a desktop Git client with a simple, intuitive UI that supports the developer's own process instead of getting in the way. It follows the conventions of existing Git clients and of GitHub's web pages for commits, branches and so on. It differs where the developer's own use shows a better way. It grows one ticket at a time, in small testable increments, without overengineering and without adding every feature at once.

## Stack

- Built on Ziggy (https://github.com/ashleydavis/ziggy), locked to a release tag in `package.json` and `build.zig.zon`. Graft owns the code that came from the Ziggy template. Ziggy itself is a dependency.
- A Bun mono repo with Zig components.
- HIGH PRIORITY: NEVER CHANGE CI WORKFLOWS (`.github/`) TO SUPPORT A LOCAL ZIGGY. Switching this project to a local Ziggy checkout for testing is temporary, so the workflows always keep taking Ziggy from its release tag.
- HIGH PRIORITY: Never update the documentation to describe a temporary switch to a local Ziggy. The docs always describe taking Ziggy from its release tag.
- Frontend: TypeScript, React, TanStack, Vite, HTML, CSS, MaterialUI, Tailwind and the free version of Font Awesome for icons, hosted in the system web view. Most of the code is in the frontend.
- Backend and native apps: Zig (Swift for the macOS native project).
- Tests: Jest for the frontend, Zig unit tests for the backend and shell smoke tests that drive the real app.

## Constraints

See `docs/architecture.md` for the reasons.

- Every access to Git, the file system and the computer goes through the Zig backend. The frontend never reaches them itself.
- All Git work is done by running the `git` command line from Zig. Nothing else is acceptable: no libgit2 and no Git written in Zig.
- Every Git operation goes through one Zig interface to the `git` command line.
- The bottom level is one Git interface function that starts `git` with the arguments it is given.
- On top of it are separate wrapper functions, one per operation as needed, such as `commit` and `clone`. The Git interface function and the wrappers are kept separate.
- Git interfaces, abstractions and mocks are added only when a feature in Graft needs them, or when the developer explicitly asks for them.
- A mock of the Git interface is built with it. Every unit test uses the mock, except the unit tests of the Git interface function, which check the Git interface works with real `git` on temporary repos.
- Expensive work runs in a Ziggy task on a worker thread, never on the backend's main thread or the UI thread.
- Threads share no state and use no locks. They talk only by messages.
- Several instances of Graft can run at once, for example on different virtual desktops. Each instance is a separate process with one window.
- Graft runs on Linux, Windows and macOS (Intel and Apple silicon).
- iOS and Android are not supported. "All platforms" means the supported platforms only: never build, test, fix or run workflows for any other platform, and ignore its old releases.

## How to run

- `bun run linux`, `bun run windows` or `bun run macos`: builds and runs the real app. This is how an agent runs Graft, takes screenshots of it and drives it the way the smoke tests do.
- `bun run dev`: runs the frontend in a browser with live reload. Dev mode is for the developer.

## How to test

Run the suites whose watched files changed, as what-changed reports them (the pre-commit hook runs this before every commit):

```bash
bash scripts/test-everything.sh
```

Never run `scripts/test-everything.sh` with `--force`. Always run it without the flag.

- `bun run compile`: type-checks the frontend.
- `bun run test`: the frontend's Jest unit tests.
- `bun run test:zig`: builds the backend and runs its Zig unit tests.
- `bun run test:smoke`: builds the app and runs the smoke tests in a hidden window, driving it through Ziggy's remote control server.

## Configuration

- `mise.toml`: the exact versions of Zig, Bun, Node, jq and what-changed.
- `what-changed.yaml`: which files each check watches, for `scripts/test-everything.sh`.
- `--remote-control <host:port>`: starts the app connected to a Ziggy remote control server, which puts it in test mode. The smoke tests pass it. A normal run does not.
- Graft always starts with no repo open. A smoke test that needs one opens its own test repo with the welcome page's Open repo button, through `open_repo_with_button` in `smoke-tests/lib/common.sh`.
- Graft's config file and state file are Ziggy's (`~/.config/graft/config.toml` on Linux). The config file holds the `theme` setting and the `editor` setting, the command the file path menu's "Open in editor" runs with the file's full path (the operating system's default app for the file when it is absent). The state file holds whether the left sidebar is minimised, whether the right sidebar is open and the zoom level. `GRAFT_CONFIG_DIR` and `GRAFT_STATE_DIR` move them, which the smoke tests and the Zig tests do.

## Docs

- [goals.md](goals.md): what Graft aims to be.
- `docs/setup.md`: set up the project and a worktree.
- `docs/development.md`: develop, test and contribute.
- `docs/architecture.md`: the parts, how they fit together and why.
- `docs/user-guide.md`: how a user installs and uses Graft.
- `docs/spec/`: what the app does, feature by feature.
- `docs/testing-manual/`: manual test steps, mirroring the spec.

## Rules

The enforced rule set is in `docs/rules/` (coding style, the style guide, testing, documentation, Git, Zig and any others). Every change must follow it.

- A rule says what every change must or must not do. Rules go in `docs/rules/`.
- Documentation says how things work and how to use them (how to run, how to write a test, how a part fits together). It goes in the matching file under "Docs" above, never in `docs/rules/`. A major topic, such as performance testing, gets its own file in `docs/`, listed under "Docs".

## Communication style

- Be simple and direct.
- Only give directly relevant information. No waffle.
- Use bullet points where possible.
- Keep it easy to understand.
