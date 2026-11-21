#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, changes notes.txt in it and adds later.txt. Starts
# the real app with remote control on, opens the repo with the welcome page's Open repo button,
# opens the changes pane with the repo details pane's Commit link, stages notes.txt and types a
# commit message. It checks a pre-commit hook that fails shows git's error text and makes no
# commit, then that the commit goes through once the hook is gone: the staged list empties while
# later.txt stays unstaged, git's log holds the commit with the whole message and the commit pane
# shows it. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The app runs git with this test's environment. The user's own git config and hooks would change
# the commit, so git runs with an empty global config and the system config switched off, and the
# commit's author and committer are fixed, as create-test-repo.sh fixes them.
#
export GIT_CONFIG_GLOBAL=/dev/null
export GIT_CONFIG_NOSYSTEM=1
export GIT_AUTHOR_NAME="Ada Author"
export GIT_AUTHOR_EMAIL="ada@example.com"
export GIT_COMMITTER_NAME="Cy Committer"
export GIT_COMMITTER_EMAIL="cy@example.com"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
printf 'The committed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
printf 'A note for later.\n' > "$repo/later.txt" || fail "could not create later.txt"

message="Commit the note

The note now says it is committed."

#
# Waits until the message of the repo's newest commit is the text, and fails with what it was
# when it never is. Usage: wait_for_last_commit_message <text>
#
wait_for_last_commit_message() {
    local waited=0
    local last=""
    while [ "$waited" -lt 300 ]; do
        last="$(git -C "$repo" log -1 --format=%B)" || fail "could not read the test repo's newest commit"
        if [ "$last" = "$1" ]; then
            return 0
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    fail "the newest commit's message is \"$last\", not \"$1\""
}

start_app_on_start_page
click right-sidebar-toggle
wait_for_element git-commands-panel 30
open_repo_with_button "$repo"

click repo-details-commit
wait_for_element changes-pane 30
wait_for_text "change-unstaged-notes.txt" "notes.txt" 30
wait_for_element commit-section 30
wait_for_text commit-button "Nothing to commit" 30

click "stage-notes.txt"
wait_for_element "change-staged-notes.txt" 30
wait_for_text commit-button "Commit 1 file" 30

# A pre-commit hook that fails: git makes no commit and the commit section shows its output.
mkdir -p "$repo/.git/hooks" || fail "could not create the test repo's hooks directory"
printf '#!/bin/sh\necho "The pre-commit hook refused the commit." >&2\nexit 1\n' > "$repo/.git/hooks/pre-commit" || fail "could not write the pre-commit hook"
chmod +x "$repo/.git/hooks/pre-commit" || fail "could not make the pre-commit hook executable"

type_text commit-message "$message"
click commit-button
wait_for_element commit-error 30
wait_for_text commit-error "Git did not make the commit:" 30
wait_for_text commit-error "The pre-commit hook refused the commit." 30
wait_for_last_commit_message "Change the note

The note now says what the second note is."
wait_for_text changes-staged-heading "Staged (1)" 30
[ "$(value_of commit-message)" = "$message" ] || fail "the commit message box lost the message when the commit failed"

# With the hook gone the commit goes through.
rm "$repo/.git/hooks/pre-commit" || fail "could not remove the pre-commit hook"
click commit-button
wait_for_last_commit_message "$message"
wait_for_text changes-staged-heading "Staged (0)" 30
wait_for_text changes-summary "1 file, 0 staged" 30
wait_for_text changes-staged-empty "Nothing staged yet." 30
wait_for_element "change-unstaged-later.txt" 30
wait_for_missing_element commit-error 30
wait_for_text commit-button "Nothing to commit" 30
[ "$(value_of commit-message)" = "" ] || fail "the commit message box still holds the message after the commit"
[ "$(git -C "$repo" status --porcelain)" = "?? later.txt" ] || fail "git lists other changes than later.txt after the commit"
wait_for_text git-command-0-text "git status --porcelain=v1 --untracked-files=all --no-renames" 30
wait_for_text git-command-1-text "git commit --message 'Commit the note" 30

# The commit pane lists the new commit first.
hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the new commit's hash"
open_commit_pane
wait_for_text "commit-$hash" "Commit the note" 30
