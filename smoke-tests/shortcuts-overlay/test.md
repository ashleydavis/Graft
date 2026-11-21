# shortcuts-overlay/test.sh

Smoke test of the keyboard shortcuts overlay. It starts the real app with remote control on, opens a test repo of its own with the welcome page's Open repo button, through `open_repo_with_button`, then opens the About page with the left sidebar's About link and presses keys through the native app as a user does. It presses `?` and checks the overlay shows its title and the shortcuts from Ziggy's action list, starting with Open repo and its shortcut as the platform shows it (`⌘O` on macOS and `Ctrl+O` on Linux and Windows). The overlay's search box has the focus, so it presses `?` and checks the search box holds `?` and the overlay stays open. It checks the list then shows the Keyboard Shortcuts action, whose keys are `?`, and leaves out Open repo. It presses Escape and checks the overlay has closed. It opens the overlay again, types `quit` and checks the list shows Quit and leaves out Open repo and Keyboard Shortcuts, then closes it with Escape. It then opens the breadcrumb trail's drop-down, whose search box has the focus, presses `?` and checks the search box typed it (the drop-down finds no page matching "?") and the overlay stayed closed. It then checks Ctrl+?. The native app's `press_key` takes only Ziggy's shortcut syntax, which refuses a modifier on `?`, so the test presses Ctrl+? with the frontend's `key-down` test command, which dispatches a keydown of `?` with Control held on the element with the data-id and reports whether Graft kept the key from doing anything else. With the drop-down open again and the focus in its search box, it presses Ctrl+? there and checks Graft handled the key, the overlay shows and the drop-down's search box is still empty. It checks the overlay lists Ctrl+? under the Keyboard Shortcuts label. It presses Ctrl+? in the overlay's search box and checks the overlay closes. It closes the drop-down, presses Ctrl+? on the About page and checks the overlay shows with an empty search box, then closes it with Escape. Last, it checks the top bar shows "Ctrl+?: Show hotkeys".

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh shortcuts-overlay
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
