#!/usr/bin/env bash

#
# Starts the real app with remote control on, opens a test repo of its own with the welcome page's
# Open repo button and changes from the repo explorer page to the About page and back through the
# left sidebar's links. It then starts the app again, with no repo open, and opens the repo
# explorer page with Ctrl+1. It fails when the repo explorer page's own text holds "Repo explorer"
# or "About", with a repo open and with none, because the breadcrumb trail names the page.
# See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Fails when the repo explorer page shows a title or an About link of its own, which the
# breadcrumb trail makes redundant.
#
check_no_redundant_page_text() {
    local shown
    shown="$(text_of repo-explorer-page)"
    case "$shown" in
        *"Repo explorer"*|*"About"*)
            fail "the repo explorer page shows a title or an About link: $shown"
            ;;
    esac
}

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page repo-explorer
wait_for_text breadcrumb-page "Repo explorer" 30
wait_for_text repo-details-path "$repo" 30
check_no_redundant_page_text
open_sidebar_page about
wait_for_text about-heading "About Graft" 30
wait_for_text breadcrumb-page "About" 30
open_sidebar_page repo-explorer
wait_for_text breadcrumb-page "Repo explorer" 30
wait_for_element repo-details-pane 30

#
# Graft starts with no repo open, so a new start shows the repo explorer page with no repo.
#
restart_app_on_start_page
press_key CmdOrCtrl+1
wait_for_element repo-explorer-page 30
wait_for_text repo-explorer-no-repo "No repo is open." 30
wait_for_text breadcrumb-page "Repo explorer" 30
check_no_redundant_page_text
