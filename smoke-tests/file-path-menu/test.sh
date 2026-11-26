#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own with a changed file and a new one, and sets the
# `editor` setting in the test's own config file to a script that writes the path it is given to a
# file. Starts the real app with remote control on, opens the repo, checks the file path menu of a
# commit's changed file row leaves its file pane closed, checks the items of the file pane's menu
# and that Open in editor runs the editor setting with the file's full path, then checks a changes
# pane row's menu leaves the open file pane as it was, opens its file in the editor and shows why
# when the file has gone from the working tree. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's HEAD"

printf 'The changed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
mkdir -p "$repo/docs" || fail "could not create the docs directory"
printf 'A new file.\n' > "$repo/docs/guide.md" || fail "could not create docs/guide.md"

opened="$ZIGGY_TEST_DIR/opened.txt"
#
# The editor setting is the command Graft starts with the file's full path, and Graft starts it as a
# program rather than through a shell. Windows cannot start a shebang script that way, so there the
# editor is a batch file run by cmd, which Windows can start. Release Windows run 45782860995
# failed this test with the editor never writing anything.
#
if [ "$ZIGGY_SMOKE_PLATFORM" = "windows" ]; then
    editor="$ZIGGY_TEST_DIR/editor.cmd"
    printf '@echo %%1> "%s"\n' "$opened" > "$editor" || fail "could not write the editor script"
    editor_setting="cmd /c ${editor//\//\\}"
else
    editor="$ZIGGY_TEST_DIR/editor.sh"
    printf '#!/usr/bin/env bash\nprintf "%%s" "$1" > "%s"\n' "$opened" > "$editor" || fail "could not write the editor script"
    chmod +x "$editor" || fail "could not make the editor script executable"
    editor_setting="$editor"
fi

#
# Waits until the editor script has written the path, and fails with what it wrote when it never
# does. Windows joins the file's path to the repo with a backslash, so both sides are compared with
# forward slashes. The batch file's echo also ends the path with a carriage return, which is
# dropped.
# Usage: wait_for_opened <path>
#
wait_for_opened() {
    local waited=0
    local written=""
    while [ "$waited" -lt 300 ]; do
        written="$(cat "$opened" 2>/dev/null | tr -d '\r')"
        if [ "${written//\\//}" = "${1//\\//}" ]; then
            return 0
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    fail "the editor script was given \"$written\", not \"$1\""
}

start_app_on_start_page
mkdir -p "$ZIGGY_TEST_DIR/config" || fail "could not create the config directory"
printf 'editor = "%s"\n' "$editor_setting" >> "$ZIGGY_TEST_DIR/config/config.toml" || fail "could not write the editor setting"
open_repo_with_button "$repo"

# The menu of a commit's changed file row opens without opening the file's pane.
open_commit_pane
click "commit-$head_hash"
wait_for_text changed-file-notes.txt "notes.txt" 30
click changed-file-menu-notes.txt
wait_for_element file-path-menu-editor 30
wait_for_missing_element file-pane 30
press_key Escape
wait_for_missing_element file-path-menu 30

# The file pane's title bar menu lists its items, and Open in editor runs the editor setting.
click changed-file-notes.txt
wait_for_element file-diff 30
click file-pane-path-menu
wait_for_element file-path-menu-copy-full 30
wait_for_text file-path-menu-copy-full "Copy full file path" 30
wait_for_text file-path-menu-copy-relative "Copy relative file path" 30
wait_for_text file-path-menu-copy-name "Copy file name" 30
wait_for_text file-path-menu-file-manager "$(file_manager_label)" 30
wait_for_text file-path-menu-editor "Open in editor" 30
click file-path-menu-editor
wait_for_opened "$repo/notes.txt"
wait_for_missing_element file-path-menu 30

# A changes pane row's menu leaves the open file pane on the file it showed.
click repo-details-changes
wait_for_element changes-pane 30
click "change-unstaged-notes.txt"
wait_for_text file-pane-path "notes.txt" 30
click "change-unstaged-menu-docs/guide.md"
wait_for_element file-path-menu-editor 30
[ "$(text_of file-pane-path)" = "notes.txt" ] || fail "the file pane showed \"$(text_of file-pane-path)\" after a click on docs/guide.md's menu button, not notes.txt"
click file-path-menu-editor
wait_for_opened "$repo/docs/guide.md"
wait_for_missing_element file-path-menu 30

# A file gone from the working tree shows why it was not opened.
rm "$repo/docs/guide.md" || fail "could not delete docs/guide.md"
click "change-unstaged-menu-docs/guide.md"
wait_for_element file-path-menu-editor 30
click file-path-menu-editor
wait_for_element file-path-menu-error 30
wait_for_text file-path-menu-error "is not in the working tree" 30
