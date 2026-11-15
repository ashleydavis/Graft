#!/usr/bin/env bash

#
# Starts the real app with remote control on and presses keys as a user does: `?` shows the
# keyboard shortcuts overlay with its placeholder text, `?` closes it, `?` shows it again and Escape
# closes it. Then `?` typed in the breadcrumb trail drop-down's search box types the character and
# leaves the overlay closed. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

export GRAFT_TEST_REPO="$repo"
start_test_app
wait_for_element welcome-page 30
click left-sidebar-about-link
wait_for_element about-page 30

# `?` shows the overlay and `?` closes it.
press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcuts-overlay-title "Keyboard shortcuts" 30
wait_for_text shortcuts-overlay-placeholder "Placeholder: Graft's keyboard shortcuts are listed here." 30
press_key "?"
wait_for_missing_element shortcuts-overlay 30

# `?` shows the overlay again and Escape closes it.
press_key "?"
wait_for_element shortcuts-overlay 30
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# `?` typed in the drop-down's search box, which has the focus when the drop-down opens, is typed
# into it: the drop-down finds no page matching "?" and the overlay stays closed.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
press_key "?"
wait_for_text breadcrumb-page-no-match "No page matches \"?\"." 30
if [ "$(control '{"command":"exists","dataId":"shortcuts-overlay"}' | jq -r '.ok')" != "false" ]; then
    fail "the keyboard shortcuts overlay showed when ? was typed in the search box"
fi
wait_for_element about-page 30
