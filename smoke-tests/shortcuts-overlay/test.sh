#!/usr/bin/env bash

#
# Starts the real app with remote control on and presses keys as a user does: `?` shows the
# keyboard shortcuts overlay, which lists Open repo's shortcut first, with the focus in its search
# box. `?` typed there types the character, filters the list to the Keyboard Shortcuts action and
# leaves the overlay open. Escape closes it. Typing "quit" in the search box filters the list to
# Quit. Then `?` typed in the breadcrumb trail drop-down's search box types the character and leaves
# the overlay closed. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Open repo's shortcut as Ziggy shows it on the platform: Command and O on macOS, Ctrl+O elsewhere.
#
open_repo_keys="Ctrl+O"
if [ "$ZIGGY_SMOKE_PLATFORM" = "macos" ]; then
    open_repo_keys="⌘O"
fi

#
# Fails when the element with the data-id is on the page. Usage: expect_missing <data-id> <why>
#
expect_missing() {
    if [ "$(control "{\"command\":\"exists\",\"dataId\":\"$1\"}" | jq -r '.ok')" != "false" ]; then
        fail "$2"
    fi
}

#
# Prints the value of the overlay's search box.
#
search_value() {
    local answer
    answer="$(control '{"command":"get-value","dataId":"shortcuts-overlay-search"}')"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "reading the overlay's search box failed: $answer"
    fi
    printf '%s' "$answer" | jq -r '.value'
}

export GRAFT_TEST_REPO="$repo"
start_app_on_start_page
open_sidebar_page about

# `?` shows the overlay, which lists the shortcuts from Ziggy's action list.
press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcuts-overlay-title "Keyboard shortcuts" 30
wait_for_text shortcut-open-repo-label "Open repo" 30
wait_for_text shortcut-open-repo-keys "$open_repo_keys" 30
wait_for_text shortcut-toggle-shortcuts-overlay-keys "?" 30
wait_for_element shortcut-quit 30
first_row="$(control '{"command":"get-text","dataId":"shortcuts-overlay-columns"}' | jq -r '.value')"
case "$first_row" in
    "Open repo$open_repo_keys"*)
        ;;
    *)
        fail "the overlay does not start with Open repo and $open_repo_keys. It shows: $first_row"
        ;;
esac

# The search box has the focus, so `?` types into it, filters the list to the shortcut whose keys
# are ? and leaves the overlay open.
press_key "?"
if [ "$(search_value)" != "?" ]; then
    fail "the overlay's search box did not type the ?. It holds: $(search_value)"
fi
wait_for_missing_element shortcut-open-repo 30
wait_for_element shortcut-toggle-shortcuts-overlay 30
wait_for_element shortcuts-overlay 30

# Escape closes the overlay.
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# Typing a label in the search box filters the list to the shortcuts it matches.
press_key "?"
wait_for_element shortcuts-overlay-search 30
press_key q
press_key u
press_key i
press_key t
if [ "$(search_value)" != "quit" ]; then
    fail "the overlay's search box does not hold quit. It holds: $(search_value)"
fi
wait_for_text shortcut-quit-label "Quit" 30
wait_for_missing_element shortcut-open-repo 30
expect_missing shortcut-toggle-shortcuts-overlay "the search for quit still lists Keyboard Shortcuts"
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# `?` typed in the drop-down's search box, which has the focus when the drop-down opens, is typed
# into it: the drop-down finds no page matching "?" and the overlay stays closed.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
press_key "?"
wait_for_text breadcrumb-page-no-match "No page matches \"?\"." 30
expect_missing shortcuts-overlay "the keyboard shortcuts overlay showed when ? was typed in the search box"
wait_for_element about-page 30
