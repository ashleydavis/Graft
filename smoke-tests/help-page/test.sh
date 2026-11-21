#!/usr/bin/env bash

#
# Starts the real app with remote control on, opens the Help page from the left sidebar and checks
# its heading, the line saying what it holds, the Pages section with each of Graft's pages and the
# Moving between pages section with each way to move between them all show. It opens a test repo
# first, so the left sidebar shows every link the page names.
# See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

repo="$ZIGGY_TEST_DIR/repo"
"$ZIGGY_SMOKE_APP_DIR/scripts/test/create-test-repo.sh" "$repo" || fail "could not create the test repo at $repo"

start_app_on_start_page
open_repo_with_button "$repo"
open_sidebar_page help
wait_for_text help-heading "Help" 30
wait_for_text help-description "Graft shows one page at a time in the middle of its window. These are its pages and the ways to move between them." 30
wait_for_text help-pages-heading "Pages" 30
wait_for_text help-welcome-term "Welcome" 30
wait_for_text help-welcome-text "The page Graft starts on. Its Open repo button opens a local Git repo." 30
wait_for_text help-repo-explorer-term "Repo explorer" 30
wait_for_text help-repo-explorer-text "Shows the open repo. Its Commits link lists the repo's commits." 30
wait_for_text help-help-term "Help" 30
wait_for_text help-help-text "This page." 30
wait_for_text help-about-term "About" 30
wait_for_text help-about-text "What Graft is, its version and where to find out more." 30
wait_for_text help-moving-heading "Moving between pages" 30
wait_for_text help-left-sidebar-term "Left sidebar" 30
wait_for_text help-left-sidebar-text "Repo explorer is at the top while a repo is open. Help and About are at the bottom. The menu button at the left of the top bar shrinks the sidebar to its icons and expands it again." 30
wait_for_text help-breadcrumb-trail-term "Breadcrumb trail" 30
wait_for_text help-breadcrumb-trail-text "The top bar shows the open repo and the page you are on. On the Help and About pages, click the page's name to switch between them." 30
wait_for_text help-file-menu-term "File menu" 30
wait_for_text help-file-menu-text "Open repo opens a local Git repo in the repo explorer. New window opens another Graft window on the welcome page." 30
wait_for_text help-keyboard-term "Keyboard" 30
wait_for_text help-shortcuts-key "?" 30
wait_for_text help-keyboard-text "to list Graft's keyboard shortcuts, such as the ones that open a repo and return to the repo explorer." 30
