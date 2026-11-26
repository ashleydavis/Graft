#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with more commits than one page of the commit list,
# a newest commit that changes more files than the commit details pane shows at once, an unstaged
# change and a staged change. Starts the real app with remote control on, opens that repo with the
# welcome page's Open repo button and checks Home and End in each pane: the repo details pane's
# links, the changes pane's rows, the commit list across its pages, the commit details pane's
# commits and files and the file pane, which they leave as it is. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The empty commits added on top of the test repo's own, so the repo has more commits than one
# page of the commit list, COMMIT_PAGE_SIZE in the frontend.
#
EXTRA_COMMIT_COUNT=60

#
# How many files the newest commit changes: far more rows than the commit details pane shows in
# the smoke test's window, so End has to scroll the list to its last file.
#
FILE_COUNT=60

#
# The commits the commit list reads in one page, COMMIT_PAGE_SIZE in the frontend.
#
PAGE_SIZE=50

#
# Prints the name of the file at the position, from 1 to FILE_COUNT, zero padded so git lists the
# files in the order of their positions. Usage: file_name <position>
#
file_name() {
    printf 'file-%02d.txt' "$1"
}

#
# Runs git in the test repo with an empty global config and the system config switched off, as
# create-test-repo.sh runs it, so the user's own config and hooks leave the commits as they are.
# Usage: repo_git <git argument>...
#
repo_git() {
    GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME="Ada Author" GIT_AUTHOR_EMAIL="ada@example.com" GIT_COMMITTER_NAME="Cy Committer" GIT_COMMITTER_EMAIL="cy@example.com" git -C "$repo" "$@"
}

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
for number in $(seq 1 "$EXTRA_COMMIT_COUNT"); do
    repo_git commit --quiet --allow-empty --message "Commit $number" || fail "could not add commit $number to the test repo"
done
for position in $(seq 1 "$FILE_COUNT"); do
    printf 'File %s.\n' "$position" > "$repo/$(file_name "$position")" || fail "could not write $(file_name "$position") in the test repo"
done
repo_git add . || fail "could not stage the files in the test repo"
repo_git commit --quiet --message "Add many files" || fail "could not commit the files in the test repo"

# The changes pane lists notes.txt alone as Unstaged and README.md alone as Staged.
printf 'The changed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
printf '# The changed readme\n' > "$repo/README.md" || fail "could not change README.md"
repo_git add README.md || fail "could not stage README.md"

#
# Every commit's hash, newest first, as the commit list shows them. Read with a while loop because
# the macOS runner runs the smoke tests under its own bash 3.2, which has no mapfile.
#
hashes=()
while IFS= read -r hash; do
    hashes+=("$hash")
done < <(repo_git rev-list HEAD)
commit_count="${#hashes[@]}"
[ "$commit_count" -gt "$PAGE_SIZE" ] || fail "the test repo has $commit_count commits, which fit on one page"
last_hash="${hashes[$((commit_count - 1))]}"
page_end_hash="${hashes[$((PAGE_SIZE - 1))]}"

start_app_on_start_page
open_repo_with_button "$repo"

# The repo details pane: End selects the last row, which is a tag or a branch, and Home the Commits
# link, so Down and Enter open the changes pane.
press_key End
press_key Home
press_key Down
press_key Enter
wait_for_element changes-pane 30
wait_for_element "change-staged-README.md" 30
wait_for_element "change-unstaged-notes.txt" 30

# The changes pane: End selects the last Staged row and Home the first Unstaged row, which Enter
# opens in the file pane. Left returns to the changes pane with the file pane still open.
press_key End
press_key Enter
wait_for_element file-pane 30
wait_for_text file-pane-path "README.md" 30
press_key Left
press_key Home
press_key Enter
wait_for_text file-pane-path "notes.txt" 30

# Escape closes the file pane and the changes pane. Home selects the Commits link, so Enter opens
# the commit pane, active with no commit selected.
press_key Escape
wait_for_missing_element file-pane 30
press_key Escape
wait_for_missing_element changes-pane 30
press_key Home
press_key Enter
wait_for_element commit-pane 30
wait_for_element "commit-${hashes[0]}" 30

# The commit pane: End selects the last commit read so far and scrolls it into view, which reads
# the next page. Enter opens the selected commit.
press_key End
wait_for_in_view_of "commit-$page_end_hash" commit-list-scroll 30
wait_for_element "commit-${hashes[$PAGE_SIZE]}" 30
press_key Enter
wait_for_commit_heading "${page_end_hash:0:7}"

# Back in the commit pane with the details open, End opens the last commit, the repo's first, now
# its page is read, and Home opens the newest, each in view.
press_key Left
press_key End
wait_for_commit_heading "${last_hash:0:7}"
wait_for_in_view_of "commit-$last_hash" commit-list-scroll 30
press_key Home
wait_for_commit_heading "${hashes[0]:0:7}"
wait_for_in_view_of "commit-${hashes[0]}" commit-list-scroll 30

# The commit details pane: Enter opens the first file, which is selected as the list opens. With
# the file pane open, End shows the last file's diff, in view, and Home selects the "Commit details"
# row above the first file, which opens the "Commit details" pane in the file pane's place, in view.
# Down then shows the first file's diff again.
press_key Right
wait_for_text changed-files-heading "Files changed ($FILE_COUNT)" 30
press_key Enter
wait_for_text file-pane-path "$(file_name 1)" 30
press_key Left
press_key End
wait_for_text file-pane-path "$(file_name "$FILE_COUNT")" 30
wait_for_in_view_of "changed-file-$(file_name "$FILE_COUNT")" commit-details-scroll 30
press_key Home
wait_for_element commit-info-pane 30
wait_for_missing_element file-pane 30
wait_for_in_view_of commit-details-row commit-details-scroll 30
press_key Down
wait_for_text file-pane-path "$(file_name 1)" 30
wait_for_in_view_of "changed-file-$(file_name 1)" commit-details-scroll 30

# The file pane: Home and End leave the selection as it is, so Enter back in the commit details
# pane opens the first file again.
press_key Right
press_key End
press_key Home
press_key End
press_key Left
press_key Enter
wait_for_text file-pane-path "$(file_name 1)" 30

# The commit details pane with no file pane open: End and Home open the last and first commit.
press_key Escape
wait_for_missing_element file-pane 30
press_key End
wait_for_commit_heading "${last_hash:0:7}"
press_key Home
wait_for_commit_heading "${hashes[0]:0:7}"
