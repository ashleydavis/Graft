#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, on a test repo of its own. It checks the left
# sidebar starts expanded, minimises it and expands it again with the top bar's menu button,
# checking the names of its links show only while it is expanded, and follows its links to the
# commits page, the Help page and the About page in each state. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
wait_for_element left-sidebar 30
wait_for_text left-sidebar-commits-link-label "Commits" 30
wait_for_text left-sidebar-help-link-label "Help" 30
wait_for_text left-sidebar-about-link-label "About" 30

click left-sidebar-commits-link
wait_for_element commits-page 30
click left-sidebar-help-link
wait_for_element help-page 30
click left-sidebar-about-link
wait_for_element about-page 30

click left-sidebar-toggle
wait_for_missing_element left-sidebar-commits-link-label 30
wait_for_missing_element left-sidebar-help-link-label 30
wait_for_missing_element left-sidebar-about-link-label 30
wait_for_element left-sidebar-commits-link 30
wait_for_element left-sidebar-help-link 30
wait_for_element left-sidebar-about-link 30

click left-sidebar-commits-link
wait_for_element commits-page 30
click left-sidebar-help-link
wait_for_element help-page 30
click left-sidebar-about-link
wait_for_element about-page 30

click left-sidebar-toggle
wait_for_text left-sidebar-commits-link-label "Commits" 30
wait_for_text left-sidebar-help-link-label "Help" 30
wait_for_text left-sidebar-about-link-label "About" 30
