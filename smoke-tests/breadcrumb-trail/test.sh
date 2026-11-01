#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, on a test repo of its own, goes to the About,
# commits and Help pages and checks the breadcrumb trail in the top bar on each. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
wait_for_element top-bar-trail 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "About" 30

click left-sidebar-commits-link
wait_for_element commits-page 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "Commits" 30

click left-sidebar-help-link
wait_for_element help-page 30
wait_for_text help-heading "Help" 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "Help" 30
