#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a second branch, feature/x, holding a commit
# main does not have, starts the real app with remote control on, opens that repo with the welcome
# page's Open repo button and checks the repo details pane lists both branches with main marked as
# checked out. It clicks feature/x and checks its branch pane lists the branch's own commit, then
# clicks main and checks its branch pane leaves that commit out. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The newest commit on main, which both branches have.
#
main_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

#
# A commit made on feature/x alone, with main left checked out, so only the branch pane of
# feature/x lists it.
#
git -C "$repo" branch feature/x || fail "could not make the branch feature/x in the test repo"
feature_tree="$(git -C "$repo" rev-parse "HEAD^{tree}")" || fail "could not read the test repo's newest tree"
feature_hash="$(git -C "$repo" -c user.name="Smoke Test" -c user.email=smoke-test@example.com commit-tree "$feature_tree" -p "$main_hash" -m "The feature's own commit")" || fail "could not make the commit on feature/x"
git -C "$repo" update-ref refs/heads/feature/x "$feature_hash" || fail "could not move feature/x to its own commit"

start_app_on_start_page
open_repo_with_button "$repo"
wait_for_text repo-details-branches-heading "Branches" 30
wait_for_text repo-details-branch-feature/x "feature/x" 30
wait_for_text repo-details-branch-main "main" 30
wait_for_text repo-details-branch-main "HEAD" 30
wait_for_text repo-details-branches-count "2" 30

click repo-details-branch-feature/x
wait_for_element commit-pane 30
wait_for_text commit-pane-heading "feature/x" 30
wait_for_element "commit-$feature_hash" 30
wait_for_text "commit-$feature_hash" "The feature's own commit" 30
wait_for_element "commit-$main_hash" 30

click repo-details-branch-main
wait_for_text commit-pane-heading "main" 30
wait_for_element "commit-$main_hash" 30
wait_for_missing_element "commit-$feature_hash" 5
