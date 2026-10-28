#!/usr/bin/env bash

# Installs .githooks/pre-commit as this repository's Git pre-commit hook, by linking it into the
# repository's hooks directory. See install-hooks.md.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APP_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

if [ $# -ne 1 ] || [ "$1" != "install" ]; then
    echo "Usage: install-hooks.sh install" >&2
    echo "  install  Links .githooks/pre-commit into this repository's hooks directory." >&2
    exit 2
fi

HOOK_SOURCE="$APP_DIR/.githooks/pre-commit"
if [ ! -f "$HOOK_SOURCE" ]; then
    echo "ERROR: there is no hook at $HOOK_SOURCE. Run this from a checkout of Graft." >&2
    exit 1
fi

#
# The common directory, not the worktree's own git directory: every worktree of a repository
# shares the one hooks directory, so one install covers them all.
#
HOOKS_DIR="$(git -C "$APP_DIR" rev-parse --path-format=absolute --git-common-dir)/hooks"
HOOK_TARGET="$HOOKS_DIR/pre-commit"

#
# A link to this hook is replaced, so the install can be run again. Any other pre-commit hook is
# someone's own and is never overwritten.
#
if [ -e "$HOOK_TARGET" ] || [ -L "$HOOK_TARGET" ]; then
    if [ ! -L "$HOOK_TARGET" ]; then
        echo "ERROR: $HOOK_TARGET is already a hook that is not a link to this one. Move it aside, then run this again." >&2
        exit 1
    fi
fi

mkdir -p "$HOOKS_DIR"
ln -sfn "$HOOK_SOURCE" "$HOOK_TARGET"

echo "Installed the pre-commit hook: $HOOK_TARGET links to $HOOK_SOURCE."
echo "Each commit runs scripts/test-everything.sh. Skip it for one commit with git commit --no-verify."
