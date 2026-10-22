#!/usr/bin/env bash

# Runs the checks whose watched files changed since each last passed, as what-changed reports them,
# and records each check's baseline as soon as it passes. See check-changed.md.

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

#
# Prints how to run this script.
#
print_usage() {
    echo "Usage: check-changed.sh <changed|all|plan>" >&2
    echo "  changed  Run the checks what-changed reports as changed." >&2
    echo "  all      Run every check that can run on this machine." >&2
    echo "  plan     Print the checks that changed and run none of them." >&2
}

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
            echo "ERROR: what-changed.yaml has the target '$1', which check-changed.sh has no command for. Add it to run_target." >&2
            exit 1
            ;;
    esac
}

if [ $# -ne 1 ]; then
    print_usage
    exit 2
fi

MODE="$1"
cd "$APP_DIR"

case "$MODE" in
    changed|plan)
        REPORT="$(what-changed targets)"
        ;;
    all)
        REPORT="$(what-changed targets list)"
        ;;
    *)
        echo "ERROR: unknown mode '$MODE'." >&2
        print_usage
        exit 2
        ;;
esac

TARGETS=()
while IFS= read -r line; do
    if [ -n "$line" ]; then
        TARGETS+=("$line")
    fi
done <<< "$REPORT"

if [ ${#TARGETS[@]} -eq 0 ]; then
    echo "No checks to run: no watched file changed since each check last passed."
    exit 0
fi

echo "Checks to run: ${TARGETS[*]}"
if [ "$MODE" = "plan" ]; then
    exit 0
fi

#
# Each check's baseline is captured right after that check passes, and only that check's. set -e
# ends the run at the first failure, before its capture, so a failed check stays reported as
# changed. The capture is here rather than in package.json, because bun run appends any extra
# arguments to the end of a script, and a run of one smoke test or one Jest file must not record a
# pass for the whole check.
#
for target in "${TARGETS[@]}"; do
    echo "=== $target ==="
    run_target "$target"
    what-changed baseline capture "$target"
done

echo "Passed: ${TARGETS[*]}"
