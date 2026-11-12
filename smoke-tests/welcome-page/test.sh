#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, checks it opens on the welcome page
# with Graft's name and its Open repo button, cancels the button's folder picker, then opens a test
# repo of its own with the button and checks the commit explorer shows it. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/welcome-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Gives the next folder picker the paths, so it shows no dialog and returns them as chosen. No
# paths is a cancelled picker. Usage: answer_picker [path ...]
#
answer_picker() {
    local line
    line="$(jq -nc '{command: "pick-answer", paths: $ARGS.positional}' --args "$@")"
    local answer
    answer="$(control "$line")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "answering the folder picker with $* failed: $answer"
    fi
}

start_test_app
wait_for_element welcome-page 30
wait_for_text welcome-heading "Graft" 30
wait_for_text welcome-open-repo-button "Open repo" 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30

answer_picker
click welcome-open-repo-button
sleep 3
wait_for_element welcome-page 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30

answer_picker "$repo"
click welcome-open-repo-button
wait_for_element commits-page 30
wait_for_element commit-list 30
wait_for_text commit-list "Add the readme" 30
wait_for_text breadcrumb-repo "welcome-repo" 30
wait_for_text breadcrumb-page "Commits" 30
wait_for_element left-sidebar-commits-link 30
wait_for_missing_element welcome-page 30
