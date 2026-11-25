# lib/common.sh

What every smoke test uses: it starts the app, talks to it through the remote control server and checks what the frontend shows. Each smoke test's `test.sh` sources it. It defines functions only, and stops the app when the smoke test ends, however it ends.

- `start_test_app`: starts the remote control server and the app with `--remote-control`, which connects to the server, and with `--theme` when `ZIGGY_THEME` is set. The app keeps its config and state files in the smoke test's own directory.
- `start_app_on_start_page`: starts the app as `start_test_app` does and waits until it shows its start page, the welcome page. Every smoke test starts the app with it, so a change to the start page is one edit in this file.
- `restart_test_app`: stops the app and starts it again, with a new remote control server, on the config and state files the last run left.
- `restart_app_on_start_page`: starts the app again as `restart_test_app` does and waits until it shows its start page.
- `control <json>`: sends one command to the app through the remote control server and prints the reply.
- `click <data-id>`: clicks the element with the data-id as a user's click reaches the page: a mousedown and a mouseup, then the click.
- `open_sidebar_page <page>`: clicks the page's link in the left sidebar (data-id `left-sidebar-<page>-link`) and waits until the page (data-id `<page>-page`) shows. Every smoke test opens a page from the sidebar with it, so a change to the links is one edit in this file.
- `answer_picker [path ...]`: gives the next folder picker the paths, so it shows no dialog and returns them as chosen. No paths is a cancelled picker.
- `open_repo_with_button <path>`: opens the repo at the path from the welcome page as a user does. It gives the folder picker the path with `answer_picker`, clicks the welcome page's Open repo button and waits until the repo explorer page shows its repo details pane. Every smoke test that needs an open repo opens it with this.
- `open_commit_pane`: clicks the repo details pane's Commits link and waits until the commit pane shows. Every smoke test that reads the commits opens the commit pane with it.
- `text_of <data-id>`: prints the text of the element with the data-id.
- `type_text <data-id> <text>`: sets the value of the text box with the data-id to the text and sends it an input event, so the page sees the text as typed.
- `value_of <data-id>`: prints the value of the text box with the data-id.
- `wait_for_text <data-id> <text> [seconds]`: waits until the element's text contains the text.
- `wait_for_commit_heading <short hash>`: waits until the commit details pane's heading contains the commit's short hash. It keeps waiting while the pane is drawn afresh and its heading is missing, which `wait_for_text` reports as a failure at once.
- `wait_for_element <data-id> <seconds>`: waits until the element with the data-id is on the page.
- `wait_for_missing_element <data-id> <seconds>`: waits until the element with the data-id has gone from the page.
- `wait_for_in_view <data-id> <seconds>`: waits until the element's left and right edges are inside the window, so the user can see it.
- `scroll_to_end <data-id>`: scrolls the element to the end of its content, as a user does with the mouse wheel or the scroll bar.
- `wait_for_in_view_of <data-id> <container-data-id> <seconds>`: waits until the element's top and bottom edges are inside the visible part of the scrolling element with the container data-id, so the user can see it in that list.
- `choose_menu_item <action>`: chooses a menu item through the native app, as a user would.
- `press_key <key>`: presses a key through the native app, as a user would. The key is written as a shortcut, such as `CmdOrCtrl+Shift+H`.
- `viewport_size`: prints the size of the area the frontend is drawn in.
- `run_task <task-type> <data-json>`: queues the backend task of the type with the data through the frontend, waits for it to end and prints its result as JSON, so a smoke test can send the backend invalid data.

The platform library `run.sh` chooses (`linux.sh`, `windows.sh` or `macos.sh`) starts and stops the app for it.

## How it is invoked

A smoke test sources it:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"
```

## Arguments

It takes no arguments. It reads the platform, the smoke test directory and the smoke test's own temporary directory from the environment `run.sh` sets.
