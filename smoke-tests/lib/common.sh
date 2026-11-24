#!/usr/bin/env bash

# What every scenario uses: start the app, talk to it through the remote control server, and check what the frontend shows.
#
# A scenario sources this file. It defines functions only. The platform library chosen by the runner implements:
#
#   ziggy_platform_prepare <run_dir>
#       Puts the built app in the run directory: from the build directory ZIGGY_SMOKE_BUILD names when it is set, or else one the
#       platform's build script builds into the run directory. Returns non-zero when the build or the install fails.
#
#   ziggy_platform_start <test_dir> [keep-data]
#       Starts the app for one scenario with --remote-control "$ZIGGY_REMOTE_CONTROL", or without it when ZIGGY_REMOTE_CONTROL is
#       empty, and with --theme "$ZIGGY_THEME" when ZIGGY_THEME is set, with config and state directories of the scenario's own,
#       recording what it started through launch_in_process_group. The app connects to the remote control server that
#       start_test_app started. Returns non-zero when the app did not start. With keep-data it starts the app again on the data the
#       last run left, instead of fresh data.
#
#   ziggy_platform_stop <test_dir> [keep-device]
#       Stops the app and everything it started.
#
#   ziggy_platform_devtools_visible <test_dir> <the frontend's area before they opened>   (desktop platforms)
#       Succeeds when the developer tools are showing. How a script sees them differs: on Linux and macOS they dock inside the
#       window and shrink the frontend's area, and on Windows they are a window of their own.
#
#   ziggy_platform_leave_app <test_dir>
#       Takes the app out of the user's sight without ending it: it closes the window (the File menu's Close Window). Returns non-zero
#       when it cannot.
#
#   ziggy_platform_process_alive <test_dir>
#       Succeeds when the app's process is running, whether or not its window is in sight.
#
#   ziggy_platform_data_dir <test_dir>
#       Prints the directory the app uses for its private data in this scenario, when the host can read it, or nothing.

set -u

SCENARIO_NAME="$(basename "$(dirname "${BASH_SOURCE[1]}")")"
source "$ZIGGY_SMOKE_DIR/lib/process-control.sh"
source "$ZIGGY_SMOKE_DIR/lib/$ZIGGY_SMOKE_PLATFORM.sh"


# Seconds the frontend has to show something before a wait gives up.
WAIT_TIMEOUT_SECONDS=60

fail() {
    echo "FAILED: $*" >&2
    exit 1
}

#
# Stops the app and the remote control server when the scenario ends, however it ends.
#
stop_app_on_exit() {
    ziggy_platform_stop "$ZIGGY_TEST_DIR" || true
    stop_remote_control_server
}
trap stop_app_on_exit EXIT

#
# Starts the remote control server for this scenario on ports the system chooses, recording it through launch_in_process_group,
# and waits until it listens. Sets ZIGGY_CONTROL_HOST and ZIGGY_CONTROL_PORT to where the script connects, and ZIGGY_REMOTE_CONTROL
# to the address the app is started with. The server's stdin is a pipe whose writing end this scenario keeps open on file descriptor
# 4, so the server ends when the scenario does, however the scenario ends. A pipe works on every platform, where a FIFO does not
# reach a native Windows program. A job launch_in_process_group starts from inside the process substitution is given /dev/null
# as its stdin, so the pipe is passed on file descriptor 5 and the server's shell moves it to stdin.
#
start_remote_control_server() {
    local log="$ZIGGY_TEST_DIR/remote-control-server.log"
    local launched="$ZIGGY_TEST_DIR/remote-control-server.launched"
    rm -f "$launched"
    exec 4> >(launch_in_process_group "$log" bash -c 'exec 0<&5 5<&-; cd "$1" && exec bun run ziggy-remote-control-server --app-port 0 --script-port 0' \
        remote-control-server "$ZIGGY_SMOKE_APP_DIR" 5<&0 > "$launched")
    local waited=0
    local pid pgid ports
    while true; do
        if [ -s "$launched" ]; then
            read -r pid pgid < "$launched"
            echo "$pgid" > "$ZIGGY_TEST_DIR/remote-control-server.pgid"
            ports="$(sed -n 's/^The remote control server is listening: the app on 127\.0\.0\.1:\([0-9]*\), the script on 127\.0\.0\.1:\([0-9]*\)\.$/\1 \2/p' "$log")"
            if [ -n "$ports" ]; then
                break
            fi
            if ! kill -0 "$pid" 2>/dev/null; then
                cat "$log" >&2
                fail "the remote control server ended before it listened"
            fi
        fi
        if [ "$waited" -ge 600 ]; then
            cat "$log" >&2
            fail "the remote control server did not listen within 60 seconds"
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    ZIGGY_CONTROL_HOST=127.0.0.1
    ZIGGY_CONTROL_PORT="${ports#* }"
    ZIGGY_REMOTE_CONTROL="127.0.0.1:${ports%% *}"
    export ZIGGY_CONTROL_HOST ZIGGY_CONTROL_PORT ZIGGY_REMOTE_CONTROL
}

