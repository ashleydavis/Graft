#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens the
# repo with the welcome page's Open repo button and checks the right sidebar lists the Git commands
# of the active pane as Right, Left, Escape and clicks change it: none for the repo details pane,
# git log for the commit pane, the two git diff-tree commands for the commit details pane and git
# diff-tree for a file's diff for the file pane. It checks every command listed shows how long it
# took and the panel shows the total time of every command the pane ran. It checks a pane's
# commands stay when it closes and when the sidebar closes and that the About page shows none. It
# runs every command the sidebar shows in a terminal's shell, after the cd it shows, so a command
# that does not work fails the test. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

#
# The most commands the sidebar lists for one pane, COMMANDS_SHOWN_MAX in the frontend.
#
MAX_COMMANDS=2

#
# Fails unless the duration the element with the data-id shows is written as the panel writes one:
# whole milliseconds ("12 ms"), seconds to one decimal place ("1.4 s") or minutes and seconds
# ("1 min 5 s").
#
check_duration_text() {
    local data_id="$1"
    local duration
    duration="$(text_of "$data_id")"
    if [[ ! "$duration" =~ ^([0-9]+\ ms|[0-9]+\.[0-9]\ s|[0-9]+\ min\ [0-9]+\ s)$ ]]; then
        fail "$data_id showed \"$duration\", which is not a duration"
    fi
}

#
# Checks every command the sidebar lists shows its duration and the panel shows the total time.
#
check_durations() {
    local index=0
    while [ "$index" -lt "$MAX_COMMANDS" ]; do
        if [ "$(control "{\"command\":\"exists\",\"dataId\":\"git-command-$index\"}" | jq -r '.ok')" != "true" ]; then
            break
        fi
        check_duration_text "git-command-$index-duration"
        index=$((index + 1))
    done
    [ "$index" -gt 0 ] || fail "the sidebar showed no Git commands"
    check_duration_text git-commands-total
}

#
# Runs every command the sidebar shows, each after the cd it shows, in a shell of its own started
# outside the repo, as a user pasting them into a terminal would. Fails when the sidebar shows no
# command, when a command fails or when git log does not list the test repo's newest commit.
#
run_shown_commands() {
    local directory_command
    directory_command="$(text_of git-commands-directory)"
    [ "$directory_command" = "cd $repo" ] || fail "the sidebar showed \"$directory_command\", not \"cd $repo\""
    local index=0
    local command
    local output
    while [ "$index" -lt "$MAX_COMMANDS" ]; do
        if [ "$(control "{\"command\":\"exists\",\"dataId\":\"git-command-$index\"}" | jq -r '.ok')" != "true" ]; then
            break
        fi
        command="$(text_of "git-command-$index-text")"
        echo "Running the shown command: $directory_command; $command"
        output="$(cd "$ZIGGY_TEST_DIR" && GIT_PAGER=cat bash -c "$directory_command"$'\n'"$command" 2>&1)" \
            || fail "the shown command \"$command\" failed after \"$directory_command\": $output"
        case "$command" in
            "git log --no-show-signature --max-count=50 --branches --remotes HEAD --")
                case "$output" in
                    *"Change the note"*)
                        ;;
                    *)
                        fail "\"$command\" did not list the newest commit: $output"
                        ;;
                esac
                ;;
        esac
        index=$((index + 1))
    done
    [ "$index" -gt 0 ] || fail "the sidebar showed no Git commands"
}

start_app_on_start_page

click right-sidebar-toggle
wait_for_element git-commands-panel 30
wait_for_text git-commands-empty "This page has run no Git commands." 30

# The repo details pane, active as the repo opens, runs no Git commands.
open_repo_with_button "$repo"
wait_for_text git-commands-empty "This pane has run no Git commands." 30

# Right makes the commit pane active once the Commits link has opened it.
open_commit_pane
press_key Right
wait_for_text git-command-0-text "git log --no-show-signature --max-count=50 --branches --remotes HEAD --" 30
wait_for_text git-commands-directory "cd $repo" 30
run_shown_commands

# A click on a commit leaves the commit pane active, so the sidebar keeps listing its git log.
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details 30
wait_for_text git-command-0-text "git log --no-show-signature --max-count=50 --branches --remotes HEAD --" 30
wait_for_missing_element git-command-1 30

# Right makes the commit details pane active, and the sidebar lists its commands at once.
press_key Right
wait_for_text git-command-0-text "git diff-tree -r --root --no-commit-id --numstat $head_hash --" 30
wait_for_text git-command-1-text "git diff-tree -r --root --no-commit-id --name-status $head_hash --" 30
wait_for_missing_element git-command-2 30
check_durations
run_shown_commands

# Left goes back to the commit pane's git log, and Left again to the repo details pane, which has
# run none.
press_key Left
wait_for_text git-command-0-text "git log --no-show-signature --max-count=50 --branches --remotes HEAD --" 30
press_key Left
wait_for_text git-commands-empty "This pane has run no Git commands." 30

# A click on a file leaves the commit details pane active. Right makes the file pane active, which
# lists only the git diff-tree for the file's diff.
click changed-file-notes.txt
wait_for_element file-diff 30
wait_for_text git-command-0-text "git diff-tree -r --root --no-commit-id --numstat $head_hash --" 30
press_key Right
wait_for_text git-command-0-text "git diff-tree -r -p --root --no-commit-id $head_hash -- notes.txt" 30
wait_for_missing_element git-command-1 30
check_durations
run_shown_commands

# Closing the file pane keeps its commands: opening the file again shows them, with the commit
# details pane's commands kept apart.
press_key Escape
wait_for_missing_element file-pane 30
wait_for_text git-command-0-text "git diff-tree -r --root --no-commit-id --numstat $head_hash --" 30
click changed-file-notes.txt
wait_for_element file-diff 30
press_key Right
wait_for_text git-command-0-text "git diff-tree -r -p --root --no-commit-id $head_hash -- notes.txt" 30
wait_for_missing_element git-command-1 30

click right-sidebar-toggle
wait_for_missing_element git-commands-panel 30
click right-sidebar-toggle
wait_for_text git-command-0-text "git diff-tree -r -p --root --no-commit-id $head_hash -- notes.txt" 30

open_sidebar_page about
wait_for_text git-commands-empty "This page has run no Git commands." 30
