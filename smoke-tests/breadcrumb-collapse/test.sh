#!/usr/bin/env bash

#
# Starts the real app with remote control on, opens a test repo of its own with the welcome page's
# Open repo button and opens every pane of the repo explorer, so the trail is at its longest. It
# zooms in with Ctrl+Plus, which leaves the trail less room, until the trail collapses steps, then
# checks the first and last steps are inside the window and inside the top bar, that clicking the
# collapsed step lists the hidden steps from "Repo explorer" on and that Escape closes the list.
# Then Ctrl+0 widens the page again and it checks the collapsed step has gone and every step is
# back. Last it zooms in again on the Help page and checks its trail is inside the window and the
# top bar. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The most Ctrl+Plus presses the test waits through for the trail to collapse. Each step zooms in
# by a tenth, so 20 steps triple the page's size, which leaves the trail far less room than it
# needs in any window the platforms open.
#
ZOOM_STEP_COUNT_MAX=20

#
# Checks the step with the data-id is inside the window from side to side and inside the top bar
# from top to bottom, so it has not wrapped above the window or below the bar.
# Usage: check_step_in_top_bar <data-id>
#
check_step_in_top_bar() {
    wait_for_in_view "$1" 30
    wait_for_in_view_of "$1" top-bar 30
}

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element changed-file-notes.txt 30
click changed-file-notes.txt
wait_for_text breadcrumb-pane-file "notes.txt" 30
wait_for_missing_element breadcrumb-collapsed 5

zoom_step_count=0
while [ "$(control '{"command":"exists","dataId":"breadcrumb-collapsed"}' | jq -r '.ok')" != "true" ]; do
    if [ "$zoom_step_count" -ge "$ZOOM_STEP_COUNT_MAX" ]; then
        fail "the trail never collapsed a step, even $ZOOM_STEP_COUNT_MAX zoom steps in, where the page is $(viewport_size)"
    fi
    press_key CmdOrCtrl+Plus
    zoom_step_count=$((zoom_step_count + 1))
    sleep 1
done

check_step_in_top_bar breadcrumb-repo
check_step_in_top_bar breadcrumb-collapsed
check_step_in_top_bar breadcrumb-pane-file
wait_for_missing_element breadcrumb-page 5

click breadcrumb-collapsed
wait_for_element breadcrumb-collapsed-menu 30
wait_for_text breadcrumb-page-collapsed "Repo explorer" 30
press_key Escape
wait_for_missing_element breadcrumb-collapsed-menu 30

press_key CmdOrCtrl+0
wait_for_missing_element breadcrumb-collapsed 30
check_step_in_top_bar breadcrumb-repo
check_step_in_top_bar breadcrumb-page
check_step_in_top_bar breadcrumb-pane-commits
check_step_in_top_bar breadcrumb-pane-commit
check_step_in_top_bar breadcrumb-pane-file

open_sidebar_page help
step=0
while [ "$step" -lt "$zoom_step_count" ]; do
    press_key CmdOrCtrl+Plus
    step=$((step + 1))
done
wait_for_text breadcrumb-page "Help" 30
check_step_in_top_bar breadcrumb-repo
check_step_in_top_bar breadcrumb-page
