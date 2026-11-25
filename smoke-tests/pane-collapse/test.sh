#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button, opens the commit pane on the repo explorer
# page, collapses it with its collapse button and checks the strip shows its title, restores it with
# the strip's restore button, then does the same with the C key. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_text commit-list "Add the readme" 30

#
# The collapse button folds the commit pane into a strip with "Commits" down it, and clicking it
# makes the commit pane active, so C acts on it next.
#
click commit-pane-collapse
wait_for_missing_element commit-pane 30
wait_for_text commit-pane-strip-title "Commits" 30

#
# The strip's restore button brings the pane back with its commits.
#
click commit-pane-restore
wait_for_missing_element commit-pane-strip 30
wait_for_text commit-list "Add the readme" 30

#
# C collapses the active pane, the commit pane, and C again restores it.
#
press_key c
wait_for_missing_element commit-pane 30
wait_for_text commit-pane-strip-title "Commits" 30
press_key c
wait_for_missing_element commit-pane-strip 30
wait_for_text commit-list "Add the readme" 30
