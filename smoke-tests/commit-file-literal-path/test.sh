#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a newest commit that adds foo[1].txt and
# foo1.txt, starts the real app with remote control on, opens that repo with the welcome page's
# Open repo button and opens foo[1].txt in the commit details pane. It checks the file pane shows
# only foo[1].txt's lines, so git did not read the path as a pattern that also matches foo1.txt,
# and that the help panel shows the command with the path as the user would type it, without
# `:(literal)`. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The newest commit adds both files, each with a line of its own. Git runs with an empty global
# config and the system config switched off, as create-test-repo.sh runs it, so the user's own
# config and hooks leave the commit as it is.
#
printf 'The bracket file.\n' > "$repo/foo[1].txt" || fail "could not write foo[1].txt in the test repo"
printf 'The plain file.\n' > "$repo/foo1.txt" || fail "could not write foo1.txt in the test repo"
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 git -C "$repo" add . || fail "could not stage the files in the test repo"
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_AUTHOR_NAME="Ada Author" GIT_AUTHOR_EMAIL="ada@example.com" GIT_COMMITTER_NAME="Cy Committer" GIT_COMMITTER_EMAIL="cy@example.com" git -C "$repo" commit --quiet --message "Add the two files" || fail "could not commit the files in the test repo"
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

start_app_on_start_page

click right-sidebar-toggle
wait_for_element git-commands-panel 30

open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details 30
wait_for_text changed-files-heading "Files changed (2)" 30

click "changed-file-foo[1].txt"
wait_for_element file-diff 30
wait_for_text file-pane-path "foo[1].txt" 30
wait_for_text file-diff "The bracket file." 30
diff_text="$(text_of file-diff)"
case "$diff_text" in
    *"The plain file."*)
        fail "the file pane of foo[1].txt showed foo1.txt's lines too: $diff_text"
        ;;
esac

wait_for_text git-command-0-text "git diff-tree -r -p --root --no-commit-id $head_hash -- 'foo[1].txt'" 30
command_text="$(text_of git-command-0-text)"
case "$command_text" in
    *":(literal)"*)
        fail "the help panel showed :(literal) in the command: $command_text"
        ;;
esac
