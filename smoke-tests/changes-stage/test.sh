#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own and changes it: a modified file, a deleted file and a
# new file in a new directory. Starts the real app with remote control on, opens the repo with the
# welcome page's Open repo button, opens the changes pane with the repo details pane's Changes link,
# and checks the unstaged and staged lists, a file's diff, staging each file and unstaging one,
# what git holds after each and the Git commands the right sidebar shows, then the keys that close
# and open the panes. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

printf 'The changed note.\n' > "$repo/notes.txt" || fail "could not change notes.txt"
rm "$repo/README.md" || fail "could not delete README.md"
mkdir -p "$repo/docs" || fail "could not create the docs directory"
printf 'A new file.\n' > "$repo/docs/new.txt" || fail "could not create docs/new.txt"

#
# Waits until `git diff --cached --name-status` in the test repo, which lists the staged files,
# prints the text, one line per file, and fails with what it did print when it never does.
# Usage: wait_for_staged <text>
#
wait_for_staged() {
    local waited=0
    local staged=""
    while [ "$waited" -lt 300 ]; do
        staged="$(git -C "$repo" diff --cached --name-status)" || fail "could not read the test repo's staged files"
        if [ "$staged" = "$1" ]; then
            return 0
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
    fail "git listed the staged files as \"$staged\", not \"$1\""
}

start_app_on_start_page
click right-sidebar-toggle
wait_for_element git-commands-panel 30
open_repo_with_button "$repo"

click repo-details-changes
wait_for_element changes-pane 30
wait_for_in_view changes-pane 30
wait_for_text changes-heading "Changes" 30
wait_for_text changes-summary "3 files, 0 staged" 30
wait_for_text changes-unstaged-heading "Unstaged (3)" 30
wait_for_text changes-staged-heading "Staged (0)" 30
wait_for_text changes-staged-empty "Nothing staged yet." 30
wait_for_text "change-unstaged-notes.txt" "notes.txt" 30
wait_for_text "change-unstaged-README.md" "README.md" 30
wait_for_text "change-unstaged-docs/new.txt" "docs/new.txt" 30

# The Commit link's click leaves the repo details pane active, so Right makes the changes pane
# active for the right sidebar to list its commands.
press_key Right
wait_for_text git-command-0-text "git status --porcelain=v1 --untracked-files=all --no-renames" 30

click "change-unstaged-notes.txt"
wait_for_element file-pane 30
wait_for_in_view file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_text file-diff "The second note." 30
wait_for_text file-diff "The changed note." 30

# The click leaves the changes pane active, so Right makes the file pane active for the right
# sidebar to list its diff command.
press_key Right
wait_for_text git-command-0-text "git diff -- notes.txt" 30

click "stage-notes.txt"
wait_for_element "change-staged-notes.txt" 30
wait_for_missing_element "change-unstaged-notes.txt" 30
wait_for_text changes-unstaged-heading "Unstaged (2)" 30
wait_for_text changes-staged-heading "Staged (1)" 30
wait_for_staged "M	notes.txt"

# The click makes the changes pane active, so the right sidebar lists its two most recent commands:
# the status read after the stage above the stage itself.
wait_for_text git-command-0-text "git status --porcelain=v1 --untracked-files=all --no-renames" 30
wait_for_text git-command-1-text "git add -- notes.txt" 30
wait_for_missing_element git-command-2 30
wait_for_text file-diff "The changed note." 30

# Right makes the file pane active, which lists the staged diff it read again above the unstaged
# diff it read first.
press_key Right
wait_for_text git-command-0-text "git diff --cached -- notes.txt" 30
wait_for_text git-command-1-text "git diff -- notes.txt" 30
wait_for_missing_element git-command-2 30

click "change-unstaged-docs/new.txt"
wait_for_text file-pane-path "new.txt" 30
[ "$(text_of file-pane-path)" = "new.txt" ] || fail "the file pane's title showed \"$(text_of file-pane-path)\", not the file's name alone"
wait_for_text file-diff "A new file." 30
press_key Right
wait_for_text git-command-0-text "git diff --no-index -- /dev/null docs/new.txt" 30

click "stage-README.md"
wait_for_element "change-staged-README.md" 30
click "stage-docs/new.txt"
wait_for_element "change-staged-docs/new.txt" 30
wait_for_text changes-unstaged-empty "Everything is staged." 30
wait_for_text changes-staged-heading "Staged (3)" 30
wait_for_text changes-summary "3 files, 3 staged" 30
wait_for_staged "D	README.md
A	docs/new.txt
M	notes.txt"

click "change-staged-README.md"
wait_for_text file-pane-path "README.md" 30
wait_for_text file-diff "# Test repo" 30

click "unstage-notes.txt"
wait_for_element "change-unstaged-notes.txt" 30
wait_for_missing_element "change-staged-notes.txt" 30
wait_for_text changes-unstaged-heading "Unstaged (1)" 30
wait_for_text changes-staged-heading "Staged (2)" 30
wait_for_staged "D	README.md
A	docs/new.txt"
wait_for_text git-command-0-text "git status --porcelain=v1 --untracked-files=all --no-renames" 30
wait_for_text git-command-1-text "git restore --staged -- notes.txt" 30
wait_for_missing_element git-command-2 30
wait_for_text file-pane-path "README.md" 30

# The keys: Escape closes the file pane, then the changes pane, Enter on the selected Changes link
# opens the changes pane again, Down selects its first row and Enter opens that row's file pane.
press_key Escape
wait_for_missing_element file-pane 30
press_key Escape
wait_for_missing_element changes-pane 30
press_key Enter
wait_for_element changes-pane 30
wait_for_text changes-unstaged-heading "Unstaged (1)" 30
press_key Down
press_key Enter
wait_for_element file-pane 30
wait_for_text file-pane-path "notes.txt" 30
wait_for_text file-diff "The changed note." 30
