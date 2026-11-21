# lib/common.sh

What every smoke test uses: it starts the app, talks to it through the remote control server and checks what the frontend shows. Each smoke test's `test.sh` sources it. It defines functions only, and stops the app when the smoke test ends, however it ends.

- `start_test_app`: starts the remote control server and the app with `--remote-control`, which connects to the server, and with `--theme` when `ZIGGY_THEME` is set. The app keeps its config and state files in the smoke test's own directory.
- `start_app_on_start_page`: starts the app as `start_test_app` does and waits until it shows its start page, the welcome page. Every smoke test starts the app with it, so a change to the start page is one edit in this file.
- `restart_test_app`: stops the app and starts it again, with a new remote control server, on the config and state files the last run left.
- `restart_app_on_start_page`: starts the app again as `restart_test_app` does and waits until it shows its start page.
- `control <json>`: sends one command to the app through the remote control server and prints the reply.
- `click <data-id>`: clicks the element with the data-id.
- `open_sidebar_page <page>`: clicks the page's link in the left sidebar (data-id `left-sidebar-<page>-link`) and waits until the page (data-id `<page>-page`) shows. Every smoke test opens a page from the sidebar with it, so a change to the links is one edit in this file.
- `text_of <data-id>`: prints the text of the element with the data-id.
- `wait_for_text <data-id> <text> [seconds]`: waits until the element's text contains the text.
- `wait_for_element <data-id> <seconds>`: waits until the element with the data-id is on the page.
- `wait_for_missing_element <data-id> <seconds>`: waits until the element with the data-id has gone from the page.
- `wait_for_in_view <data-id> <seconds>`: waits until the element's left and right edges are inside the window, so the user can see it.
- `choose_menu_item <action>`: chooses a menu item through the native app, as a user would.
- `press_key <key>`: presses a key through the native app, as a user would. The key is written as a shortcut, such as `CmdOrCtrl+Shift+H`.
- `viewport_size`: prints the size of the area the frontend is drawn in.

The platform library `run.sh` chooses (`linux.sh`, `windows.sh` or `macos.sh`) starts and stops the app for it.

## How it is invoked

A smoke test sources it:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"
```

## Arguments

It takes no arguments. It reads the platform, the smoke test directory and the smoke test's own temporary directory from the environment `run.sh` sets.
