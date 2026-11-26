#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with more commits than one page of the commit list
# and a newest commit that changes more files than the commit details pane shows at once, starts
# the real app with remote control on, opens that repo with the welcome page's Open repo button
# and checks Page Up and Page Down. In the commit pane Page Down moves the selection by the rows
# that fit, keeps its row in view and reads the next page near the last commit read. Zooming in
# makes a page shorter and Page Up stops at the first commit. In the commit's changed files the
# keys move the open file by a page and stop at the last file. In the file pane they leave it as it
# is. In the repo details pane they move to the last or first link. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The empty commits added under the newest commit, so the repo has more commits than one page of
# the commit list.
#
EXTRA_COMMIT_COUNT=120

#
# The commits the commit list reads in one page, COMMIT_PAGE_SIZE in the frontend.
#
PAGE_SIZE=50

#
# How many files the newest commit changes: more rows than the commit details pane shows in the
# smoke test's window, so a page moves part way through them.
#
FILE_COUNT=60

#
# Prints the name of the file at the position, from 1 to FILE_COUNT, zero padded so git lists the
# files in the order of their positions and no name holds another. Usage: file_name <position>
#
file_name() {
    printf 'file-%03d.txt' "$1"
}

#
# Runs git in the test repo with an empty global config and the system config switched off, as
# create-test-repo.sh runs it, so the user's own config and hooks leave the commits as they are.
# Usage: repo_git <git arguments>
#
repo_git() {
    GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME="Ada Author" GIT_AUTHOR_EMAIL="ada@example.com" GIT_COMMITTER_NAME="Cy Committer" GIT_COMMITTER_EMAIL="cy@example.com" git -C "$repo" "$@"
}

#
# Waits until the commit details pane shows the commit with the title. Usage: wait_for_commit_title <title>
#
wait_for_commit_title() {
    local index
    for index in "${!titles[@]}"; do
        if [ "${titles[$index]}" = "$1" ]; then
            wait_for_text commit-details-heading "Commit${hashes[$index]:0:7}" 30
            return 0
        fi
    done
    fail "no commit in the test repo has the title \"$1\""
}

#
# Waits until the commit details pane shows a commit other than the one at the index in titles,
# then sets shown_index to the index of the commit it shows, so the test knows which commit a key
# selected. The pane's heading holds the short hash of its commit. Usage: wait_for_other_commit <index>
#
wait_for_other_commit() {
    local waited=0
    local result=""
    local heading=""
    local index
    while [ "$waited" -lt 30 ]; do
        result="$(control '{"command":"get-text","dataId":"commit-details-heading"}')"
        if [ "$(printf '%s' "$result" | jq -r '.ok')" = "true" ]; then
            heading="$(printf '%s' "$result" | jq -r '.value')"
            if [ "$heading" != "Commit${hashes[$1]:0:7}" ]; then
                for index in "${!hashes[@]}"; do
                    if [ "Commit${hashes[$index]:0:7}" = "$heading" ]; then
                        shown_index="$index"
                        return 0
                    fi
                done
                fail "the commit details pane showed \"$heading\", which is no commit in the test repo"
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the commit details pane still showed \"${titles[$1]}\". The last result was: $result"
}

#
# Waits until the file pane shows a file other than the one at the position, then sets
# shown_position to the position of the file it shows. Usage: wait_for_other_file <position>
#
wait_for_other_file() {
    local waited=0
    local shown=""
    while [ "$waited" -lt 30 ]; do
        shown="$(text_of file-pane-path)"
        if [ "$shown" != "$(file_name "$1")" ]; then
            shown_position="$((10#${shown:5:3}))"
            [ "$(file_name "$shown_position")" = "$shown" ] || fail "the file pane showed $shown, which is no file in the newest commit"
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the file pane still showed $(file_name "$1")"
}

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
for number in $(seq 1 "$EXTRA_COMMIT_COUNT"); do
    repo_git commit --quiet --allow-empty --message "$(printf 'Commit %03d' "$number")" || fail "could not add commit $number to the test repo"
done
position=1
while [ "$position" -le "$FILE_COUNT" ]; do
    printf 'File %s.\n' "$position" > "$repo/$(file_name "$position")" || fail "could not write $(file_name "$position") in the test repo"
    position=$((position + 1))
done
repo_git add . || fail "could not stage the files in the test repo"
repo_git commit --quiet --message "Add many files" || fail "could not commit the files in the test repo"

#
# Every commit's hash and title, newest first, as the commit list shows them. Read with while loops
# because the macOS runner runs the smoke tests under its own bash 3.2, which has no mapfile.
#
hashes=()
while IFS= read -r hash; do
    hashes+=("$hash")
done < <(repo_git rev-list HEAD)
titles=()
while IFS= read -r title; do
    titles+=("$title")
done < <(repo_git log --format=%s)
commit_count="${#hashes[@]}"

start_app_on_start_page
open_repo_with_button "$repo"

# Down and Enter open the commit pane, Down and Enter open the newest commit's details and Left
# makes the commit pane active again, so a Page Down there opens the commit it selects.
press_key Down
press_key Enter
wait_for_element "commit-${hashes[0]}" 30
press_key Down
press_key Enter
wait_for_commit_title "Add many files"
press_key Left

