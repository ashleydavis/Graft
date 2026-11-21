#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a newest commit that changes two files, starts
# the real app with remote control on, opens that repo with the welcome page's Open repo button and
# presses keys as a user does: with a file's diff open, Up and Down in the commit's file list show
# the other file's diff at once, without Enter, and Enter then makes the file pane active. See
# test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
printf '# The test repo\n' > "$repo/README.md" || fail "could not change README.md"
printf 'The third note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
git -C "$repo" add README.md notes.txt || fail "could not add the two files"
git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false commit --quiet --message "Change two files" || fail "could not commit the two files"

start_app_on_start_page
open_repo_with_button "$repo"

# Down and Enter open the commit pane from the Commits link, and Down and Enter open the newest
# commit, which changes README.md and notes.txt.
press_key Down
press_key Enter
wait_for_text commit-list "Change two files" 30
press_key Down
press_key Enter
wait_for_text commit-details-title "Change two files" 30
wait_for_text changed-file-README.md "README.md" 30
wait_for_text changed-file-notes.txt "notes.txt" 30

# Down selects README.md and Enter opens its diff, then Left makes the file list active again.
press_key Down
press_key Enter
wait_for_element file-pane 30
wait_for_text file-pane-path "README.md" 30
wait_for_text file-diff "+# The test repo" 30
press_key Left

# Down shows the diff of notes.txt at once, without Enter, and Up shows README.md's again.
press_key Down
wait_for_text file-pane-path "notes.txt" 30
wait_for_text file-diff "+The third note." 30
press_key Up
wait_for_text file-pane-path "README.md" 30
wait_for_text file-diff "+# The test repo" 30
press_key Down
wait_for_text file-pane-path "notes.txt" 30

# Enter makes the file pane active, so Up there leaves the diff of notes.txt showing.
press_key Enter
press_key Up
sleep 2
shown="$(text_of file-pane-path)"
[ "$shown" = "notes.txt" ] || fail "Up in the file pane changed the diff to $shown"

# Escape closes the file pane and leaves the commit details pane open.
press_key Escape
wait_for_missing_element file-pane 30
wait_for_element commit-details-pane 5
