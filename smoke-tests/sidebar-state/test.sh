#!/usr/bin/env bash

#
# Starts the real app with remote control on, minimises the left sidebar and opens the right
# sidebar with the top bar's buttons, waits until Graft's state file holds both, starts Graft
# again and checks both sidebars are as they were left. It then expands the left sidebar and
# closes the right sidebar, starts Graft again and checks both are back as they start. See
# test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# Waits until Graft's state file holds the value at the key path. Usage: wait_for_saved_state <key path> <value>
#
wait_for_saved_state() {
    local state_file="$ZIGGY_TEST_DIR/state/state.json"
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

start_test_app
wait_for_element welcome-page 30
wait_for_text left-sidebar-about-link-label "About" 30
wait_for_missing_element right-sidebar-content 30

click left-sidebar-toggle
wait_for_missing_element left-sidebar-about-link-label 30
click right-sidebar-toggle
wait_for_element right-sidebar-content 30
wait_for_saved_state sidebar.left.minimised true
wait_for_saved_state sidebar.right.open true

restart_test_app
wait_for_element welcome-page 30
wait_for_element right-sidebar-content 30
wait_for_element left-sidebar-about-link 30
wait_for_missing_element left-sidebar-about-link-label 30

click left-sidebar-toggle
wait_for_text left-sidebar-about-link-label "About" 30
click right-sidebar-toggle
wait_for_missing_element right-sidebar-content 30
wait_for_saved_state sidebar.left.minimised false
wait_for_saved_state sidebar.right.open false

restart_test_app
wait_for_element welcome-page 30
wait_for_text left-sidebar-about-link-label "About" 30
wait_for_missing_element right-sidebar-content 30
