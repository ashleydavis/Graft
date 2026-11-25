#!/usr/bin/env bash

#
# Creates a test repo of the smoke test's own, starts the real app with remote control on, opens
# the right sidebar and checks its Help pane shows the help of the selected pane or page: the
# welcome page's, then on the repo explorer page the repo details pane's, the commit pane's after
# Right, the commit details pane's and the file pane's as each becomes active by a click or a key,
# with the keys drawn as key caps, then the Help page's and the About page's. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

#
# The test repo's newest commit, "Change the note", which changed notes.txt.
#
head_hash="$(git -C "$repo" rev-parse HEAD)" || fail "could not read the test repo's newest commit"

start_app_on_start_page

click right-sidebar-toggle
wait_for_element help-pane 30
wait_for_text help-pane-heading "Help" 30
wait_for_text help-pane-name "Welcome" 30
wait_for_text help-pane-description "The page Graft starts on. Its Open repo button opens a local Git repo." 30

open_repo_with_button "$repo"
wait_for_text help-pane-name "Repo details pane" 30
open_commit_pane
wait_for_text help-pane-name "Repo details pane" 30

press_key Right
wait_for_text help-pane-name "Commit pane" 30
wait_for_text help-pane-key-0-Up "Up" 30
wait_for_text help-pane-key-0-Down "Down" 30
wait_for_text help-pane-click-0 "Click a commit to open its details." 30

wait_for_element "commit-$head_hash" 30
click "commit-$head_hash"
wait_for_element commit-details 30
wait_for_text help-pane-name "Commit pane" 30
press_key Right
wait_for_text help-pane-name "Commit details pane" 30

click changed-file-notes.txt
wait_for_element file-diff 30
wait_for_text help-pane-name "Commit details pane" 30
press_key Right
wait_for_text help-pane-name "File pane" 30
wait_for_text help-pane-key-0-Left "Left" 30
press_key Escape
wait_for_text help-pane-name "Commit details pane" 30
press_key Left
wait_for_text help-pane-name "Commit pane" 30

open_sidebar_page help
wait_for_text help-pane-name "Help" 30
wait_for_text help-pane-description "This page." 30

open_sidebar_page about
wait_for_text help-pane-name "About" 30
wait_for_text help-pane-description "What Graft is, its version and where to find out more." 30
