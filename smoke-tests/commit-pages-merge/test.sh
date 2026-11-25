#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a merge and more commits than one page of the
# commit list, the merged branch's commits dated between the main line's so git log mixes them in.
# It starts the real app with remote control on, opens that repo with the welcome page's Open repo
# button, scrolls the commit list to its end and checks a commit only on the merged branch is
# listed and the right sidebar lists the git log that read the second page from every branch and
# HEAD. Then it presses Down once per commit git rev-list counts, so every commit is listed
# once, in git's order, and Enter opens the repo's first commit. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The commits made on each side of the merge. Both sides together with the merge and the test
# repo's own commits are more than one page, COMMIT_PAGE_SIZE in the frontend.
#
SIDE_COMMIT_COUNT=30

#
# The commits the commit list reads in one page, COMMIT_PAGE_SIZE in the frontend.
#
PAGE_SIZE=50

#
# The time the first commit on either side is made at, in seconds since 1970: 2026-01-04, after the
# test repo's own commits, so the merged commits come above them in git log.
#
FIRST_COMMIT_TIME=1767484800

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Runs git in the test repo with a fixed author and the commit and author dates set to the time, so
# the test sets the order git log lists the commits in. Usage: git_at_time <seconds> <git args...>
#
git_at_time() {
    local time="$1"
    shift
    GIT_AUTHOR_DATE="@$time +0000" GIT_COMMITTER_DATE="@$time +0000" git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false "$@"
}

# The side branch's commits take the odd minutes and the main line's the even minutes, so git log
# lists them one from each side in turn.
git -C "$repo" switch --quiet --create side || fail "could not create the side branch in the test repo"
for number in $(seq 1 "$SIDE_COMMIT_COUNT"); do
    git_at_time $((FIRST_COMMIT_TIME + number * 120 - 60)) commit --quiet --allow-empty --message "Side $number" || fail "could not add side commit $number to the test repo"
done
git -C "$repo" switch --quiet main || fail "could not switch the test repo back to main"
for number in $(seq 1 "$SIDE_COMMIT_COUNT"); do
    git_at_time $((FIRST_COMMIT_TIME + number * 120)) commit --quiet --allow-empty --message "Main $number" || fail "could not add main commit $number to the test repo"
done
git_at_time $((FIRST_COMMIT_TIME + SIDE_COMMIT_COUNT * 120 + 60)) merge --quiet --no-ff --no-edit --message "Merge side" side || fail "could not merge the side branch in the test repo"

#
# Every commit's hash, in the order git log lists them, which git rev-list shares. Read with a while
# loop because the macOS runner runs the smoke tests under its own bash 3.2, which has no mapfile.
#
hashes=()
while IFS= read -r hash; do
    hashes+=("$hash")
done < <(git -C "$repo" rev-list HEAD)
commit_count="$(git -C "$repo" rev-list --count HEAD)"
[ "${#hashes[@]}" -eq "$commit_count" ] || fail "git rev-list listed ${#hashes[@]} commits but counted $commit_count"
[ "$commit_count" -gt "$PAGE_SIZE" ] || fail "the test repo has $commit_count commits, which fit on one page"
first_hash="${hashes[$((commit_count - 1))]}"
side_hash="$(git -C "$repo" rev-parse side~$((SIDE_COMMIT_COUNT - 1)))"
[ "$(git -C "$repo" log --format=%s --max-count=1 "$side_hash")" = "Side 1" ] || fail "side~$((SIDE_COMMIT_COUNT - 1)) is not Side 1"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-${hashes[0]}" 30
wait_for_text "commit-title-${hashes[0]}" "Merge side" 30

# Scrolling to the end reads the next page, until the repo's first commit, "Add the readme", shows.
# control's output is kept in a variable before jq reads it, as in the commit-pages smoke test, so
# the macOS runner's bash 3.2 does not split its JSON.
waited=0
while true; do
    output="$(control "{\"command\":\"exists\",\"dataId\":\"commit-$first_hash\"}")"
    if [ "$(printf '%s' "$output" | jq -r '.ok')" = "true" ]; then
        break
    fi
    [ "$waited" -lt 60 ] || fail "the commit list never showed the repo's first commit after scrolling to its end"
    scroll_to_end commit-list-scroll
    sleep 1
    waited=$((waited + 1))
done
wait_for_text "commit-title-$first_hash" "Add the readme" 30
wait_for_missing_element commits-placeholder 30
wait_for_missing_element commits-error 5

# The oldest commit only on the merged branch is listed, just above the test repo's own commits.
wait_for_text "commit-title-$side_hash" "Side 1" 30

# The right sidebar lists the git log that read the second page: from every branch and HEAD,
# skipping the page already read, with `--` after HEAD.
click right-sidebar-toggle
wait_for_text git-command-0-text "git log --no-show-signature --max-count=$PAGE_SIZE --skip=$PAGE_SIZE --branches --remotes HEAD --" 30
click right-sidebar-toggle

# Escape closes the commit pane and Enter on the selected Commits link opens it again, reading the
# first page afresh with the newest commit selected.
press_key Escape
wait_for_missing_element commit-pane 30
press_key Enter
wait_for_element "commit-${hashes[0]}" 30

# Down once per commit moves the selection down the list. Each press waits for the row it selects,
# so a commit missing from the list fails the wait, and a commit listed twice leaves the selection
# short of the first commit after the last press.
for index in $(seq 0 $((commit_count - 1))); do
    wait_for_element "commit-${hashes[$index]}" 30
    press_key Down
done

# Enter opens the selected commit, the repo's first.
press_key Enter
wait_for_element commit-details 30
wait_for_text commit-details-heading "${first_hash:0:7}" 30
