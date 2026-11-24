#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with more commits than one page of the commit list,
# starts the real app with remote control on, opens that repo with the welcome page's Open repo
# button and checks the commit list reads every page: scrolling the list to its end reads the next
# page until the repo's first commit shows, and the right sidebar lists the git log that read the
# page after the first. Then it opens the commit pane again and presses Down once per commit, so
# the selection moves across the pages to the first commit, and Enter opens that commit's details.
# See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The commits added on top of the test repo's own, so the repo has more than one page of commits,
# COMMIT_PAGE_SIZE in the frontend, and its last page is not full.
#
EXTRA_COMMIT_COUNT=60

#
# The commits the commit list reads in one page, COMMIT_PAGE_SIZE in the frontend.
#
PAGE_SIZE=50

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
for number in $(seq 1 "$EXTRA_COMMIT_COUNT"); do
    git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false commit --quiet --allow-empty --message "Commit $number" || fail "could not add commit $number to the test repo"
done

#
# Every commit's hash, newest first, as the commit list shows them. The history is a line, so
# git rev-list gives the same order as git log. Read with a while loop because the macOS runner
# runs the smoke tests under its own bash 3.2, and mapfile needs bash 4: the Release macOS arm64
# workflow failed here with "mapfile: command not found".
#
hashes=()
while IFS= read -r hash; do
    hashes+=("$hash")
done < <(git -C "$repo" rev-list HEAD)
commit_count="${#hashes[@]}"
[ "$commit_count" -gt "$PAGE_SIZE" ] || fail "the test repo has $commit_count commits, which fit on one page"
first_hash="${hashes[$((commit_count - 1))]}"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-${hashes[0]}" 30
wait_for_text "commit-title-${hashes[0]}" "Commit $EXTRA_COMMIT_COUNT" 30

# Scrolling to the end reads the next page, until the repo's first commit, "Add the readme", shows.
# control's answer is kept in a variable before jq reads it, as wait_for_element does. With the
# control call inside the test's own "$(...)", the macOS runner's bash 3.2 split the JSON's braces
# at the comma and called control twice, so [ got four arguments and failed with "[: too many
# arguments". The loop then ended before it scrolled, and the Release macOS arm64 workflow failed
# commit-pages with "commit-title-<hash> never showed "Add the readme"".
waited=0
while true; do
    answer="$(control "{\"command\":\"exists\",\"dataId\":\"commit-$first_hash\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
        break
    fi
    [ "$waited" -lt 60 ] || fail "the commit list never showed the repo's first commit after scrolling to its end"
    scroll_to_end commit-list-scroll
    sleep 1
    waited=$((waited + 1))
done
wait_for_text "commit-title-$first_hash" "Add the readme" 30
wait_for_missing_element commits-loading 30
wait_for_missing_element commits-error 5

# The right sidebar lists the git log that read the page after the first, the most recent command.
click right-sidebar-toggle
wait_for_text git-command-0-text "git log --max-count=$PAGE_SIZE --skip=1 ${hashes[$((PAGE_SIZE - 1))]}" 30
click right-sidebar-toggle

# Escape closes the commit pane and Enter on the selected Commits link opens it again, reading the
# first page afresh, with the commit pane active.
press_key Escape
wait_for_missing_element commit-pane 30
press_key Enter
wait_for_element "commit-${hashes[0]}" 30

# Down once per commit moves the selection across the pages to the first commit. Each press waits
# for the row it selects, which shows once its page is read and the list has scrolled to it.
for index in $(seq 0 $((commit_count - 1))); do
    wait_for_element "commit-${hashes[$index]}" 30
    press_key Down
done

# Enter opens the selected commit, the repo's first.
press_key Enter
wait_for_element commit-details 30
wait_for_text commit-details-title "Add the readme" 30
