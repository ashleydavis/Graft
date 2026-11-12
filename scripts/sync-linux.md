# sync-linux.sh

Builds the template's frontend (`bun run bundle:ui`) and its Linux native app (the `graft-linux` step of the template's `build.zig`, installed to `native/linux/zig-out`). The native app's build embeds every file of the built frontend in the executable, so `native/linux/zig-out/bin/graft` is the whole app and needs no files beside it. Runs on Linux.

## Usage

`bash apps/graft/scripts/sync-linux.sh [--optimize <mode>] [--prefix <dir>]`

Run it through the root `package.json` script, not directly.

## Arguments

- `--optimize <Debug|ReleaseSafe|ReleaseFast|ReleaseSmall>`: the Zig optimize mode. Default `ReleaseSafe`.
- `--prefix <dir>`: where the app is installed, as `<dir>/bin/graft`. Default `native/linux/zig-out`. CI's `app-build` job and the smoke tests install into a directory of their own.
