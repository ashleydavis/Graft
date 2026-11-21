#!/usr/bin/env bash

#
# Starts the real app with remote control on and no repo open, cancels the File menu's Open repo
# folder picker, then opens two test repos of its own from the File menu one after the other and
# checks the commit explorer shows each. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

first_repo="$ZIGGY_TEST_DIR/first-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$first_repo" || fail "could not create the test repo at $first_repo"
second_repo="$ZIGGY_TEST_DIR/second-repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$second_repo" || fail "could not create the test repo at $second_repo"

#
# A commit only the second repo has, so the commit explorer lists it only once the second repo is
# open in place of the first.
#
second_title="The second repo's own commit in $(basename "$ZIGGY_TEST_DIR")"
git -C "$second_repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false commit --quiet --allow-empty --message "$second_title" || fail "could not commit to the second test repo"

#
# Gives the next folder picker the paths, so it shows no dialog and returns them as chosen. No
# paths is a cancelled picker. Usage: answer_picker [path ...]
#
answer_picker() {
    local line
    line="$(jq -nc '{command: "pick-answer", paths: $ARGS.positional}' --args "$@")"
    local answer
    answer="$(control "$line")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "answering the folder picker with $* failed: $answer"
    fi
}

start_app_on_start_page
wait_for_element left-sidebar-about-link 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30
wait_for_missing_element breadcrumb-page 30

answer_picker
choose_menu_item open-repo
sleep 3
wait_for_element welcome-page 30
wait_for_missing_element left-sidebar-commits-link 30
wait_for_missing_element breadcrumb-repo 30

answer_picker "$first_repo"
choose_menu_item open-repo
wait_for_element commits-page 30
wait_for_element commit-list 30
wait_for_text commit-list "Add the readme" 30
wait_for_text breadcrumb-repo "first-repo" 30
wait_for_text breadcrumb-page "Commits" 30
wait_for_element left-sidebar-commits-link 30

open_sidebar_page about
wait_for_text breadcrumb-repo "first-repo" 30
open_sidebar_page commits
wait_for_element commit-list 30
wait_for_text commit-list "Add the readme" 30

answer_picker "$second_repo"
choose_menu_item open-repo
wait_for_text breadcrumb-repo "second-repo" 30
wait_for_text commit-list "$second_title" 30
