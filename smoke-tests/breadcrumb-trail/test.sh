#!/usr/bin/env bash

#
# Starts the real app with remote control on, on a test repo of its own, goes to the About,
# commits and Help pages and checks the breadcrumb trail in the top bar on each. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_app_on_start_page
open_sidebar_page about
wait_for_element top-bar-trail 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "About" 30

open_sidebar_page commits
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "Commits" 30

open_sidebar_page help
wait_for_text help-heading "Help" 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_text breadcrumb-page "Help" 30
