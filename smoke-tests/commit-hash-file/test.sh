#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own and adds an empty file named after the full hash of
# its newest commit, starts the real app with remote control on and opens that repo with the
# welcome page's Open repo button. It opens the newest commit and checks the commit details pane
# lists its changed file, the file pane shows the file's diff and the right sidebar shows the
# git diff-tree commands with `--` after the hash. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

#
# A file named after the commit's full hash, which git reads as ambiguous when the hash is not
# followed by `--`.
#
touch "$repo/$head_hash" || fail "could not add a file named $head_hash to the test repo"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details 30
wait_for_text commit-details-title "Change the note" 30
wait_for_text commit-details-hash "$head_hash" 30
wait_for_text changed-files-heading "Files changed (1)" 30
wait_for_text changed-file-notes.txt "notes.txt" 30

click right-sidebar-toggle
wait_for_text git-command-0-text "git diff-tree -r --root --no-commit-id --numstat $head_hash --" 30
wait_for_text git-command-1-text "git diff-tree -r --root --no-commit-id --name-status $head_hash --" 30

click changed-file-notes.txt
wait_for_element file-diff 30
wait_for_text file-diff "The first note." 30
wait_for_text file-diff "The second note." 30
wait_for_text git-command-0-text "git diff-tree -r -p --root --no-commit-id $head_hash -- notes.txt" 30
