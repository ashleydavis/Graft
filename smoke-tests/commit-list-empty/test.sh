#!/usr/bin/env bash

#
# Makes a repo of the smoke test's own with `git init` and no commits, starts the real app with
# remote control on, opens that repo with the welcome page's Open repo button and checks the commit
# list shows "There are no commits." in place of an error. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
git init --quiet "$repo" || fail "could not make the empty repo at $repo"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_text commits-none "There are no commits." 30
wait_for_missing_element commits-loading 5
wait_for_missing_element commits-error 5
wait_for_missing_element commits-end 5
