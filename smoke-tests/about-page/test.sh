#!/usr/bin/env bash

#
# Starts the real app, built with the test hooks, and checks that it opens on the About page: the
# page's heading, what Graft is and its icon all show. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# Waits until the element with the data-id is on the page, and fails when it never is. The
# frontend answers commands before React has drawn the page, and text_of reports a missing
# element as a failure, so the page is waited for first.
# Usage: wait_for_element <data-id> <seconds>
#
wait_for_element() {
    local waited=0
    local answer=""
    while [ "$waited" -lt "$2" ]; do
        answer="$(control "{\"command\":\"exists\",\"dataId\":\"$1\"}")"
        if [ "$(printf '%s' "$answer" | jq -r '.ok')" = "true" ]; then
            return 0
        fi
        sleep 1
        waited=$((waited + 1))
    done
    fail "the page never showed $1. The last answer was: $answer"
}

start_test_app
wait_for_element about-page 30
wait_for_text about-heading "About Graft" 30
wait_for_text about-description "Graft is a desktop Git client" 30
wait_for_element about-icon 30
