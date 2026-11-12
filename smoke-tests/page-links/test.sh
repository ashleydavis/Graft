#!/usr/bin/env bash

#
# Starts the real app with remote control on, on a test repo of its own and changes from the
# About page to the commits page through the left sidebar's link and back through the commits
# page's link. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element welcome-page 30
click left-sidebar-commits-link
wait_for_element commits-page 30
wait_for_text commits-heading "Commits" 30
click commits-about-link
wait_for_element about-page 30
wait_for_text about-heading "About Graft" 30
