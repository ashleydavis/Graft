# shortcuts-overlay-panes/test.sh

Smoke test of the keyboard shortcuts overlay's groups. It starts the real app with remote control on and presses keys through the native app as a user does. On the welcome page, which has no keys of its own, it presses `?` and checks the overlay lists one group headed General, starting with Open repo and its shortcut as the platform shows it (`⌘O` on macOS and `Ctrl+O` on Linux and Windows), then closes it with Escape. It opens a test repo of its own with the welcome page's Open repo button, through `open_repo_with_button`, and presses Down and Enter, which open the commit pane and make it active. It presses `?` and checks the overlay starts with the group headed "Commit pane", which lists Up, Down and Enter, followed by the General group. It types "enter" in the search box and checks the General group is hidden and the commit pane's group lists Enter alone, then closes the overlay with Escape. It presses Down, Enter and Enter, which open the newest commit and its first file and make the file pane active. It presses Ctrl+/ on the repo explorer page with the frontend's `key-down` test command, because the native app's `press_key` takes only Ziggy's shortcut syntax, which refuses `/` as a key, and checks the overlay starts with the group headed "File pane", which lists Left and Escape. It closes the overlay with Escape.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh shortcuts-overlay-panes
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
