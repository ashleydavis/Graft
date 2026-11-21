#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button and checks that the repo explorer page shows
# the repo details pane alone, with the repo's name and path, then clicks its Commits link and
# checks that the commit pane opens to its right and lists the repo's commits. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# A commit only this run's repo has, so the page lists it only when it reads this run's repo.
#
own_title="The smoke test's own commit in $(basename "$ZIGGY_TEST_DIR")"
git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com -c commit.gpgsign=false commit --quiet --allow-empty --message "$own_title" || fail "could not commit to the test repo"
head_hash="$(git -C "$repo" rev-parse HEAD)"

start_app_on_start_page
open_repo_with_button "$repo"
wait_for_text repo-details-heading "Repo" 30
wait_for_text repo-details-name "repo" 30
wait_for_text repo-details-path "$repo" 30
wait_for_text repo-details-commits "Commits" 30
wait_for_missing_element commit-pane 5

open_commit_pane
wait_for_element commit-list 30
wait_for_element "commit-$head_hash" 30
wait_for_text commit-list "$own_title" 30
wait_for_text commit-list "Change the note" 30
wait_for_text commit-list "Add the notes" 30
wait_for_text commit-list "Add the readme" 30
