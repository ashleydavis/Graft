#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a changed file and a staged new file, starts the
# real app with remote control on, opens the repo with the welcome page's Open repo button and
# presses Ctrl+C (Cmd+C on macOS) through the native app as a user does: on a selected commit, a
# selected file in the commit details pane, a pane with no item selected and both lists of the
# changes pane, then in the commit message box. After each press it pastes the clipboard into the
# keyboard shortcuts overlay's search box, or back into the commit message box, and checks what was
# copied. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

printf 'The changed readme.\n' > "$repo/README.md" || fail "could not change README.md"
mkdir -p "$repo/docs" || fail "could not create the docs directory"
printf 'A new file.\n' > "$repo/docs/new.txt" || fail "could not create docs/new.txt"
git -C "$repo" add docs/new.txt || fail "could not stage docs/new.txt"
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

#
# Waits until the text box with the data-id holds the text, and fails with what it did hold when it
# never does. Usage: wait_for_value <data-id> <text>
#
wait_for_value() {
    local waited=0
    local shown=""
    while [ "$waited" -lt 30 ]; do
        shown="$(value_of "$1")"
        if [ "$shown" = "$2" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "$1 held \"$shown\", not \"$2\""
}

#
# Pastes the clipboard into the search box of the keyboard shortcuts overlay, which `?` shows with
# the focus in that box, as a user does, and checks the box holds the text, so the test reads what
# the copy key put on the clipboard. Escape then closes the overlay, which gives the focus back to
# the repo explorer page. Usage: expect_clipboard <text>
#
expect_clipboard() {
    press_key "?"
    wait_for_element shortcuts-overlay-search 30
    press_key CmdOrCtrl+V
    wait_for_value shortcuts-overlay-search "$1"
    press_key Escape
    wait_for_missing_element shortcuts-overlay 30
}

start_app_on_start_page
open_repo_with_button "$repo"

# Down and Enter open the commit pane, and Down selects the newest commit, whose full hash Ctrl+C
# copies.
press_key Down
press_key Enter
wait_for_text commit-list "Change the note" 30
press_key Down
press_key CmdOrCtrl+C
expect_clipboard "$head_hash"

# Enter opens the commit's details with the commit details pane active and its one changed file,
# notes.txt, selected. Ctrl+C copies the file's path.
press_key Enter
wait_for_element changed-file-notes.txt 30
wait_for_text changed-file-notes.txt "notes.txt" 30
press_key CmdOrCtrl+C
expect_clipboard "notes.txt"

# Escape twice closes the commit details pane and the commit pane, then Down and Enter open the
# changes pane with no row selected. Ctrl+C there copies nothing, so the clipboard still holds
# notes.txt.
press_key Escape
wait_for_missing_element commit-details-pane 30
press_key Escape
wait_for_missing_element commit-pane 30
press_key Down
press_key Enter
wait_for_element "change-unstaged-README.md" 30
wait_for_text "change-unstaged-README.md" "README.md" 30
wait_for_text "change-staged-docs/new.txt" "docs/new.txt" 30
press_key CmdOrCtrl+C
expect_clipboard "notes.txt"

# Down selects the unstaged README.md and Ctrl+C copies its path, then Down selects the staged
# docs/new.txt and Ctrl+C copies its path from the root of the repo.
press_key Down
press_key CmdOrCtrl+C
expect_clipboard "README.md"
press_key Down
press_key CmdOrCtrl+C
expect_clipboard "docs/new.txt"

# In the commit message box, with docs/new.txt still selected in the changes pane, Ctrl+A and
# Ctrl+C copy the text selected in the box. The test clears the box and Ctrl+V pastes the text back.
type_text commit-message "Fix the copy key"
focus_element commit-message
press_key CmdOrCtrl+A
press_key CmdOrCtrl+C
type_text commit-message ""
press_key CmdOrCtrl+V
wait_for_value commit-message "Fix the copy key"
