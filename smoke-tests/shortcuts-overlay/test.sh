#!/usr/bin/env bash

#
# Starts the real app with remote control on and presses keys as a user does: `?` shows the
# keyboard shortcuts overlay, which lists Open repo's shortcut first, under the General heading,
# with the focus in its search box. `?` typed there types the character, filters the list to the Keyboard Shortcuts action and
# leaves the overlay open. Escape closes it. A click outside the overlay closes it, and so does a
# click on its close button. Typing "quit" in the search box filters the list to
# Quit. Then `?` typed in the breadcrumb trail drop-down's search box types the character and leaves
# the overlay closed. Ctrl+/, pressed with the key-down test command, shows the overlay from that
# search box without typing, stays open while Ctrl+/ repeats, lists Ctrl+/, closes the overlay
# from its own search box and shows it from the page. The top bar shows "Ctrl+/: Show hotkeys", and
# a click on the top bar's keyboard shortcuts button shows the overlay. See test.md.
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
# Prints the value of the text box with the data-id. Usage: value_of <data-id>
#
value_of() {
    local answer
    answer="$(control "{\"command\":\"get-value\",\"dataId\":\"$1\"}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "reading the value of $1 failed: $answer"
    fi
    printf '%s' "$answer" | jq -r '.value'
}

#
# Prints the value of the overlay's search box.
#
search_value() {
    value_of shortcuts-overlay-search
}

#
# Sends a keydown of `/` with Control held to the element with the data-id, with the key-down test
# command, as a held Ctrl+/ repeats, and fails unless Graft kept the key from doing anything else.
# Usage: repeat_ctrl_slash <data-id>
#
repeat_ctrl_slash() {
    local answer
    answer="$(control "{\"command\":\"key-down\",\"dataId\":\"$1\",\"key\":\"/\",\"ctrl\":true}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "pressing Ctrl+/ on $1 failed: $answer"
    fi
    if [ "$(printf '%s' "$answer" | jq -r '.value')" != "prevented" ]; then
        fail "Graft did not handle Ctrl+/ pressed on $1: $answer"
    fi
}

#
# Presses Ctrl+/ on the element with the data-id, with the key-down test command, because the
# native app's press-key takes only Ziggy's shortcut syntax, which refuses `/` as a key. It sends a
# keydown of Control first, as a user presses Control before `/`, because Graft opens or closes the
# overlay once per press of Control. Fails unless Graft kept the key from doing anything else.
# Usage: press_ctrl_slash <data-id>
#
press_ctrl_slash() {
    local answer
    answer="$(control "{\"command\":\"key-down\",\"dataId\":\"$1\",\"key\":\"Control\",\"ctrl\":true}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "pressing Control on $1 failed: $answer"
    fi
    repeat_ctrl_slash "$1"
}

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page about

# `?` shows the overlay, which lists the shortcuts from Ziggy's action list in one group headed
# General, because the About page has no keys of its own.
press_key "?"
wait_for_element shortcuts-overlay 30
wait_for_text shortcuts-overlay-title "Keyboard shortcuts" 30
wait_for_text shortcut-open-repo-label "Open repo" 30
wait_for_text shortcut-open-repo-keys "$open_repo_keys" 30
wait_for_text shortcut-toggle-shortcuts-overlay-keys "?" 30
wait_for_element shortcut-quit 30
first_row="$(control '{"command":"get-text","dataId":"shortcuts-overlay-columns"}' | jq -r '.value')"
case "$first_row" in
    "GeneralOpen repo$open_repo_keys"*)
        ;;
    *)
        fail "the overlay does not start with the General group's Open repo and $open_repo_keys. It shows: $first_row"
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

# A click outside the overlay closes it.
press_key "?"
wait_for_element shortcuts-overlay-outside 30
click shortcuts-overlay-outside
wait_for_missing_element shortcuts-overlay 30

# A click on the close button at the right of the title closes the overlay.
press_key "?"
wait_for_element shortcuts-overlay-close 30
click shortcuts-overlay-close
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

# Ctrl+/ with the focus in the drop-down's search box shows the overlay and types nothing there.
press_key Escape
wait_for_missing_element breadcrumb-page-menu 30
click breadcrumb-page
wait_for_element breadcrumb-page-search 30
press_ctrl_slash breadcrumb-page-search
wait_for_element shortcuts-overlay-search 30
if [ "$(value_of breadcrumb-page-search)" != "" ]; then
    fail "Ctrl+/ typed into the drop-down's search box. It holds: $(value_of breadcrumb-page-search)"
fi

# A held Ctrl+/ repeats as another keydown of `/` with Control held. It leaves the overlay open.
# The wait is longer than the overlay's closing transition, so an overlay it closed has gone.
repeat_ctrl_slash shortcuts-overlay-search
sleep 1
wait_for_element shortcuts-overlay-search 30

# The overlay lists Ctrl+/ straight after `?`, under the Keyboard Shortcuts action's label.
wait_for_text shortcut-toggle-shortcuts-overlay-ctrl-label "Keyboard Shortcuts" 30
wait_for_text shortcut-toggle-shortcuts-overlay-ctrl-keys "Ctrl+/" 30

# Ctrl+/ in the overlay's own search box closes the overlay and types nothing there.
press_ctrl_slash shortcuts-overlay-search
wait_for_missing_element shortcuts-overlay 30

# Ctrl+/ on the page, with no text box involved, shows the overlay. Escape closes it.
press_key Escape
wait_for_missing_element breadcrumb-page-menu 30
press_ctrl_slash about-page
wait_for_element shortcuts-overlay-search 30
if [ "$(search_value)" != "" ]; then
    fail "the overlay's search box is not empty after Ctrl+/. It holds: $(search_value)"
fi
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# The top bar reminds the user of Ctrl+/.
wait_for_text top-bar-shortcuts-reminder "Ctrl+/: Show hotkeys" 30

# A click on the top bar's keyboard shortcuts button shows the overlay with an empty search box and
# every shortcut. Escape closes it.
click shortcuts-button
wait_for_element shortcuts-overlay-search 30
wait_for_text shortcut-open-repo-label "Open repo" 30
if [ "$(search_value)" != "" ]; then
    fail "the overlay's search box is not empty after the top bar's button. It holds: $(search_value)"
fi
press_key Escape
wait_for_missing_element shortcuts-overlay 30
