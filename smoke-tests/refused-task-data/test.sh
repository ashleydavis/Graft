#!/usr/bin/env bash

#
# Starts the real app with remote control on and sends the backend's tasks invalid data: an
# empty repo path to the commits, commit details and file diff tasks and data that is not
# null to the pick-repo-folder task. It checks each task fails with the text naming what was
# wrong and what to do, and that the app still handles the ready command after each one, so the
# backend keeps running after a refusal. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# The text the backend fails a task with when it is given an empty repo path.
#
EMPTY_REPO_PATH_TEXT="The repo path is empty. Give the path of the repo to read."

#
# The hash the commit details and file diff tasks are given, a valid one, so the empty repo path is
# the one thing wrong with their data.
#
COMMIT_HASH="1111111111111111111111111111111111111111"

#
# Runs the task with the data, checks it failed with the text and checks the app still handles
# the ready command. Usage: expect_task_refused <task-type> <data-json> <text>
#
expect_task_refused() {
    local result
    result="$(run_task "$1" "$2")"
    if [ "$(printf '%s' "$result" | jq -r '.status')" != "failed" ]; then
        fail "the $1 task did not fail on the data $2: $result"
    fi
    if [ "$(printf '%s' "$result" | jq -r '.errorMessage')" != "$3" ]; then
        fail "the $1 task failed on the data $2 with the wrong text: $result"
    fi
    wait_for_ready
}

start_app_on_start_page

expect_task_refused commits '{"repoPath":"","pageSize":50}' "$EMPTY_REPO_PATH_TEXT"
expect_task_refused commit-details "{\"repoPath\":\"\",\"hash\":\"$COMMIT_HASH\"}" "$EMPTY_REPO_PATH_TEXT"
expect_task_refused file-diff "{\"repoPath\":\"\",\"hash\":\"$COMMIT_HASH\",\"path\":\"README.md\"}" "$EMPTY_REPO_PATH_TEXT"
expect_task_refused pick-repo-folder '{"title":"Other"}' "The folder picker task was given data. Send null, because Graft sets every option of the folder picker."

wait_for_element welcome-page 30
