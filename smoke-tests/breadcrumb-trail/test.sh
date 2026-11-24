#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, checks the welcome page's breadcrumb
# trail is "Welcome" with no repo step, opens a test repo of its own with the welcome page's Open
# repo button, then goes to the About, repo explorer and Help pages and checks the trail in the top
# bar on each starts with the repo's name and ends with the page's. On the repo explorer page it
# opens the commit pane, a commit and its file, then the changes pane and a changed file, and checks
# the trail gains and loses a step for each pane as it opens and closes. Last it goes to the welcome
# page and checks its trail is "Welcome" alone with the repo open. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

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
wait_for_missing_element breadcrumb-pane-commits 30

open_commit_pane
wait_for_text breadcrumb-pane-commits "Commits" 30
wait_for_in_view breadcrumb-pane-commits 30
# The commit pane shows before its commit list has read and drawn the commits, and click fails at
# once when the element is missing. The Release macOS arm64 workflow failed here with "No element
# has the data-id commit-<hash>", so the test waits for the row first.
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_text breadcrumb-pane-commit "${head_hash:0:7}" 30
wait_for_in_view breadcrumb-pane-commit 30
click changed-file-notes.txt
wait_for_text breadcrumb-pane-file "notes.txt" 30
wait_for_in_view breadcrumb-pane-file 30
wait_for_text breadcrumb-page "Repo explorer" 5
wait_for_text breadcrumb-repo "repo" 5
click file-pane-close
wait_for_missing_element breadcrumb-pane-file 30
wait_for_element breadcrumb-pane-commit 5

printf 'The changed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
click repo-details-commit
wait_for_text breadcrumb-pane-changes "Commit" 30
wait_for_missing_element breadcrumb-pane-commits 30
wait_for_missing_element breadcrumb-pane-commit 30
click "change-unstaged-notes.txt"
wait_for_text breadcrumb-pane-file "notes.txt" 30
wait_for_in_view breadcrumb-pane-file 30

open_sidebar_page help
wait_for_text help-heading "Help" 30
wait_for_missing_element breadcrumb-pane-changes 30
wait_for_missing_element breadcrumb-pane-file 30
wait_for_text breadcrumb-repo "repo" 30
wait_for_in_view breadcrumb-repo 30
wait_for_text breadcrumb-page "Help" 30

open_sidebar_page welcome
wait_for_text breadcrumb-page "Welcome" 30
wait_for_missing_element breadcrumb-repo 30
