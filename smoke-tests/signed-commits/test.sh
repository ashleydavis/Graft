#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a signed commit on top and log.showSignature set
# in its config, starts the real app with remote control on, opens that repo and checks the commit
# pane lists the commits and the commit details pane shows the signed commit, with no error. See
# test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The SSH key the signed commit is signed with, in the test's own directory, so no GPG is needed
# and no two tests share a key.
#
signing_key="$ZIGGY_TEST_DIR/signing-key"
ssh-keygen -q -t ed25519 -N "" -C graft-test -f "$signing_key" || fail "could not make the signing key"

GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 \
    GIT_AUTHOR_NAME="Ada Author" GIT_AUTHOR_EMAIL="ada@example.com" \
    GIT_COMMITTER_NAME="Cy Committer" GIT_COMMITTER_EMAIL="cy@example.com" \
    GIT_AUTHOR_DATE="2026-01-04T09:00:00+00:00" GIT_COMMITTER_DATE="2026-01-04T09:00:00+00:00" \
    git -C "$repo" -c gpg.format=ssh -c user.signingkey="$signing_key" \
    commit --quiet --allow-empty --gpg-sign --message "Sign the notes" \
    || fail "could not make the signed commit"
git -C "$repo" config log.showSignature true || fail "could not set log.showSignature"

#
# The setup must make git log add signature text, or the test would pass without the fix.
#
git -C "$repo" cat-file commit HEAD | grep -q "^gpgsig " || fail "the newest commit is not signed"
plain_log="$(git -C "$repo" log --max-count=1 --format=%s)" || fail "git log failed in the test repo"
[ "$plain_log" != "Sign the notes" ] || fail "git log added no signature text, so the test would pass without the fix"

head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"
parent_hash="$(git -C "$repo" rev-parse HEAD~1)" || fail "could not read the parent of the test repo's newest commit"

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$head_hash" 30
wait_for_text "commit-$head_hash" "Sign the notes" 30
wait_for_text "commit-$parent_hash" "Change the note" 30
wait_for_missing_element commits-error 5
click "commit-$head_hash"
wait_for_element commit-details 30
wait_for_commit_heading "${head_hash:0:7}"
click commit-details-row
wait_for_element commit-info-pane 30
wait_for_text commit-details-title "Sign the notes" 30
wait_for_text commit-details-hash "$head_hash" 30
wait_for_text commit-details-parents "${parent_hash:0:7}" 30
wait_for_missing_element commit-details-error 5
