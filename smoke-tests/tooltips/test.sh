#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with one more commit, which adds src/graph/lanes.ts,
# starts the real app with remote control on and opens that repo with the welcome page's Open repo
# button. It checks a commit's short hash shows its full hash in a tooltip. It checks a changed
# file's tooltip stays open when pinned with P after the pointer leaves and closes with Escape. It
# checks the file pane's title shows the file's full path in a tooltip. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The path of the file the extra commit adds, in a folder, so the file pane's title, which shows
# only the file's name, has a longer full path for its tooltip to show.
#
file_path="src/graph/lanes.ts"

mkdir -p "$repo/src/graph" || fail "could not make the folder of $file_path in the test repo"
printf 'export const laneCount = 3;\n' > "$repo/$file_path" || fail "could not write $file_path in the test repo"
git -C "$repo" add "$file_path" || fail "could not stage $file_path in the test repo"
git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false commit --quiet --message "Add the lanes" || fail "could not commit $file_path to the test repo"
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

#
# Sends a keydown of the key to the changed file's row, as a user's key press reaches the page,
# and fails when the frontend could not send it. Usage: key_down_on_file <key>
#
key_down_on_file() {
    local answer
    answer="$(control "{\"command\":\"key-down\",\"dataId\":\"changed-file-$file_path\",\"key\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "the key-down of $1 on changed-file-$file_path failed: $answer"
    fi
}

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$head_hash" 30

hover "commit-hash-$head_hash"
wait_for_element "commit-hash-$head_hash-tip" 30
wait_for_text "commit-hash-$head_hash-tip" "$head_hash" 30
unhover "commit-hash-$head_hash"
wait_for_missing_element "commit-hash-$head_hash-tip" 30

click "commit-$head_hash"
wait_for_element "changed-file-$file_path" 30
hover "changed-file-$file_path-path"
wait_for_element "changed-file-$file_path-tip" 30
wait_for_text "changed-file-$file_path-tip" "$file_path" 30
key_down_on_file p
unhover "changed-file-$file_path-path"
sleep 2
wait_for_element "changed-file-$file_path-tip" 30
wait_for_element "commit-details" 30
key_down_on_file Escape
wait_for_missing_element "changed-file-$file_path-tip" 30
sleep 1
wait_for_element "commit-details" 30

click "changed-file-$file_path"
wait_for_element file-pane-path 30
wait_for_text file-pane-path "lanes.ts" 30
hover file-pane-path
wait_for_element file-pane-path-tip 30
wait_for_text file-pane-path-tip "$file_path" 30