#
# Stops the remote control server, when this scenario started one.
#
stop_remote_control_server() {
    exec 4>&-
    if [ -f "$ZIGGY_TEST_DIR/remote-control-server.pgid" ]; then
        kill_process_group "$(cat "$ZIGGY_TEST_DIR/remote-control-server.pgid")" || true
    fi
}

#
# Starts the remote control server and the app, and opens the control connection.
#
start_test_app() {
    start_remote_control_server
    ziggy_platform_start "$ZIGGY_TEST_DIR" || fail "the app did not start"
    open_control_connection
    wait_for_ready
}

#
# Starts the app as start_test_app does and waits until it shows its start page, the welcome page,
# so every smoke test begins on the page Graft starts on and a change to that page is one edit here.
#
start_app_on_start_page() {
    start_test_app
    wait_for_element welcome-page 30
}

#
# Stops the app and starts it again on the config and state files it kept, then opens the control connection to the new run. A
# scenario uses it to check what Graft remembers from one run to the next.
#
# It starts a new remote control server for the new run, because the old server frees window 1 only once it has seen the old
# app's connection end, and no event orders that before the new app connects. A new server holds no app, so the new app is
# window 1.
#
restart_test_app() {
    exec 3>&-
    ziggy_platform_stop "$ZIGGY_TEST_DIR" keep-device || fail "the app did not stop cleanly before it was started again"
    stop_remote_control_server
    start_remote_control_server
    ziggy_platform_start "$ZIGGY_TEST_DIR" keep-data || fail "the app did not start again"
    open_control_connection
    wait_for_ready
}

#
# Starts the app again as restart_test_app does and waits until it shows its start page, the welcome
# page, as start_app_on_start_page does for the first run.
#
restart_app_on_start_page() {
    restart_test_app
    wait_for_element welcome-page 30
}

#
# Opens the control connection to the remote control server on file descriptor 3. A signal that reaches this script while bash connects, such as the
# exit of a child it started, makes connect fail with "Interrupted system call", which bash reports and does not retry, so that
# failure is tried again. Any other failure ends the scenario.
#
open_control_connection() {
    local error_file="$ZIGGY_TEST_DIR/control-connect-error.txt"
    local attempt=1
    while ! { exec 3<>"/dev/tcp/$ZIGGY_CONTROL_HOST/$ZIGGY_CONTROL_PORT"; } 2>"$error_file"; do
        if ! grep -q "Interrupted system call" "$error_file" || [ "$attempt" -ge 5 ]; then
            cat "$error_file" >&2
            fail "could not connect to the control connection at $ZIGGY_CONTROL_HOST:$ZIGGY_CONTROL_PORT"
        fi
        attempt=$((attempt + 1))
    done
}

#
# Sends one command line on the control connection and prints the reply line. Usage: control <json>
#
control() {
    printf '%s\n' "$1" >&3 || fail "could not write to the control connection"
    local answer
    if ! read -r -t 90 -u 3 answer; then
        # The macOS job of Graft workflow (run 37455466019, scenario 13-menu-edit) failed here with the app gone and
        # nothing to show why, because only the command was reported. The app's own log is what shows whether it crashed.
        if [ -f "$ZIGGY_TEST_DIR/app.log" ]; then
            echo "The app's log:" >&2
            cat "$ZIGGY_TEST_DIR/app.log" >&2
        fi
        # A crash on MacOS is written as a report, which holds the exception and the stack of the thread that crashed.
        for report in "$HOME"/Library/Logs/DiagnosticReports/Graft*; do
            if [ -f "$report" ]; then
                echo "Crash report $report:" >&2
                head -c 20000 "$report" >&2
            fi
        done
        fail "no answer from the control connection to $1"
    fi
    printf '%s\n' "$answer"
}

