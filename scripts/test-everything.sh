#!/usr/bin/env bash

# Runs the checks whose watched files changed since each last passed, as what-changed reports them.
# Each check's own package.json command records its baseline when it passes, so this script only
# decides what to run. See test-everything.md.

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

FORCE=false
PLAN_ONLY=false

for ARGUMENT in "$@"; do
    case "$ARGUMENT" in
        --force)
            FORCE=true
            ;;
        --plan)
            PLAN_ONLY=true
            ;;
        *)
            echo "Unknown option \"$ARGUMENT\". Known options: --force, --plan." >&2
            exit 1
            ;;
    esac
done

#
# Runs the command of one what-changed target. A target in what-changed.yaml with no command here
# is a mistake in this script, so it stops the run.
#
run_target() {
    case "$1" in
        compile)
            bun run compile
            ;;
        test)
            bun run test
            ;;
        test-zig)
            bun run test:zig
            ;;
        test-smoke)
            bun run test:smoke
            ;;
        *)
            echo "ERROR: what-changed.yaml has the target '$1', which test-everything.sh has no command for. Add it to run_target." >&2
            exit 1
            ;;
    esac
}

cd "$APP_DIR"

if [ "$FORCE" = true ]; then
    REPORT="$(what-changed targets list)"
else
    REPORT="$(what-changed targets)"
fi

TARGETS=()
while IFS= read -r LINE; do
    if [ -n "$LINE" ]; then
        TARGETS+=("$LINE")
    fi
done <<< "$REPORT"

if [ ${#TARGETS[@]} -eq 0 ]; then
    echo "Nothing to run: no watched file changed since each check last passed. Use --force to run every check."
    exit 0
fi

echo "Checks to run: ${TARGETS[*]}"
if [ "$PLAN_ONLY" = true ]; then
    echo "--plan given, running nothing."
    exit 0
fi

#
# set -e ends the run at the first check that fails.
#
for TARGET_NAME in "${TARGETS[@]}"; do
    echo "=== $TARGET_NAME ==="
    run_target "$TARGET_NAME"
done

echo "Passed: ${TARGETS[*]}"
