#!/usr/bin/env bash

#
# Starts the real app with remote control on, in the light theme, and checks the top bar's theme
# menu: its button starts on Light, and choosing Dark, System and Light from the menu shows each
# theme's icon and saves each choice in the config file. See test.md.
#

source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"

#
# Waits until Graft's config file holds the theme setting. Usage: wait_for_saved_theme <setting>
#
wait_for_saved_theme() {
    local config_file="$ZIGGY_TEST_DIR/config/config.toml"
    local waited=0
    while ! grep -qx "theme = \"$1\"" "$config_file" 2>/dev/null; do
        if [ "$waited" -ge 300 ]; then
            cat "$config_file" >&2 2>/dev/null
            fail "the config file $config_file did not hold the theme setting $1 within 30 seconds"
        fi
        sleep 0.1
        waited=$((waited + 1))
    done
}

#
# Opens the theme menu, chooses the setting and waits until the button shows its icon, the menu
# has closed and the config file holds it. Usage: choose_theme <setting>
#
choose_theme() {
    click theme-button
    wait_for_element theme-menu-heading 30
    click "theme-option-$1"
    wait_for_element "theme-icon-$1" 30
    wait_for_missing_element theme-menu-heading 30
    wait_for_saved_theme "$1"
}

ZIGGY_THEME=light
start_app_on_start_page
open_sidebar_page about
wait_for_element theme-icon-light 30

choose_theme dark
wait_for_missing_element theme-icon-light 30

choose_theme system
wait_for_missing_element theme-icon-dark 30

choose_theme light
wait_for_missing_element theme-icon-system 30
wait_for_element about-page 30
