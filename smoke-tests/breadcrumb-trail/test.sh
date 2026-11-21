#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, checks the welcome page's breadcrumb
# trail is "Welcome" with no repo step, opens a test repo of its own with the welcome page's Open
# repo button, then goes to the About, repo explorer, Help and welcome pages and checks the trail in
# the top bar on each starts with the repo's name and ends with the page's. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
wait_for_element top-bar-trail 30
wait_for_missing_element breadcrumb-repo 30
wait_for_text breadcrumb-page "Welcome" 30

open_repo_with_button "$repo"
open_sidebar_page about
wait_for_text breadcrumb-repo "repo" 30
wait_for_in_view breadcrumb-repo 30
wait_for_text breadcrumb-page "About" 30

open_sidebar_page repo-explorer
wait_for_text breadcrumb-repo "repo" 30
wait_for_in_view breadcrumb-repo 30
wait_for_text breadcrumb-page "Repo explorer" 30

open_sidebar_page help
wait_for_text help-heading "Help" 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_in_view breadcrumb-repo 30
wait_for_text breadcrumb-page "Help" 30

open_sidebar_page welcome
wait_for_text breadcrumb-repo "repo" 30
wait_for_in_view breadcrumb-repo 30
wait_for_text breadcrumb-page "Welcome" 30
