#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, which has the lightweight tag v1.0, adds the
# annotated tag v2.0 with real git, starts the real app with remote control on, opens the repo with
# the welcome page's Open repo button and checks the repo details pane lists both tags under its
# Tags heading. It opens each tag with a click and checks the tag pane shows its details: the
# commit for both, and the message and tagger for the annotated tag. It closes the tag pane with
# Escape, then opens the other tag with Up and Enter and closes it with its close button. See
# test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The annotated tag v2.0 on the test repo's newest commit, "Change the note", made by a tagger the
# test names, with a message of a title and a description.
#
GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1 GIT_COMMITTER_NAME="Tia Tagger" GIT_COMMITTER_EMAIL="tia@example.com" \
    git -C "$repo" tag --annotate v2.0 --message "Release two" --message "The second release." \
    || fail "could not add the annotated tag v2.0 to the test repo"
v1_hash="$(git -C "$repo" rev-parse --short=7 'v1.0^{commit}')" || fail "could not read the commit of v1.0"
v2_hash="$(git -C "$repo" rev-parse --short=7 'v2.0^{commit}')" || fail "could not read the commit of v2.0"

start_app_on_start_page
open_repo_with_button "$repo"

# The Tags heading lists both tags.
wait_for_text repo-details-tags-heading "Tags" 30
wait_for_text repo-details-tag-v1.0 "v1.0" 30
wait_for_text repo-details-tag-v2.0 "v2.0" 30

# A click on the lightweight tag shows its commit and no tagger.
click repo-details-tag-v1.0
wait_for_element tag-pane 30
wait_for_text tag-heading "v1.0" 30
wait_for_text tag-commit-hash "$v1_hash" 30
wait_for_text tag-commit-title "Add the notes" 30
wait_for_missing_element tag-tagger 5

# A click on the annotated tag shows its message, commit and tagger in place of the other tag.
click repo-details-tag-v2.0
wait_for_text tag-heading "v2.0" 30
wait_for_text tag-message-title "Release two" 30
wait_for_text tag-message-description "The second release." 30
wait_for_text tag-commit-hash "$v2_hash" 30
wait_for_text tag-commit-title "Change the note" 30
wait_for_text tag-tagger "Tia Tagger" 30
wait_for_text tag-tagger "tia@example.com" 30

# Escape closes the tag pane, Up selects the other tag and Enter opens it.
press_key Escape
wait_for_missing_element tag-pane 30
press_key Up
press_key Enter
wait_for_element tag-pane 30
wait_for_text tag-heading "v1.0" 30
wait_for_text tag-commit-title "Add the notes" 30

# The close button closes it.
click tag-close
wait_for_missing_element tag-pane 30
