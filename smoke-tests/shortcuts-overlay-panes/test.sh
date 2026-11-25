#!/usr/bin/env bash

#
# Starts the real app with remote control on and checks the keyboard shortcuts overlay lists the
# active pane's keys first: on the welcome page it lists the General group alone, starting with
# Open repo. With the commit pane active `?` shows the commit pane's group first, with Up, Down and
# Enter. With the file pane active Ctrl+/ shows the file pane's group first, with Left and Escape.
# The search box filters every group and hides a group with no match. See test.md.
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
# Fails unless the overlay's list starts with the text. Usage: expect_list_start <text> <why>
#
expect_list_start() {
    local shown
    shown="$(text_of shortcuts-overlay-columns)"
    case "$shown" in
        "$1"*)
            ;;
        *)
            fail "$2. The overlay shows: $shown"
            ;;
    esac
}

#
# Presses Ctrl+/ on the element with the data-id, with the key-down test command, because the
# native app's press-key takes only Ziggy's shortcut syntax, which refuses `/` as a key. It sends a
# keydown of Control first, as a user presses Control before `/`, because Graft opens or closes the
# overlay once per press of Control. Usage: press_ctrl_slash <data-id>
#
press_ctrl_slash() {
    local answer
    answer="$(control "{\"command\":\"key-down\",\"dataId\":\"$1\",\"key\":\"Control\",\"ctrl\":true}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "pressing Control on $1 failed: $answer"
    fi
    answer="$(control "{\"command\":\"key-down\",\"dataId\":\"$1\",\"key\":\"/\",\"ctrl\":true}")"
    if [ "$(printf '%s' "$answer" | jq -r '.ok')" != "true" ]; then
        fail "pressing Ctrl+/ on $1 failed: $answer"
    fi
}

start_app_on_start_page

# On the welcome page, which has no keys of its own, the overlay lists the General group alone.
press_key "?"
wait_for_text shortcut-open-repo-keys "$open_repo_keys" 30
expect_list_start "GeneralOpen repo$open_repo_keys" "the welcome page's overlay does not start with the General group's Open repo"
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# Down and Enter open the commit pane from the Commits link and make it active. `?` lists the
# commit pane's keys first.
open_repo_with_button "$repo"
press_key Down
press_key Enter
wait_for_element commit-list 30
press_key "?"
wait_for_element shortcut-group-commit-pane 30
expect_list_start "Commit pane" "the commit pane's group is not first with the commit pane active"
wait_for_text shortcut-commit-pane-arrowup-keys "Up" 30
wait_for_text shortcut-commit-pane-arrowdown-keys "Down" 30
wait_for_text shortcut-commit-pane-enter-keys "Enter" 30
wait_for_text shortcut-group-general-title "General" 30

# The search filters both groups: "enter" leaves the commit pane's Enter alone, and the General
# group, with no match, is hidden.
type_text shortcuts-overlay-search "enter"
wait_for_missing_element shortcut-group-general 30
wait_for_element shortcut-commit-pane-enter 30
if [ "$(control '{"command":"exists","dataId":"shortcut-commit-pane-arrowup"}' | jq -r '.ok')" != "false" ]; then
    fail "the search for enter still lists the commit pane's Up"
fi
press_key Escape
wait_for_missing_element shortcuts-overlay 30

# Down and Enter open the newest commit, and Enter opens its first file, which makes the file pane
# active. Ctrl+/ lists the file pane's keys first.
press_key Down
press_key Enter
wait_for_element commit-details-pane 30
wait_for_element changed-files 30
press_key Enter
wait_for_element file-pane 30
press_ctrl_slash repo-explorer-page
wait_for_element shortcut-group-file-pane 30
expect_list_start "File pane" "the file pane's group is not first with the file pane active"
wait_for_text shortcut-file-pane-arrowleft-keys "Left" 30
wait_for_text shortcut-file-pane-escape-keys "Escape" 30
press_key Escape
wait_for_missing_element shortcuts-overlay 30
