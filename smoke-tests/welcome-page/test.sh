#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, checks it opens on the welcome page
# with Graft's mark, name, what Graft is and its Open repo button, cancels the button's folder
# picker, then opens a test repo of its own with the button and checks the repo explorer shows it.
# Last it opens the Help page and the About page from the left sidebar and from each goes back to
# the welcome page with the sidebar's Welcome link, checking the trail shows the welcome page's
# step alone, with no repo step, while the repo is open.
# See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/welcome-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
wait_for_element welcome-icon 30
wait_for_text welcome-heading "Graft" 30
wait_for_text welcome-description "A desktop Git client. Open a local Git repo to start working with it." 30
wait_for_text welcome-open-repo-button "Open repo" 30
wait_for_missing_element left-sidebar-repo-explorer-link 30
wait_for_missing_element breadcrumb-repo 30
wait_for_text breadcrumb-page "Welcome" 30
wait_for_text left-sidebar-welcome-link-label "Welcome" 30

answer_picker
click welcome-open-repo-button
sleep 3
wait_for_element welcome-page 30
wait_for_missing_element left-sidebar-repo-explorer-link 30
wait_for_missing_element breadcrumb-repo 30

open_repo_with_button "$repo"
open_commit_pane
wait_for_element commit-list 30
wait_for_text commit-list "Add the readme" 30
wait_for_text breadcrumb-repo "welcome-repo" 30
wait_for_text breadcrumb-page "Repo explorer" 30
wait_for_element left-sidebar-repo-explorer-link 30
wait_for_missing_element welcome-page 30

open_sidebar_page help
open_sidebar_page welcome
wait_for_text welcome-heading "Graft" 30
wait_for_text breadcrumb-page "Welcome" 30
wait_for_missing_element breadcrumb-repo 30
wait_for_missing_element help-page 30

open_sidebar_page about
wait_for_text breadcrumb-repo "welcome-repo" 30
open_sidebar_page welcome
wait_for_text welcome-heading "Graft" 30
wait_for_text breadcrumb-page "Welcome" 30
wait_for_missing_element breadcrumb-repo 30
wait_for_missing_element about-page 30
