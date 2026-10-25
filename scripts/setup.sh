#!/usr/bin/env bash

# Sets up what the template's builds need on this machine. See setup.md.

set -eu

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

case "$(uname -s)" in
    MINGW*|MSYS*|CYGWIN*)
        bash "$SCRIPT_DIR/setup-windows.sh"
        ;;
esac
