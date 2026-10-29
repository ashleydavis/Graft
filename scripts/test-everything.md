# test-everything.sh

Runs the checks whose watched files changed since each last passed, so a change runs only the checks it can affect. what-changed decides which checks changed, from the targets in `what-changed.yaml`. This script runs them. The Git pre-commit hook runs it before every commit. It follows the driver script in what-changed's AI quick reference (https://github.com/ashleydavis/what-changed/blob/main/docs/AI-QUICK-REF.md).

## Usage

`bash scripts/test-everything.sh [--plan]`, from anywhere: it runs from the app's directory. `what-changed` and `bun` must be on `PATH`, at the versions `mise.toml` locks.

## Options

- No option: runs each check `what-changed targets` reports, in the order of `what-changed.yaml`.
- `--force`: runs every check that can run on this machine (`what-changed targets list`), changed or not.
- `--plan`: prints the checks that would run and runs none of them.

## Behaviour

Each target maps to one command: `compile` to `bun run compile`, `test` to `bun run test`, `test-zig` to `bun run test:zig` and `test-smoke` to `bun run test:smoke`. A target with no command in the script stops the run with an error.

Each of those `package.json` commands ends with `what-changed baseline capture <target>`, chained with `&&`, so a check records its baseline when it passes however it was started. The script stops at the first check that fails and exits non-zero.
