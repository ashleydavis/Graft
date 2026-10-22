# check-changed.sh

Runs the checks whose watched files changed since each last passed, so a change runs only the checks it can affect. what-changed decides which checks changed, from the targets in `what-changed.yaml`. This script runs them. The Git pre-commit hook runs it before every commit.

## Usage

`bash scripts/check-changed.sh <changed|all|plan>`, from anywhere: it runs from the app's directory. `what-changed` and `bun` must be on `PATH`, at the versions `mise.toml` locks.

## Arguments

- `changed`: runs each check `what-changed targets` reports, in the order of `what-changed.yaml`.
- `all`: runs every check that can run on this machine (`what-changed targets list`), changed or not.
- `plan`: prints the checks that changed and runs none of them.

## Behaviour

Each target maps to one command: `compile` to `bun run compile`, `test` to `bun run test`, `test-zig` to `bun run test:zig` and `test-smoke` to `bun run test:smoke`. A target with no command in the script stops the run with an error.

The script stops at the first check that fails and exits non-zero. Each check that passes has its baseline captured straight away with `what-changed baseline capture <target>`, so a check that failed or did not run keeps being reported as changed. Running a check without this script records no baseline.
