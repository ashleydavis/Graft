#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a changed file in its working tree, starts the
# real app with remote control on and opens the repo with the welcome page's Open repo button. It
# checks the file pane of a working file is as wide as the page's visible area less its margins in
# the narrow window, then zooms out until the window is wider than the open panes need and checks
# the file pane of the working file and of a commit's file each reach the right edge of the repo
# explorer's columns and are wider than 840 pixels. Last, it zooms back to the actual size and
# checks the commit's file pane narrows with the window. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# How many times Ctrl+Minus is pressed: each zooms out a tenth, so seven take the zoom to 0.3 and
# the smoke test's window shows more than three times as many pixels across, more than the repo
# details, commit, commit details and file panes need side by side.
#
ZOOM_OUT_STEPS=7

#
# The width of the repo explorer page's left and right margins together, in pixels: its padding is
# the style guide's --space-6, 24 pixels, on each side.
#
PAGE_MARGINS_WIDTH=48

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
printf 'The changed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"

#
# Waits until the file pane is as wide as the page's visible area less the repo explorer's
# margins, its least width in a window narrower than 840 pixels and the margins, and fails with its
# width and the area's when it never is. Usage: wait_for_narrow_file_pane <seconds>
#
wait_for_narrow_file_pane() {
    local waited=0
    local pane_left pane_right area_left area_right expected
    while [ "$waited" -lt "$1" ]; do
        read -r pane_left pane_right <<< "$(bounds_of file-pane)"
        read -r area_left area_right <<< "$(bounds_of main-content)"
        expected=$((area_right - area_left - PAGE_MARGINS_WIDTH))
        if [ "$expected" -gt 840 ]; then
            fail "the page's visible area is $((area_right - area_left)) pixels wide, too wide for the narrow window check"
        fi
        if [ $((pane_right - pane_left - expected)) -ge -1 ]; then
            if [ $((pane_right - pane_left - expected)) -le 1 ]; then
                return 0
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the file pane is $((pane_right - pane_left)) pixels wide, not $expected, in a page area $((area_right - area_left)) pixels wide"
}

#
# Waits until the file pane's right edge is at the right edge of the repo explorer's columns and
# the pane is wider than 840 pixels, so it fills the width the panes to its left leave over, and
# fails with where the edges are when it never does. Usage: wait_for_filling_file_pane <seconds>
#
wait_for_filling_file_pane() {
    local waited=0
    local pane_left pane_right columns_left columns_right
    while [ "$waited" -lt "$1" ]; do
        read -r pane_left pane_right <<< "$(bounds_of file-pane)"
        read -r columns_left columns_right <<< "$(bounds_of repo-explorer-columns)"
        if [ $((columns_right - pane_right)) -ge -1 ]; then
            if [ $((columns_right - pane_right)) -le 1 ]; then
                if [ $((pane_right - pane_left)) -gt 840 ]; then
                    return 0
                fi
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the file pane runs from $pane_left to $pane_right and the columns from $columns_left to $columns_right"
}

#
# Presses the key and waits until the area the frontend is drawn in changes size, so the zoom has
# taken effect before the next step. Usage: press_zoom_key <key>
#
press_zoom_key() {
    local before
    before="$(viewport_size)"
    press_key "$1"
    local waited=0
    while [ "$(viewport_size)" = "$before" ]; do
        if [ "$waited" -ge 300 ]; then
            fail "the area the frontend is drawn in stayed $before after $1"
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
}

start_app_on_start_page
open_repo_with_button "$repo"

# In the narrow window the working file's pane is the page's visible area less the margins.
click repo-details-changes
wait_for_element changes-pane 30
# The changes pane draws its rows after the pane itself, so the click waits for the row. Release
# macOS arm64 run 45782860661 failed it clicking a row that was not drawn yet.
wait_for_element "change-unstaged-notes.txt" 30
click "change-unstaged-notes.txt"
wait_for_text file-diff "The changed note." 30
wait_for_narrow_file_pane 30

# Zoomed out, the window is wider than the panes need and the working file's pane fills the rest.
step=0
while [ "$step" -lt "$ZOOM_OUT_STEPS" ]; do
    press_zoom_key CmdOrCtrl+Minus
    step=$((step + 1))
done
wait_for_filling_file_pane 30

# A commit's file pane fills the rest too.
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"
open_commit_pane
wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details 30
click changed-file-notes.txt
wait_for_text file-diff "The second note." 30
wait_for_filling_file_pane 30

# Back at the actual size the commit's file pane narrows with the window.
press_zoom_key CmdOrCtrl+0
wait_for_narrow_file_pane 30
