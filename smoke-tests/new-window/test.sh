#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, opens a new window from the File
# menu's New window item and another with its shortcut CmdOrCtrl+N. It checks each new window is
# a running process of its own and opens on the welcome page with no repo open. It closes the last
# window and checks its process ends and the other two keep running. Then `?` shows the keyboard
# shortcuts overlay and the test checks it lists New window with its shortcut. It reaches each new
# window through the remote control server, with the window's number added to its commands. See
# test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# New window's shortcut as Ziggy shows it on the platform: Command and N on macOS, Ctrl+N elsewhere.
#
new_window_keys="Ctrl+N"
if [ "$ZIGGY_SMOKE_PLATFORM" = "macos" ]; then
    new_window_keys="⌘N"
fi

#
# Sends the command to the window and prints the reply line. The window goes into the command as a
# JSON number, which the remote control server reads to pick the window. Called inside $( ), where a
# fail exits only that subshell, so every caller ends the scenario with `|| exit 1`.
# Usage: window_control <window> <json>
#
window_control() {
    local command
    command="$(printf '%s' "$2" | jq -c --argjson window "$1" '. + {window: $window}')" || fail "could not add window $1 to the command: $2"
    control "$command" || exit 1
}

#
# Waits until the window's frontend returns ok for a ready command, which means its process has
# started, it has connected to the remote control server and its page has loaded.
# Usage: wait_for_window_ready <window>
#
wait_for_window_ready() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$WAIT_TIMEOUT_SECONDS" ]; do
        answer="$(window_control "$1" '{"command":"ready"}')" || exit 1
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "window $1 never returned ok for a ready command. The last reply was: $answer"
}

#
# Waits until the window shows the welcome page with no repo open: the welcome page and its
# heading with no repo step in the trail. Usage: wait_for_welcome_page <window>
#
wait_for_welcome_page() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$WAIT_TIMEOUT_SECONDS" ]; do
        answer="$(window_control "$1" '{"command":"get-text","dataId":"welcome-heading"}')" || exit 1
        if [ "$(printf '%s' "$answer" | jq -r '.value')" = "Graft" ]; then
            break
        fi
        sleep 1
        waited=$((waited + 1))
    done
    if [ "$(printf '%s' "$answer" | jq -r '.value')" != "Graft" ]; then
        fail "window $1 never showed the welcome page. The last reply was: $answer"
    fi
    answer="$(window_control "$1" '{"command":"exists","dataId":"breadcrumb-repo"}')" || exit 1
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "false" ]; then
        fail "window $1 opened with a repo open: $answer"
    fi
}

#
# Prints the process id of the new window window 1 started in the order given, from the line
# Ziggy writes to window 1's log for each: "Started a new window, process <pid>."
# Usage: started_window_pid <order>
#
started_window_pid() {
    local pid
    pid="$(sed -n 's/^Started a new window, process \([0-9]*\)\.$/\1/p' "$ZIGGY_TEST_DIR/app.log" | sed -n "${1}p")"
    if [ -z "$pid" ]; then
        fail "window 1's log has no line for new window $1"
    fi
    printf '%s' "$pid"
}

#
# Succeeds when the process is running. Windows' process ids are read from its task list, because
# Git Bash's kill does not know them. Usage: process_running <pid>
#
process_running() {
    if [ "$ZIGGY_SMOKE_PLATFORM" = "windows" ]; then
        tasklist //fo csv //nh //fi "PID eq $1" | grep -q "\"$1\""
    else
        kill -0 "$1" 2>/dev/null
    fi
}

#
# Waits until the process has ended. Fails when it is still running after the wait.
# Usage: wait_for_process_end <pid> <name>
#
wait_for_process_end() {
    local waited=0
    while process_running "$1"; do
        if [ "$waited" -ge "$WAIT_TIMEOUT_SECONDS" ]; then
            fail "$2's process $1 was still running $WAIT_TIMEOUT_SECONDS seconds after its window closed"
        fi
        sleep 1
        waited=$((waited + 1))
    done
}

start_app_on_start_page

# The File menu's New window item starts window 2, which opens on the welcome page.
choose_menu_item new-window
wait_for_window_ready 2
wait_for_welcome_page 2

# New window's shortcut starts window 3, which opens on the welcome page too.
press_key CmdOrCtrl+N
wait_for_window_ready 3
wait_for_welcome_page 3

# Every window is running, each as a process of its own.
wait_for_window_ready 1
wait_for_window_ready 2
wait_for_window_ready 3
window_two_pid="$(started_window_pid 1)" || exit 1
window_three_pid="$(started_window_pid 2)" || exit 1
if [ "$window_two_pid" = "$window_three_pid" ]; then
    fail "windows 2 and 3 have the same process, $window_two_pid"
fi
process_running "$window_two_pid" || fail "window 2's process $window_two_pid is not running"
process_running "$window_three_pid" || fail "window 3's process $window_three_pid is not running"

# Closing window 3 ends its process and leaves windows 1 and 2 running.
answer="$(window_control 3 '{"command":"menu","action":"close-window"}')" || exit 1
if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
    fail "closing window 3 failed: $answer"
fi
wait_for_process_end "$window_three_pid" "window 3"
process_running "$window_two_pid" || fail "window 2's process $window_two_pid stopped when window 3 closed"
wait_for_window_ready 1
wait_for_welcome_page 1
wait_for_window_ready 2
wait_for_welcome_page 2

# The keyboard shortcuts overlay lists New window with its shortcut.
press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcut-new-window-label "New window" 30
wait_for_text shortcut-new-window-keys "$new_window_keys" 30
