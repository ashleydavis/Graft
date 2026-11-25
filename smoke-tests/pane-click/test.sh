#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button and checks that clicking the file pane's title
# bar makes the file pane the active pane and clicking the repo details pane's empty space makes
# it active: the keys then act from the clicked pane. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt, and its parent,
# "Add the notes".
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"
notes_hash="$(git -C "$repo" rev-parse HEAD~1)" || fail "could not read the parent of the test repo's newest commit"

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page repo-explorer
open_commit_pane
wait_for_text "commit-$head_hash" "Change the note" 30

# Clicking the newest commit and its changed file opens the file pane with the commit details pane
# active.
click "commit-$head_hash"
wait_for_commit_heading "${head_hash:0:7}"
wait_for_text changed-file-notes.txt "notes.txt" 30
click changed-file-notes.txt
wait_for_element file-pane 30
wait_for_text file-diff "The second note." 30

# Clicking the file pane's title bar makes the file pane active. Left twice then makes the commit
# pane active, where Down selects the second commit and Enter opens it. Had the commit details pane
# stayed active, Left twice would reach the repo details pane, where Down and Enter open the changes
# pane instead.
click file-pane-path
press_key Left
press_key Left
press_key Down
press_key Enter
wait_for_commit_heading "${notes_hash:0:7}"
wait_for_missing_element changes-pane 5

# Clicking the repo details pane's empty space makes it active. Down then selects its Changes link
# and Enter opens the changes pane. Had the commit details pane stayed active, Down would select a
# file there and Enter would open its file pane instead.
click repo-details-pane
press_key Down
press_key Enter
wait_for_element changes-pane 30
