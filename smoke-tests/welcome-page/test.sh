#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, checks it opens on the welcome page
# with Graft's mark, name, what Graft is and its Open repo button, cancels the button's folder
# picker, then opens a test repo of its own with the button and checks the commit explorer shows
# it. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/welcome-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
wait_for_element welcome-icon 30
wait_for_text welcome-heading "Graft" 30
wait_for_text welcome-description "A desktop Git client. Open a local Git repo to see its commits." 30
wait_for_text welcome-open-repo-button "Open repo" 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30

answer_picker
click welcome-open-repo-button
sleep 3
wait_for_element welcome-page 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30

open_repo_with_button "$repo"
wait_for_element commit-list 30
wait_for_text commit-list "Add the readme" 30
wait_for_text breadcrumb-repo "welcome-repo" 30
wait_for_text breadcrumb-page "Commits" 30
wait_for_element left-sidebar-commits-link 30
wait_for_missing_element welcome-page 30
