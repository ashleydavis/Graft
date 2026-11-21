#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a newest commit that changes more files than
# the commit details pane can show at once, starts the real app with remote control on, opens that
# repo with the welcome page's Open repo button and opens the commit with the keys. It checks the
# first file is highlighted and in view when the file list opens, and that the highlighted file
# stays in view of the pane as Down moves past the rows that show. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# How many files the test's newest commit changes: far more rows than the commit details pane
# shows in the smoke test's window, so Down has to move past the rows that show.
#
FILE_COUNT=60

#
# Prints the name of the file at the position, from 1 to FILE_COUNT, zero padded so git lists the
# files in the order of their positions. Usage: file_name <position>
#
file_name() {
    printf 'file-%02d.txt' "$1"
}

#
# Presses the key the number of times. Usage: press_key_times <key> <count>
#
press_key_times() {
    local pressed=0
    while [ "$pressed" -lt "$2" ]; do
        press_key "$1"
        pressed=$((pressed + 1))
    done
}

#
# Opens the file pane of the highlighted file with Enter, checks it shows the file with the name,
# so the file was the highlighted one, and returns to the commit details pane with Left.
# Usage: check_highlighted_file <name>
#
check_highlighted_file() {
    press_key Enter
    wait_for_element file-pane 30
    wait_for_text file-pane-path "$1" 30
    press_key Left
}

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The newest commit changes every one of the files. Git runs with an empty global config and the
# system config switched off, as create-test-repo.sh runs it, so the user's own config and hooks
# leave the commit as it is.
#
position=1
while [ "$position" -le "$FILE_COUNT" ]; do
    printf 'File %s.\n' "$position" > "$repo/$(file_name "$position")" || fail "could not write $(file_name "$position") in the test repo"
    position=$((position + 1))
done
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -C "$repo" add . || fail "could not stage the files in the test repo"
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME="Ada Author" GIT_AUTHOR_EMAIL="ada@example.com" GIT_COMMITTER_NAME="Cy Committer" GIT_COMMITTER_EMAIL="cy@example.com" git -C "$repo" commit --quiet --message "Add many files" || fail "could not commit the files in the test repo"

start_app_on_start_page
open_repo_with_button "$repo"

# Down and Enter open the commit pane from the Commits link, then Down and Enter open the newest
# commit's details with the commit details pane active.
press_key Down
press_key Enter
wait_for_text commit-list "Add many files" 30
press_key Down
press_key Enter
wait_for_element commit-details 30
wait_for_text commit-details-title "Add many files" 30
wait_for_text changed-files-heading "Files changed ($FILE_COUNT)" 30

# The first file is highlighted and in view when the file list opens.
wait_for_in_view_of "changed-file-$(file_name 1)" commit-details-scroll 30
check_highlighted_file "$(file_name 1)"

# Down past the rows that show keeps the highlighted file in view, halfway down the list and at
# its last file.
press_key_times Down $((FILE_COUNT / 2 - 1))
wait_for_in_view_of "changed-file-$(file_name $((FILE_COUNT / 2)))" commit-details-scroll 30
check_highlighted_file "$(file_name $((FILE_COUNT / 2)))"
press_key_times Down $((FILE_COUNT / 2))
wait_for_in_view_of "changed-file-$(file_name "$FILE_COUNT")" commit-details-scroll 30
check_highlighted_file "$(file_name "$FILE_COUNT")"

# Up back to the first file scrolls the list back up to it.
press_key_times Up $((FILE_COUNT - 1))
wait_for_in_view_of "changed-file-$(file_name 1)" commit-details-scroll 30
check_highlighted_file "$(file_name 1)"
