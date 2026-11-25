# command-palette/test.sh

Smoke test of the command palette. It starts the real app with remote control on and presses keys through the native app as a user does. On the welcome page it presses Ctrl+Shift+P (Cmd+Shift+P on macOS, through Ziggy's `CmdOrCtrl+Shift+P`) and checks the palette shows with the welcome page's group first, under the heading "Welcome page", then "Other commands". It presses `o`, `p`, `e` and `n` and checks the search box holds `open`, which shows the search box has the focus, and that the list narrows to Open repo. It types `branch` and checks the palette shows `No command matches "branch".`. It presses Escape and checks the palette closes, then opens it again and checks the search box is empty. It opens the About page, opens the breadcrumb trail's drop-down, whose search box has the focus, presses Ctrl+Shift+P and checks the palette shows and the drop-down's search box is still empty. It then opens a test repo of its own with the welcome page's Open repo button, through `open_repo_with_button`, opens the commit pane, clicks it to make it the active pane, opens the palette and checks the list starts with the "Commit pane" group. Last, it types `keyboard`, presses Enter to run Keyboard Shortcuts and checks the palette closes and the keyboard shortcuts overlay shows, then closes the overlay with Escape.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh command-palette
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
