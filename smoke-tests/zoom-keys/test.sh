#!/usr/bin/env bash

#
# Starts the real app with remote control on and zooms it as a user does: Ctrl+Plus and Ctrl+=
# zoom in, Ctrl+Minus zooms out and Ctrl+0 puts it back to the actual size, then the View menu's
# Zoom In, Zoom Out and Actual Size items do the same. After each it waits until the area the
# frontend is drawn in has the size of that zoom and Graft's state file holds its zoom level. Then
# `?` shows the keyboard shortcuts overlay and it checks the overlay lists the zoom actions
# with their keys. See test.md.
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

#
# The zoom keys as Ziggy shows them on the platform: Command and the key on macOS, Ctrl+ and the
# key elsewhere.
#
zoom_in_keys="Ctrl++"
zoom_out_keys="Ctrl+-"
actual_size_keys="Ctrl+0"
if [ "$ZIGGY_SMOKE_PLATFORM" = "macos" ]; then
    zoom_in_keys="⌘+"
    zoom_out_keys="⌘-"
    actual_size_keys="⌘0"
fi

start_test_app
wait_for_element about-page 30
actual_size="$(viewport_size)"

# The keys.
press_key CmdOrCtrl+Plus
wait_for_saved_state zoom.level 1.1
one_step_in="$(wait_for_viewport_other_than "$actual_size")" || exit 1

press_key CmdOrCtrl+Equal
wait_for_saved_state zoom.level 1.2
two_steps_in="$(wait_for_viewport_other_than "$one_step_in")" || exit 1
if [ "$two_steps_in" = "$actual_size" ]; then
    fail "Ctrl+= put the zoom back to the actual size instead of zooming in"
fi

press_key CmdOrCtrl+Minus
wait_for_saved_state zoom.level 1.1
wait_for_viewport "$one_step_in"

press_key CmdOrCtrl+0
wait_for_saved_state zoom.level 1
wait_for_viewport "$actual_size"

press_key CmdOrCtrl+Minus
wait_for_saved_state zoom.level 0.9
one_step_out="$(wait_for_viewport_other_than "$actual_size")" || exit 1
press_key CmdOrCtrl+0
wait_for_saved_state zoom.level 1
wait_for_viewport "$actual_size"

# The View menu's items.
choose_menu_item zoom-in-step
wait_for_saved_state zoom.level 1.1
wait_for_viewport "$one_step_in"

choose_menu_item zoom-actual-size
wait_for_saved_state zoom.level 1
wait_for_viewport "$actual_size"

choose_menu_item zoom-out-step
wait_for_saved_state zoom.level 0.9
wait_for_viewport "$one_step_out"

choose_menu_item zoom-actual-size
wait_for_saved_state zoom.level 1
wait_for_viewport "$actual_size"

# The overlay lists the zoom actions from Ziggy's action list.
press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcut-zoom-in-step-label "Zoom In" 30
wait_for_text shortcut-zoom-in-step-keys "$zoom_in_keys" 30
wait_for_text shortcut-zoom-out-step-label "Zoom Out" 30
wait_for_text shortcut-zoom-out-step-keys "$zoom_out_keys" 30
wait_for_text shortcut-zoom-actual-size-label "Actual Size" 30
wait_for_text shortcut-zoom-actual-size-keys "$actual_size_keys" 30
press_key Escape
wait_for_missing_element shortcuts-overlay 30
