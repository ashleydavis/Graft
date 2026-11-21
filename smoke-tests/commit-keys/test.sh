#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo with the welcome page's Open repo button, opens the About page from the left sidebar and
# presses keys as a user does: Left in the breadcrumb trail drop-down's search box moves its cursor,
# Ctrl+1 opens the repo explorer, the arrow keys and Enter open the commit pane from the repo
# details pane's Commits link, then a commit, Up and Down show another commit's details at once,
# Enter opens one of its files, Escape closes the panes one at a time and Ctrl+1 returns to the
# repo explorer from the Help page. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# Waits until the commit details pane shows the commit title, and fails with what it last showed
# when it never does. Enter on another commit draws the pane afresh, so its title is missing while
# the commit loads, which wait_for_text reports as a failure at once. Up and Down in the commit pane
# draw it afresh in the same way. Usage: wait_for_commit_title <title>
#
wait_for_commit_title() {
    local waited=0
    local result=""
    while [ "$waited" -lt 30 ]; do
        result="$(control '{"command":"get-text","dataId":"commit-details-title"}')"
        if [ "$(printf '%s' "$result" | jq -r '.ok')" = "true" ]; then
            case "$(printf '%s' "$result" | jq -r '.value')" in
                *"$1"*)
                    return 0
                    ;;
            esac
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "commit-details-title never showed \"$1\". The last result was: $result"
}

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page about

# In the drop-down's search box, which has the focus when the drop-down opens, Left moves the
# cursor before the "a" typed, so "b" goes in front of it: the box holds "ba", which no page matches.
click breadcrumb-page
wait_for_element breadcrumb-page-menu 30
press_key a
press_key Left
press_key b
wait_for_text breadcrumb-page-no-match "No page matches \"ba\"." 30
press_key Escape
wait_for_missing_element breadcrumb-page-menu 30

# Ctrl+1 (Cmd+1 on macOS) opens the repo explorer.
press_key CmdOrCtrl+1
wait_for_element repo-explorer-page 30
wait_for_element repo-details-pane 30
wait_for_missing_element commit-pane 5

# Down selects the repo details pane's Commits link and Enter opens the commit pane.
press_key Down
press_key Enter
wait_for_text commit-list "Add the readme" 30

# Down twice selects the second commit, "Add the notes", and Enter opens its details.
press_key Down
press_key Down
press_key Enter
wait_for_element commit-details 30
wait_for_text commit-details-title "Add the notes" 30

# Left returns to the commit pane. Up selects the newest commit and the commit details pane shows
# it at once, then Down and Up move the details back and forth.
press_key Left
press_key Up
wait_for_commit_title "Change the note"
press_key Down
wait_for_commit_title "Add the notes"
press_key Up
wait_for_commit_title "Change the note"

# Enter makes the commit details pane active, so Down below moves through its files.
press_key Enter
wait_for_commit_title "Change the note"
wait_for_text changed-file-notes.txt "notes.txt" 30

# Down selects its one changed file and Enter opens its diff.
press_key Down
press_key Enter
wait_for_element file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_text file-diff "+The second note." 30

# Escape closes the file pane, then the commit details pane, then the commit pane, then leaves the
# repo details pane open.
press_key Escape
wait_for_missing_element file-pane 30
wait_for_element commit-details-pane 5
press_key Escape
wait_for_missing_element commit-details-pane 30
wait_for_element commit-pane 5
press_key Escape
wait_for_missing_element commit-pane 30
press_key Escape
wait_for_element repo-details-pane 5

# Ctrl+1 returns to the repo explorer from the Help page.
open_sidebar_page help
press_key CmdOrCtrl+1
wait_for_element repo-explorer-page 30
press_key Down
press_key Enter
wait_for_text commit-list "Change the note" 30
