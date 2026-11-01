#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, and checks that it opens on the About page: the
# page's heading, what Graft is and its icon all show. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

start_test_app
wait_for_element about-page 30
wait_for_text about-heading "About Graft" 30
wait_for_text about-description "Graft is a desktop Git client" 30
wait_for_element about-icon 30
