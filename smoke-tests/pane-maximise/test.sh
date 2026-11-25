#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# that repo, opens the commit details pane on the repo explorer page and maximises it with its
# button and then with M, checking each time that it fills the repo explorer with the other panes
# hidden and that the second click or M puts them back. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's first commit, "Add the readme".
#
root_hash="$(git -C "$repo" rev-list --max-parents=0 HEAD)" || fail "could not read the test repo's first commit"

#
# Waits until the pane with the data-id fills the repo explorer's columns, edge to edge, and the
# repo details pane and the commit pane are hidden, taking no room. Usage: wait_for_maximised <data-id>
#
wait_for_maximised() {
    local waited=0
    local columns=""
    local pane=""
    while [ "$waited" -lt 30 ]; do
        columns="$(bounds_of repo-explorer-columns)"
        pane="$(bounds_of "$1")"
        if [ "$pane" = "$columns" ]; then
            if [ "$(bounds_of repo-details-pane)" = "0 0" ]; then
                if [ "$(bounds_of commit-pane)" = "0 0" ]; then
                    return 0
                fi
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "$1 never filled the repo explorer with the other panes hidden: it is at $pane, the columns at $columns, the repo details pane at $(bounds_of repo-details-pane) and the commit pane at $(bounds_of commit-pane)"
}

#
# Waits until the repo details pane, the commit pane and the pane with the data-id all show again,
# side by side, each narrower than the repo explorer's columns. Usage: wait_for_restored <data-id>
#
wait_for_restored() {
    local waited=0
    local repo_details=""
    local commits=""
    local pane=""
    while [ "$waited" -lt 30 ]; do
        repo_details="$(bounds_of repo-details-pane)"
        commits="$(bounds_of commit-pane)"
        pane="$(bounds_of "$1")"
        if [ "$repo_details" != "0 0" ]; then
            if [ "$commits" != "0 0" ]; then
                if [ "$pane" != "$(bounds_of repo-explorer-columns)" ]; then
                    read -r repo_left repo_right <<< "$repo_details"
                    read -r commits_left commits_right <<< "$commits"
                    read -r pane_left pane_right <<< "$pane"
                    if [ "$repo_right" -le "$commits_left" ]; then
                        if [ "$commits_right" -le "$pane_left" ]; then
                            return 0
                        fi
                    fi
                fi
            fi
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the panes never came back side by side: the repo details pane is at $repo_details, the commit pane at $commits and $1 at $pane"
}

start_app_on_start_page
open_repo_with_button "$repo"
open_commit_pane
wait_for_element "commit-$root_hash" 30
click "commit-$root_hash"
wait_for_element changed-file-README.md 30
wait_for_text changed-file-README.md "README.md" 30

click commit-details-maximise
wait_for_maximised commit-details-pane
wait_for_text changed-file-README.md "README.md" 5
click commit-details-maximise
wait_for_restored commit-details-pane

# Clicking the pane's title makes it the active pane, which M acts on.
click commit-details-heading
press_key m
wait_for_maximised commit-details-pane
press_key m
wait_for_restored commit-details-pane
