#!/usr/bin/env bash

#
# Starts the real app with remote control on, zooms in two steps with Ctrl+Plus, waits until
# Graft's state file holds the zoom level 1.2, starts Graft again and checks it starts zoomed in to
# the same size. Ctrl+0 then puts it back to the actual size, and after another start Graft starts
# at the actual size. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# Waits until Graft's state file holds the value at the key path.
# Usage: wait_for_saved_state <key path> <value>
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

#
# Waits until the area the frontend is drawn in is a size other than the one given, and prints
# the new size. Usage: wait_for_viewport_other_than <size>
#
wait_for_viewport_other_than() {
    local waited=0
    local now
    while [ "$waited" -lt 300 ]; do
        now="$(viewport_size)"
        if [ "$now" != "$1" ]; then
            printf '%s\n' "$now"
            return 0
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    fail "the area the frontend is drawn in stayed $1, so the zoom did not change"
}

#
# Waits until the area the frontend is drawn in is the size given. Usage: wait_for_viewport <size>
#
wait_for_viewport() {
    local waited=0
    while [ "$waited" -lt 300 ]; do
        if [ "$(viewport_size)" = "$1" ]; then
            return 0
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    fail "the area the frontend is drawn in never became $1. It is $(viewport_size)"
}

start_test_app
wait_for_element welcome-page 30
actual_size="$(viewport_size)"

press_key CmdOrCtrl+Plus
wait_for_saved_state zoom.level 1.1
one_step_in="$(wait_for_viewport_other_than "$actual_size")" || exit 1
press_key CmdOrCtrl+Plus
wait_for_saved_state zoom.level 1.2
two_steps_in="$(wait_for_viewport_other_than "$one_step_in")" || exit 1

# The next run starts zoomed in to the saved level.
restart_test_app
wait_for_element welcome-page 30
wait_for_viewport "$two_steps_in"

press_key CmdOrCtrl+0
wait_for_saved_state zoom.level 1
wait_for_viewport "$actual_size"

# The next run starts at the actual size.
restart_test_app
wait_for_element welcome-page 30
wait_for_viewport "$actual_size"
