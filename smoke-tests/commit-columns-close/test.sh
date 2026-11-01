#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app, built with the test hooks, on
# that repo, opens the commit details pane and the file pane on the commits page, then closes the
# file pane and the commit details pane and checks each has gone. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's first commit, "Add the readme", which added README.md.
#
root_hash="$(git -C "$repo" rev-list --max-parents=0 HEAD)" || fail "could not read the test repo's first commit"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element about-page 30
click about-commits-link
wait_for_element "commit-$root_hash" 30
click "commit-$root_hash"
wait_for_element changed-files 30
wait_for_text changed-files "A README.md" 30
click changed-file-README.md
wait_for_element file-diff 30
wait_for_text file-diff "+# Test repo" 30

click file-pane-close
wait_for_missing_element file-pane 30
wait_for_element commit-details-pane 5

click commit-details-close
wait_for_missing_element commit-details-pane 30
wait_for_element commit-pane 5
wait_for_element "commit-$root_hash" 5
