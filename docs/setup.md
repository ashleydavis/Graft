# Graft setup

How to get Graft ready to run, test and develop. Once set up, see [development.md](development.md) for the day-to-day workflow.

## Prerequisites

- [mise](https://mise.jdx.dev), which installs the tools `mise.toml` locks to exact versions: Zig, Bun, Node, jq and what-changed.
- Git, on `PATH`. Graft runs the real `git`. So do its smoke tests and the unit tests of its Git interface.
- The system packages Ziggy needs on each platform, listed in Ziggy's [Dependencies](https://github.com/ashleydavis/ziggy/blob/v0.0.13/docs/user-guide/dependencies.md):
  - Linux:

    ```bash
    sudo apt install libgtk-3-0 libwebkit2gtk-4.1-0 gstreamer1.0-plugins-good gstreamer1.0-libav zenity xvfb zip dpkg
    ```

  - Windows: Git for Windows, with every command run in Git Bash and `%LOCALAPPDATA%\mise\shims` on `PATH`. Also winget ("App Installer" from the Microsoft Store). Then `bun run setup` once per machine, which installs Microsoft's C++ build tools and downloads the WebView2 SDK and WiX.
  - macOS: Xcode.
- No accounts, services, environment variables or config files are needed to build, run or test Graft.

## Set up the project

From the repo root:

```bash
mise trust && mise install
bun install
bash scripts/install-hooks.sh install
```

`scripts/install-hooks.sh` installs the Git pre-commit hook, which runs the checks a commit's changes affect and refuses the commit when one fails. It is needed once per clone. `bun install` installs the frontend's packages, Ziggy's frontend types among them. The Zig build fetches Ziggy itself into `zig-pkg/` the first time it runs.

Then run Graft with the command for your platform:

```bash
bun run linux
bun run windows
bun run macos
```

## Set up a worktree

Each git worktree has its own `node_modules/`, `zig-pkg/`, `.zig-cache/` and `dist/`, because they are ignored by git and so are not in a new worktree.

**The implementation agent must set up the worktree before implementing a ticket.** From the worktree root, before compiling, testing or running anything:

```bash
mise trust && mise install
bun install
```

The pre-commit hook is shared by every worktree of the clone, so a worktree does not install it again. Skipping the setup breaks `bun run compile` and `bun run test` with missing modules (TypeScript, Jest and Ziggy's types). It also runs the tools from whatever is on `PATH` instead of the versions `mise.toml` locks. The Zig build fetches its own dependencies on the first build in the worktree.
