# zig-packages.sh

Builds the frontend first (`bun run bundle:ui`), because the template's backend embeds it, then builds, cross-builds or tests the Zig parts of the template with the steps of the template's own `build.zig`, which takes Ziggy as a dependency: the template's backend (`backend`, with Ziggy's core library built into it) and the native apps.

## Usage

`bash apps/graft/scripts/zig-packages.sh <build|cross|test>`

The template's `compile:zig` script runs `build` and then `cross`, and the repository's `compile:zig` script runs that.

## Arguments

- `build`: builds the template's backend library for this machine (`graft-backend`).
- `cross`: builds the template's backend library for every other platform's target, with and without the test hooks: MacOS with its oldest supported OS version, Windows and Linux on both architectures. Then fetches the pinned WebView2 SDK if it is not there and compiles the Windows native app without linking it (the `graft-windows-check` step, for the MinGW targets), which catches type errors in the native app on a machine that cannot link a Windows executable. The Swift and Xcode parts are only built on a Mac.
- `test`: runs the unit tests of the template's backend (`zig build test` in the template's directory). The tests of Ziggy itself run from the root of the repository (`bun run test:zig`), which runs these too.
