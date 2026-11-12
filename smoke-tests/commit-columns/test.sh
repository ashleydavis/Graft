#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, on
# that repo and checks what each of the commits page's columns shows: the commit pane's rows,
# the commit details pane a click on a commit opens and the file pane a click on a changed file
# opens. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"
parent_hash="$(git -C "$repo" rev-parse HEAD~1)" || fail "could not read the parent of the test repo's newest commit"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
click about-commits-link
wait_for_element commit-pane 30
wait_for_element "commit-$head_hash" 30
wait_for_text "commit-$head_hash" "Change the note" 30
wait_for_text "commit-$head_hash" "HEAD -> main" 30
wait_for_text "commit-$head_hash" "Ada Author" 30
wait_for_text "commit-$head_hash" "2026" 30
wait_for_text "commit-$head_hash" "${head_hash:0:7}" 30
wait_for_text "commit-$parent_hash" "Add the notes" 30
wait_for_text "commit-$parent_hash" "v1.0" 30
click "commit-$head_hash"
wait_for_element commit-details-pane 30
wait_for_element commit-details 30
wait_for_text commit-details-heading "Commit" 30
wait_for_text commit-details-title "Change the note" 30
wait_for_text commit-details-description "The note now says what the second note is." 30
wait_for_text commit-details-hash "$head_hash" 30
wait_for_text commit-details-parents "Parent: ${parent_hash:0:7}" 30
wait_for_text commit-details-author "Authored by Ada Author <ada@example.com> on " 30
wait_for_text commit-details-author "2026" 30
wait_for_text commit-details-committer "Committed by Cy Committer <cy@example.com> on " 30
wait_for_text commit-details-committer "2026" 30
wait_for_text changed-files-heading "Files changed (1)" 30
wait_for_text changed-file-notes.txt "M" 30
wait_for_text changed-file-notes.txt "notes.txt" 30
wait_for_text changed-file-notes.txt "+1 -1" 30
click changed-file-notes.txt
wait_for_element file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_element file-diff 30
wait_for_text file-diff "-The first note." 30
wait_for_text file-diff "+The second note." 30
wait_for_element commit-pane 5
