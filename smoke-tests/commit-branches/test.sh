#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with main checked out, a second branch holding a
# commit only it reaches, a remote-tracking branch holding a commit only it reaches, a branch
# pointing at the first commit and a stash. It starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button, opens the commit pane and checks the commits
# of every branch are listed with their branches' badges and the stash's commit is left out. It
# checks the right sidebar shows the git log that read them and that the command lists the same
# commits in a terminal's shell. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The command the right sidebar shows for the first page of the commit list, COMMIT_PAGE_SIZE in
# the frontend being 50.
#
SHOWN_LOG_COMMAND="git log --no-show-signature --max-count=50 --branches --remotes HEAD --"

#
# Runs git in the test repo with a fixed author and the commit and author dates set to the time, so
# the test sets the order git log lists the commits in. Usage: git_at_time <date> <git args...>
#
git_at_time() {
    local date="$1"
    shift
    GIT_AUTHOR_DATE="$date" GIT_COMMITTER_DATE="$date" git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false "$@"
}

# The other branch starts at "Add the notes" and holds a commit only it reaches.
git -C "$repo" switch --quiet --create other HEAD~1 || fail "could not create the other branch in the test repo"
git_at_time "2026-01-04T09:00:00+00:00" commit --quiet --allow-empty --message "Other branch commit" || fail "could not commit on the other branch"
other_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the other branch's commit"

# The remote-tracking branch origin/remote-only holds a commit only it reaches.
git -C "$repo" switch --quiet --create remote-only main || fail "could not create the remote-only branch in the test repo"
git_at_time "2026-01-05T09:00:00+00:00" commit --quiet --allow-empty --message "Remote branch commit" || fail "could not commit on the remote-only branch"
remote_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the remote-only branch's commit"
git -C "$repo" update-ref refs/remotes/origin/remote-only "$remote_hash" || fail "could not add the remote-tracking branch"
git -C "$repo" switch --quiet main || fail "could not switch the test repo back to main"
git -C "$repo" branch --quiet -D remote-only || fail "could not delete the local remote-only branch"

# The branch empty points at the first commit, which main also reaches.
first_hash="$(git -C "$repo" rev-list --max-parents=0 HEAD)" || fail "could not read the test repo's first commit"
git -C "$repo" branch empty "$first_hash" || fail "could not add the empty branch"

# A stash is a commit no branch reaches, which the list leaves out.
printf 'A note to stash.\n' > "$repo/notes.txt"
git_at_time "2026-01-06T09:00:00+00:00" stash --quiet || fail "could not stash in the test repo"
stash_hash="$(git -C "$repo" rev-parse refs/stash)" || fail "could not read the stash's commit"

head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit on main"
[ "$(git -C "$repo" branch --show-current)" = "main" ] || fail "the test repo does not have main checked out"
if git -C "$repo" merge-base --is-ancestor "$other_hash" main; then
    fail "main reaches the other branch's commit"
fi

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane

# Every branch's commits are listed, each with its branch's badge.
wait_for_text "commit-title-$remote_hash" "Remote branch commit" 30
wait_for_text "commit-refs-$remote_hash" "origin/remote-only" 30
wait_for_text "commit-title-$other_hash" "Other branch commit" 30
wait_for_text "commit-refs-$other_hash" "other" 30
wait_for_text "commit-title-$head_hash" "Change the note" 30
wait_for_text "commit-refs-$head_hash" "main" 30
wait_for_text "commit-title-$first_hash" "Add the readme" 30
wait_for_text "commit-refs-$first_hash" "empty" 30

# The list leaves out the stash's commit, which only refs/stash reaches.
wait_for_missing_element "commit-$stash_hash" 5

# The right sidebar shows the git log that read the page, which lists the same commits in a shell.
# The Commits link's click leaves the repo details pane active, so Right makes the commit pane
# active for the right sidebar to list its commands.
click right-sidebar-toggle
press_key Right
wait_for_text git-command-0-text "$SHOWN_LOG_COMMAND" 30
directory_command="$(text_of git-commands-directory)"
[ "$directory_command" = "cd $repo" ] || fail "the sidebar showed \"$directory_command\", not \"cd $repo\""
shown_command="$(text_of git-command-0-text)"
# The hash format goes before the command's closing `--`, after which git reads paths.
hash_command="${shown_command% --} --format=%H --"
shown_hashes="$(cd "$ZIGGY_TEST_DIR" && GIT_PAGER=cat bash -c "$directory_command"$'\n'"$hash_command" 2>&1)" \
    || fail "the shown command \"$shown_command\" failed: $shown_hashes"
expected_hashes="$(printf '%s\n' "$remote_hash" "$other_hash" "$head_hash" "$(git -C "$repo" rev-parse HEAD~1)" "$first_hash")"
[ "$shown_hashes" = "$expected_hashes" ] || fail "the shown command listed $shown_hashes, not $expected_hashes"
click right-sidebar-toggle
