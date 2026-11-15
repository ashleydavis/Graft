#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, presses Open repo's shortcut
# CmdOrCtrl+O as a user does and checks the commit explorer shows the test repo given to the folder
# picker. Then `?` shows the keyboard shortcuts overlay and the test checks it lists Open repo with
# its shortcut. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/shortcut-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Open repo's shortcut as Ziggy shows it on the platform: Command and O on macOS, Ctrl+O elsewhere.
#
open_repo_keys="Ctrl+O"
if [ "$ZIGGY_SMOKE_PLATFORM" = "macos" ]; then
    open_repo_keys="⌘O"
fi

start_test_app
wait_for_element about-page 30
wait_for_missing_element breadcrumb-repo 30

# The next folder picker returns the test repo as chosen, so it shows no dialog.
answer="$(control "$(jq -nc --arg path "$repo" '{command: "pick-answer", paths: [$path]}')")"
if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
    fail "answering the folder picker with $repo failed: $answer"
fi

press_key CmdOrCtrl+O
wait_for_element commits-page 30
wait_for_text commit-list "Add the readme" 30
wait_for_text breadcrumb-repo "shortcut-repo" 30

press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcut-open-repo-label "Open repo" 30
wait_for_text shortcut-open-repo-keys "$open_repo_keys" 30
