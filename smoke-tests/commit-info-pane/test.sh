#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button, opens the newest commit and clicks the commit
# details pane's "Commit details" row, which opens the commit's message and facts in a pane of
# their own. Down then opens the first file's diff in its place, Up opens the "Commit details" pane
# again and Escape closes it with the commit details pane active. See test.md.
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
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_text commit-details-heading "${head_hash:0:7}" 30
wait_for_text changed-file-notes.txt "notes.txt" 30

# Clicking the "Commit details" row opens the "Commit details" pane with the commit's title, author
# and full hash, and the breadcrumb trail gains a "Commit details" step.
click commit-details-row
wait_for_element commit-info-pane 30
wait_for_text commit-info-heading "Commit details" 30
wait_for_text commit-details-title "Change the note" 30
wait_for_text commit-details-author "Ada Author" 30
wait_for_text commit-details-hash "$head_hash" 30
wait_for_text breadcrumb-pane-commit-details "Commit details" 30

# The click left the commit details pane active, so Down selects the first file and opens its diff
# in place of the "Commit details" pane.
press_key Down
wait_for_element file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_text file-diff "+The second note." 30
wait_for_missing_element commit-info-pane 30

# Up selects the "Commit details" row again and opens its pane in place of the diff.
press_key Up
wait_for_element commit-info-pane 30
wait_for_text commit-details-title "Change the note" 30
wait_for_missing_element file-pane 30

# Escape closes the "Commit details" pane. The commit details pane is then active, so Down, with no
# pane open to its right, opens the commit below.
press_key Escape
wait_for_missing_element commit-info-pane 30
wait_for_element commit-details-pane 5
press_key Down
wait_for_commit_heading "${notes_hash:0:7}"
