#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app, built with the test hooks, on
# that repo and checks the commits page's columns open: clicking a commit opens the commit details
# pane and clicking a changed file opens the file pane. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
click about-commits-link
wait_for_element commit-pane 30
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details-pane 30
wait_for_element commit-details 30
wait_for_text commit-details-title "Change the note" 30
wait_for_text commit-details-description "The note now says what the second note is." 30
wait_for_text commit-details-hash "$head_hash" 30
wait_for_text commit-details-author "Ada Author" 30
wait_for_text commit-details-committer "Cy Committer" 30
wait_for_text changed-files "M notes.txt" 30
click changed-file-notes.txt
wait_for_element file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_element file-diff 30
wait_for_text file-diff "-The first note." 30
wait_for_text file-diff "+The second note." 30
wait_for_element commit-pane 5