# Page Down moves the selection down by the rows that fit in the commit list, more than one. It
# keeps the selected row in view. A second Page Down moves it by the same number.
press_key PageDown
wait_for_other_commit 0
page_rows="$shown_index"
[ "$page_rows" -gt 1 ] || fail "Page Down moved the selection by $page_rows rows, where the commit list shows more than one"
echo "A page of the commit list is $page_rows rows."
wait_for_in_view_of "commit-${hashes[$page_rows]}" commit-list-scroll 30
press_key PageDown
wait_for_commit_title "${titles[$((page_rows * 2))]}"
wait_for_in_view_of "commit-${hashes[$((page_rows * 2))]}" commit-list-scroll 30

# Page Down on past the first page of commits reads the next page as the selection nears the
# last commit read, so the selection goes on into it. Before the last commit read, each press moves
# by a page. At the last commit read the next page is waited for, then the press moves by a page.
selected="$((page_rows * 2))"
presses=0
while [ "$selected" -lt "$PAGE_SIZE" ]; do
    [ "$presses" -lt "$PAGE_SIZE" ] || fail "Page Down never moved the selection past the first page of commits"
    if [ "$selected" -eq $((PAGE_SIZE - 1)) ]; then
        wait_for_missing_element commits-loading 30
    fi
    press_key PageDown
    wait_for_other_commit "$selected"
    if [ "$shown_index" -ne $((selected + page_rows)) ]; then
        [ "$shown_index" -eq $((PAGE_SIZE - 1)) ] || fail "Page Down moved the selection from row $selected to row $shown_index, where a page is $page_rows rows"
    fi
    selected="$shown_index"
    presses=$((presses + 1))
done
wait_for_in_view_of "commit-${hashes[$selected]}" commit-list-scroll 30
echo "Page Down moved the selection to row $selected, on the second page of commits."

# Zooming in makes the rows taller, so a page holds fewer rows. Page Up then moves by fewer rows.
press_key CmdOrCtrl+Plus
press_key CmdOrCtrl+Plus
sleep 1
press_key PageUp
wait_for_other_commit "$selected"
zoomed_rows=$((selected - shown_index))
[ "$zoomed_rows" -lt "$page_rows" ] || fail "zoomed in, Page Up moved the selection by $zoomed_rows rows, where a page was $page_rows rows before"
[ "$zoomed_rows" -gt 0 ] || fail "zoomed in, Page Up moved the selection down by $((0 - zoomed_rows)) rows"
echo "Zoomed in, a page of the commit list is $zoomed_rows rows."
press_key CmdOrCtrl+0
selected="$shown_index"

# Page Up back to the newest commit stops there.
presses=0
while [ "$selected" -gt 0 ]; do
    [ "$presses" -lt "$PAGE_SIZE" ] || fail "Page Up never moved the selection back to the newest commit"
    press_key PageUp
    wait_for_other_commit "$selected"
    selected="$shown_index"
    presses=$((presses + 1))
done
wait_for_in_view_of "commit-${hashes[0]}" commit-list-scroll 30
press_key PageUp
sleep 1
wait_for_commit_title "Add many files"

# Right makes the commit details pane active, Enter opens the first file and Left makes the
# commit details pane active again with the file pane open, so a Page Down there shows the file it
# selects.
press_key Right
wait_for_in_view_of "changed-file-$(file_name 1)" commit-details-scroll 30
press_key Enter
wait_for_text file-pane-path "$(file_name 1)" 30
press_key Left

# Page Down moves the open file down by the rows that fit, more than one, on to the last file,
# where it stops. It keeps the open file's row in view. Page Up moves it back by a page.
press_key PageDown
wait_for_other_file 1
file_rows=$((shown_position - 1))
[ "$file_rows" -gt 1 ] || fail "Page Down moved the open file by $file_rows rows, where the commit details pane shows more than one"
echo "A page of the changed files is $file_rows rows."
wait_for_in_view_of "changed-file-$(file_name "$shown_position")" commit-details-scroll 30
position="$shown_position"
presses=0
while [ "$position" -lt "$FILE_COUNT" ]; do
    [ "$presses" -lt "$FILE_COUNT" ] || fail "Page Down never reached the last file"
    press_key PageDown
    wait_for_other_file "$position"
    expected=$((position + file_rows))
    if [ "$expected" -gt "$FILE_COUNT" ]; then
        expected="$FILE_COUNT"
    fi
    [ "$shown_position" -eq "$expected" ] || fail "Page Down moved the open file from $(file_name "$position") to $(file_name "$shown_position"), where $(file_name "$expected") was expected"
    position="$shown_position"
    presses=$((presses + 1))
done
wait_for_in_view_of "changed-file-$(file_name "$FILE_COUNT")" commit-details-scroll 30
press_key PageDown
sleep 1
wait_for_text file-pane-path "$(file_name "$FILE_COUNT")" 30
press_key PageUp
wait_for_text file-pane-path "$(file_name $((FILE_COUNT - file_rows)))" 30
wait_for_in_view_of "changed-file-$(file_name $((FILE_COUNT - file_rows)))" commit-details-scroll 30

# In the file pane the keys leave the open file as it is.
press_key Right
press_key PageDown
press_key PageUp
sleep 1
wait_for_text file-pane-path "$(file_name $((FILE_COUNT - file_rows)))" 30

# Escape closes the file pane, the commit details pane and the commit pane, leaving the repo
# details pane active with the Commits link selected. Page Down moves to the last row, the test
# repo's only tag, which Enter opens in the tag pane. Page Up moves back to the first, the Commits
# link.
press_key Escape
press_key Escape
press_key Escape
wait_for_missing_element commit-pane 30
press_key PageDown
press_key Enter
wait_for_element tag-pane 30
press_key Escape
wait_for_missing_element tag-pane 30
press_key PageUp
press_key Enter
wait_for_element "commit-${hashes[0]}" 30
