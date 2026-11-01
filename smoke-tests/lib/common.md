# lib/common.sh

What every smoke test uses: it starts the app, talks to its test control connection and checks what the frontend shows. Each smoke test's `test.sh` sources it. It defines functions only, and stops the app when the smoke test ends, however it ends.

- `start_test_app`: starts the test build of the app and opens the test control connection.
- `control <json>`: sends one command on the test control connection and prints the reply.
- `click <data-id>`: clicks the element with the data-id.
- `text_of <data-id>`: prints the text of the element with the data-id.
- `wait_for_text <data-id> <text> [seconds]`: waits until the element's text contains the text.
- `wait_for_element <data-id> <seconds>`: waits until the element with the data-id is on the page.
- `choose_menu_item <action>`: chooses a menu item through the native app, as a user would.
- `viewport_size`: prints the size of the area the frontend is drawn in.

The platform library `run.sh` chooses (`linux.sh`, `windows.sh` or `macos.sh`) starts and stops the app for it.

## How it is invoked

A smoke test sources it:

```bash
source "$(dirname "${BASH_SOURCE[0]}")/../lib/common.sh"
```

## Arguments

It takes no arguments. It reads the platform, the smoke test directory and the smoke test's own temporary directory from the environment `run.sh` sets.
