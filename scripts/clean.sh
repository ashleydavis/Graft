#!/usr/bin/env bash

# Removes the template's build output on every platform this machine can build for. See clean.md.

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

for platform in linux windows; do
    bash "$SCRIPT_DIR/clean-$platform.sh"
done

if [ "$(uname -s)" = "Darwin" ]; then
    bash "$SCRIPT_DIR/clean-macos.sh"
fi
