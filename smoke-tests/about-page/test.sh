#!/usr/bin/env bash

#
# Starts the real app with remote control on, opens the About page from the left sidebar and
# checks the page's heading, Graft's version, what Graft is, its icon, its links and its licence
# all show.
# See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

start_app_on_start_page
open_sidebar_page about
wait_for_text about-heading "About Graft" 30
wait_for_text about-version "Version dev" 30
wait_for_text about-description "Graft is a desktop Git client" 30
wait_for_element about-icon 30
wait_for_text about-graft-link "Graft on GitHub" 30
wait_for_text about-playbook-link "Playbook on GitHub" 30
wait_for_text about-ziggy-link "Ziggy on GitHub" 30
wait_for_text about-videos-link "The Graft video series on YouTube" 30
wait_for_text about-licence "Graft is released under the MIT licence." 30