#
# Waits until the frontend replies to commands, which means it has loaded and the bridge works.
#
wait_for_ready() {
    local waited=0
    local answer
    while [ "$waited" -lt "$WAIT_TIMEOUT_SECONDS" ]; do
        answer="$(control '{"command":"ready"}')"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the UI never answered a ready command"
}

#
# Clicks the element with the data-id. Usage: click <data-id>
#
click() {
    local answer
    answer="$(control "{\"command\":\"click\",\"dataId\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "click $1 failed: $answer"
    fi
}

#
# Opens a page with its link in the left sidebar, as a user does, and waits until the page shows,
# so a change to the sidebar's links is one edit here. <page> is the page's name as it appears in
# the link's data-id, left-sidebar-<page>-link, and in the page's own data-id, <page>-page.
# Usage: open_sidebar_page <page>
#
open_sidebar_page() {
    click "left-sidebar-$1-link"
    wait_for_element "$1-page" 30
}

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

#
# Opens the repo at the path from the welcome page, as a user does: gives the folder picker the
# path, clicks the welcome page's Open repo button and waits until the repo explorer page shows its
# repo details pane. Every smoke test that needs an open repo opens it with this, through Graft's
# normal way of opening a repo. Usage: open_repo_with_button <path>
#
open_repo_with_button() {
    answer_picker "$1"
    click welcome-open-repo-button
    wait_for_element repo-explorer-page 30
    wait_for_element repo-details-pane 30
}

#
# Opens the commit pane of the repo explorer page that shows, as a user does: clicks the repo
# details pane's Commits link and waits until the commit pane shows, so a change to how the commit
# pane opens is one edit here. Usage: open_commit_pane
#
open_commit_pane() {
    click repo-details-commits
    wait_for_element commit-pane 30
}

#
# Prints the text of the element with the data-id. Usage: text_of <data-id>
#
text_of() {
    local answer
    answer="$(control "{\"command\":\"get-text\",\"dataId\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "get-text $1 failed: $answer"
    fi
    printf '%s' "$answer" | jq -r '.value'
}

#
# Sets the value of the text box with the data-id to the text, as typing does. The text reaches jq
# through the environment, as press_key's key does, so any character in it is sent as it is.
# Usage: type_text <data-id> <text>
#
type_text() {
    local line
    line="$(TYPE_DATA_ID="$1" TYPE_TEXT="$2" jq -nc '{command: "type", dataId: env.TYPE_DATA_ID, text: env.TYPE_TEXT}')"
    local answer
    answer="$(control "$line")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "typing into $1 failed: $answer"
    fi
}

#
# Prints the value of the text box with the data-id. Usage: value_of <data-id>
#
value_of() {
    local answer
    answer="$(control "{\"command\":\"get-value\",\"dataId\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "get-value $1 failed: $answer"
    fi
    # jq on Windows writes each newline as CRLF unless given --binary, which only the Windows build
    # of jq accepts. With CRLF a multi-line value never equals the text typed in: the Release
    # Windows workflow failed changes-commit with "the commit message box lost the message".
    if [ "$ZIGGY_SMOKE_PLATFORM" = "windows" ]; then
        printf '%s' "$answer" | jq --binary -r '.value'
    else
        printf '%s' "$answer" | jq -r '.value'
    fi
}

#
# Waits until the text of the element contains the text, and fails with what it did show when it never does.
# Usage: wait_for_text <data-id> <text> [seconds]
#
wait_for_text() {
    local data_id="$1"
    local wanted="$2"
    local seconds="${3:-$WAIT_TIMEOUT_SECONDS}"
    local waited=0
    local shown=""
    while [ "$waited" -lt "$seconds" ]; do
        shown="$(text_of "$data_id")"
        case "$shown" in
            *"$wanted"*)
                return 0
                ;;
        esac
        sleep 1
        waited=$((waited + 1))
    done
    fail "$data_id never showed \"$wanted\". It showed: $shown"
}

#
# Waits until the commit details pane shows the commit title, and fails with what it last showed
# when it never does. Enter on another commit draws the pane afresh, so its title is missing while
# the commit loads, which wait_for_text reports as a failure at once. Up and Down in the commit pane
# draw it afresh in the same way. Usage: wait_for_commit_title <title>
#
wait_for_commit_title() {
    local waited=0
    local result=""
    while [ "$waited" -lt 30 ]; do
        result="$(control '{"command":"get-text","dataId":"commit-details-title"}')"
        if [ "$(printf '%s' "$result" | jq -r '.ok')" = "true" ]; then
            case "$(printf '%s' "$result" | jq -r '.value')" in
                *"$1"*)
                    return 0
                    ;;
            esac
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "commit-details-title never showed \"$1\". The last result was: $result"
}


#
# Waits until the element with the data-id is on the page, and fails when it never is. The
# frontend answers commands before React has drawn the page, and text_of reports a missing
# element as a failure, so the page is waited for first.
# Usage: wait_for_element <data-id> <seconds>
#
wait_for_element() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$2" ]; do
        answer="$(control "{\"command\":\"exists\",\"dataId\":\"$1\"}")"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the page never showed $1. The last answer was: $answer"
}

