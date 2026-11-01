#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app, built with the test hooks, on
# that repo and checks that the commits page lists its commits. See test.md.
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

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
click about-commits-link
wait_for_element commits-page 30
wait_for_element commit-list 30
wait_for_element "commit-$head_hash" 30
wait_for_text commit-list "$own_title" 30
wait_for_text commit-list "Change the note" 30
wait_for_text commit-list "Add the notes" 30
wait_for_text commit-list "Add the readme" 30
