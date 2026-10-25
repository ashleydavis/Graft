# run.sh

Runs the app's smoke tests for one platform: each directory here that holds a `test.sh` starts the real app and checks what it shows. Invoked by `run-desktop.sh`, which the `package.json` script `test:smoke` runs, never directly. Terms are defined in [Ziggy's glossary](https://github.com/ashleydavis/ziggy/blob/main/docs/glossary.md).

## Arguments

- `<platform>`: `linux`, `windows` or `macos`. Each has a library in `lib/<platform>.sh` that builds the app, starts it and stops it.
- `[scenario]`: optional directory name, to run one smoke test.

## Behaviour

Builds the app for the platform with the test hooks, then runs each `test.sh`, one after another, giving each its own temporary directory and a timeout. A smoke test drives the running app through the test control connection, with the helpers in `lib/common.sh`: `start_test_app`, `click`, `text_of` and `wait_for_text` find the page's elements by their `data-id`.

## Smoke tests

- `hello-world-app`: hello world example. Pressing each button logs the backend's message response to the hello-world message, and the hello-world task's output and how it ended. Change it into your own smoke test, or delete it.
- `desktop-only/hello-menu`: hello world example of the menu. Choosing Say Hello From Zig and Say Hello From the UI each writes its line to the log. Change it into your own smoke test, or delete it.

To add one, make a directory here with a `test.sh` that sources `../lib/common.sh`.
