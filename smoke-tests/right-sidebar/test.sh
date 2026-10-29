#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, and checks the right sidebar starts closed, then
# slides it in and out again with the top bar's button, checking its content shows only while it
# is open and the page stays in the main content area. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

start_test_app
wait_for_element about-page 30
wait_for_element right-sidebar 30
wait_for_missing_element right-sidebar-content 30

click right-sidebar-toggle
wait_for_element right-sidebar-content 30
wait_for_element about-page 30

click right-sidebar-toggle
wait_for_missing_element right-sidebar-content 30
wait_for_element about-page 30
