#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own whose first commit has a branch and many tags, starts
# the real app with remote control on, opens that repo with the welcome page's Open repo button and
# checks the commit pane's badge column: the first commit's title is in view, the column shows a
# "…" for the badges that do not fit, and the "…" opens a drop-down of every badge that closes on
# Escape and on a click outside it, without opening the commit. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's first commit, "Add the readme", which gets a branch and several tags.
#
first_hash="$(git -C "$repo" rev-list --max-parents=0 HEAD)" || fail "could not read the test repo's first commit"
git -C "$repo" branch first-branch "$first_hash" || fail "could not add a branch to the first commit"
for tag in v0.1.0 v0.2.0 v0.3.0 v0.4.0 v0.5.0; do
    git -C "$repo" tag "$tag" "$first_hash" || fail "could not add the tag $tag to the first commit"
done

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page repo-explorer
open_commit_pane
wait_for_element "commit-$first_hash" 30

# The title comes first and is in view, and the badge column shows a "…" for the rest.
wait_for_text "commit-title-$first_hash" "Add the readme" 30
wait_for_in_view "commit-title-$first_hash" 30
wait_for_element "commit-refs-more-$first_hash" 30

# The "…" opens a drop-down of every badge, which Escape closes.
click "commit-refs-more-$first_hash"
wait_for_element "commit-refs-menu-$first_hash" 30
for name in first-branch v0.1.0 v0.2.0 v0.3.0 v0.4.0 v0.5.0; do
    wait_for_text "commit-refs-menu-$first_hash" "$name" 30
done
press_key Escape
wait_for_missing_element "commit-refs-menu-$first_hash" 30

# A click outside the drop-down closes it too.
click "commit-refs-more-$first_hash"
wait_for_element "commit-refs-menu-$first_hash" 30
click "commit-refs-backdrop-$first_hash"
wait_for_missing_element "commit-refs-menu-$first_hash" 30

# Neither click on the "…" opened the commit.
wait_for_missing_element commit-details-pane 5
