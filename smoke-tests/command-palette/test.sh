#!/usr/bin/env bash

#
# Starts the real app with remote control on and presses keys as a user does: Ctrl+Shift+P (Cmd+
# Shift+P on macOS) shows the command palette on the welcome page with the welcome page's commands
# first and the focus in its search box. Typing narrows the list, text that matches no label shows
# the empty text and Escape closes the palette. Ctrl+Shift+P shows it from the breadcrumb trail
# drop-down's search box too, without typing there. With a repo open and the commit pane active, the
# commit pane's commands come first. Running Keyboard Shortcuts from the palette with Enter closes
# the palette and shows the keyboard shortcuts overlay. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# Presses the palette's shortcut and waits until its search box shows.
#
open_palette() {
    press_key CmdOrCtrl+Shift+P
    wait_for_element command-palette-search 30
}

#
# Fails unless the palette's list starts with the heading. Usage: expect_first_group <heading>
#
expect_first_group() {
    local list
    list="$(text_of command-palette-list)"
    case "$list" in
        "$1"*)
            ;;
        *)
            fail "the palette's list does not start with $1. It shows: $list"
            ;;
    esac
}

start_app_on_start_page

# The palette opens over the welcome page with the welcome page's commands first, under its name.
open_palette
wait_for_text command-palette-group-relevant-title "Welcome page" 30
expect_first_group "Welcome page"
wait_for_text command-palette-group-other-title "Other commands" 30
wait_for_element command-open-repo 30
wait_for_element command-toggle-shortcuts-overlay 30

# The search box has the focus, so the keys type into it and the list narrows to the labels that
# hold the text.
press_key o
press_key p
press_key e
press_key n
if [ "$(value_of command-palette-search)" != "open" ]; then
    fail "the palette's search box does not hold open. It holds: $(value_of command-palette-search)"
fi
wait_for_missing_element command-toggle-shortcuts-overlay 30
wait_for_text command-open-repo-label "Open repo" 30

# Text that matches no label shows the empty text.
type_text command-palette-search "branch"
wait_for_text command-palette-no-match "No command matches \"branch\"." 30

# Escape closes the palette, and it opens again with an empty search.
press_key Escape
wait_for_missing_element command-palette 30
open_palette
if [ "$(value_of command-palette-search)" != "" ]; then
    fail "the palette's search box is not empty after it closed. It holds: $(value_of command-palette-search)"
fi
press_key Escape
wait_for_missing_element command-palette 30

# Ctrl+Shift+P opens the palette from the breadcrumb trail drop-down's search box, which has the
# focus, and types nothing there.
open_sidebar_page about
click breadcrumb-page
wait_for_element breadcrumb-page-search 30
open_palette
if [ "$(value_of breadcrumb-page-search)" != "" ]; then
    fail "Ctrl+Shift+P typed into the drop-down's search box. It holds: $(value_of breadcrumb-page-search)"
fi
press_key Escape
wait_for_missing_element command-palette 30
press_key Escape
wait_for_missing_element breadcrumb-page-menu 30

# With the commit pane active, the commit pane's commands come first.
open_sidebar_page welcome
open_repo_with_button "$repo"
open_commit_pane
click commit-pane
open_palette
wait_for_text command-palette-group-relevant-title "Commit pane" 30
expect_first_group "Commit pane"

# Enter runs the highlighted command, Keyboard Shortcuts, which closes the palette and shows the
# keyboard shortcuts overlay.
type_text command-palette-search "keyboard"
wait_for_missing_element command-open-repo 30
press_key Enter
wait_for_missing_element command-palette 30
wait_for_element shortcuts-overlay-search 30
press_key Escape
wait_for_missing_element shortcuts-overlay 30