#
# Waits until the element with the data-id has gone from the page, and fails when it stays. A
# test uses it to check that something the frontend draws only in one state, such as a label or a
# panel's content, has gone.
# Usage: wait_for_missing_element <data-id> <seconds>
#
wait_for_missing_element() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$2" ]; do
        answer="$(control "{\"command\":\"exists\",\"dataId\":\"$1\"}")"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "false" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the page still showed $1. The last answer was: $answer"
}

#
# Waits until the element with the data-id has its left and right edges inside the window, so the
# user can see it, and fails with where its edges are when it never does. A pane that opens beyond
# the window's right edge scrolls into view smoothly, so the scroll is waited for.
# Usage: wait_for_in_view <data-id> <seconds>
#
wait_for_in_view() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$2" ]; do
        answer="$(control "{\"command\":\"in-view\",\"dataId\":\"$1\"}")"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "$1 never came into view. The last answer was: $answer"
}

#
# Scrolls the element with the data-id to the end of its content, as a user does with the mouse
# wheel or the scroll bar. Usage: scroll_to_end <data-id>
#
scroll_to_end() {
    local answer
    answer="$(control "{\"command\":\"scroll-to-end\",\"dataId\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "scrolling $1 to its end failed: $answer"
    fi
}

#
# Waits until the element with the data-id has its top and bottom edges inside the visible part of
# the scrolling element with the container data-id, so the user can see it in that list, and fails
# with where the edges are when it never does.
# Usage: wait_for_in_view_of <data-id> <container-data-id> <seconds>
#
wait_for_in_view_of() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$3" ]; do
        answer="$(control "{\"command\":\"in-view-of\",\"dataId\":\"$1\",\"containerDataId\":\"$2\"}")"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "$1 never came into view in $2. The last answer was: $answer"
}

#
# Chooses a menu item as a user would, through the native app, so the native app's own actions really happen and any other action reaches the
# frontend. Usage: choose_menu_item <action>
#
choose_menu_item() {
    local answer
    answer="$(control "{\"command\":\"menu\",\"action\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "choosing the menu item $1 failed: $answer"
    fi
}

#
# Presses a key as a user does, through the native app, so a shortcut that is broken for a user fails. The key is written as a
# shortcut, such as CmdOrCtrl+Shift+H. Usage: press_key <key>
#
press_key() {
    local line
    # The key reaches jq through the environment, not jq's command line. On Windows jq.exe expands ? and * in its own arguments
    # as wildcards against the file names in the working directory, and with nothing matching it drops the argument, so
    # --arg key "?" made jq print null. The Release Windows workflow failed new-window, open-repo-shortcut, shortcuts-overlay
    # and zoom-keys with "pressing the key ? failed: {"error":"InvalidCommand"}".
    line="$(PRESS_KEY="$1" jq -nc '{command: "press-key", key: env.PRESS_KEY}')"
    local answer
    answer="$(control "$line")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "pressing the key $1 failed: $answer"
    fi
}

#
# Queues the backend task of the type with the data through the frontend, as the frontend queues
# its own tasks, waits for the task to end and prints its result as JSON, so a smoke test can send
# the backend invalid data. The data reaches jq through the environment, as
# press_key's key does. Usage: run_task <task-type> <data-json>
#
run_task() {
    local line
    line="$(RUN_TASK_TYPE="$1" RUN_TASK_DATA="$2" jq -nc '{command: "run-task", taskType: env.RUN_TASK_TYPE, taskData: (env.RUN_TASK_DATA | fromjson)}')" || fail "the data of the $1 task is not JSON: $2"
    local answer
    answer="$(control "$line")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "running the $1 task failed: $answer"
    fi
    printf '%s' "$answer" | jq -r '.value'
}

#
# Prints the size in pixels of the area the frontend is drawn in, as <width>x<height>. Zooming, docking the developer tools and
# going full screen change it.
#
viewport_size() {
    control '{"command":"viewport"}' | jq -r '.value'
}

