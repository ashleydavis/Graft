#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# the commit pane and a commit's details, gives the keyboard focus to the resize handle after the
# commit pane and presses Right, then checks the commit pane is 16 pixels wider and Graft's state
# file holds its width. It starts Graft again and checks the commit pane opens at that width, then
# double-clicks the handle and checks the pane is back to its starting width and its width is gone
# from the state file. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"
state_file="$ZIGGY_TEST_DIR/state/state.json"

#
# Waits until Graft's state file holds the value at the key path, written as jq writes it, so null
# matches a key missing from the file. Usage: wait_for_saved_state <key path> <value>
#
wait_for_saved_state() {
    local waited=0
    while [ "$(jq -c --arg path "$1" 'getpath($path | split("."))' "$state_file" 2>/dev/null)" != "$2" ]; do
        if [ "$waited" -ge 300 ]; then
            cat "$state_file" >&2 2>/dev/null
            fail "the state file $state_file did not hold $2 at $1 within 30 seconds"
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
}

#
# Waits until the element with the data-id is the width given, in whole pixels.
# Usage: wait_for_width <data-id> <width>
#
wait_for_width() {
    local waited=0
    while [ "$(width_of "$1")" != "$2" ]; do
        if [ "$waited" -ge 300 ]; then
            fail "$1 did not become $2 pixels wide within 30 seconds. It is $(width_of "$1") pixels wide"
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
}

#
# Opens the test repo's newest commit in the commit details pane, so the commit pane has a pane to
# its right and its resize handle shows.
#
open_newest_commit() {
    open_repo_with_button "$repo"
    open_sidebar_page repo-explorer
    open_commit_pane
    wait_for_element "commit-$head_hash" 30
    click "commit-$head_hash"
    wait_for_element commit-details-pane 30
    wait_for_element commit-pane-resize-handle 30
}

start_app_on_start_page
open_newest_commit
starting_width="$(width_of commit-pane)"
wider_width=$((starting_width + 16))

focus_element commit-pane-resize-handle
press_key Right
wait_for_width commit-pane "$wider_width"
wait_for_saved_state paneWidths.commits "$wider_width"

# The next run opens the commit pane at the saved width.
restart_app_on_start_page
open_newest_commit
wait_for_width commit-pane "$wider_width"

double_click commit-pane-resize-handle
wait_for_width commit-pane "$starting_width"
wait_for_saved_state paneWidths.commits null
