#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, on a test repo of its own and uses the breadcrumb
# trail's drop-down on the About and Help pages: picks the other page, checks it opens, then picks
# the page shown and checks the drop-down closes on the same page. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
wait_for_text breadcrumb-page "About" 30

# The About page's drop-down lists Help and About. Help opens the Help page.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
wait_for_text breadcrumb-option-help "Help" 30
wait_for_text breadcrumb-option-about "About" 30
click breadcrumb-option-help
wait_for_element help-page 30
wait_for_text breadcrumb-page "Help" 30
wait_for_missing_element breadcrumb-page-menu 30

# The Help page's drop-down picks the Help page shown, which only closes it.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
click breadcrumb-option-help
wait_for_missing_element breadcrumb-page-menu 30
wait_for_element help-page 30
wait_for_text breadcrumb-page "Help" 30

# The Help page's drop-down opens the About page.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
click breadcrumb-option-about
wait_for_element about-page 30
wait_for_text breadcrumb-page "About" 30
wait_for_missing_element breadcrumb-page-menu 30

# The About page's drop-down picks the About page shown, which only closes it.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
click breadcrumb-option-about
wait_for_missing_element breadcrumb-page-menu 30
wait_for_element about-page 30
