# run.sh

Runs the app's smoke tests for one platform: each directory here that holds a `test.sh` starts the real app and checks what it shows. Invoked by `run-desktop.sh`, which the `package.json` script `test:smoke` runs, never directly. Terms are defined in [Ziggy's glossary](https://github.com/ashleydavis/ziggy/blob/main/docs/glossary.md).

## Arguments

- `<platform>`: `linux`, `windows` or `macos`. Each has a library in `lib/<platform>.sh` that builds the app, starts it and stops it.
- `[scenario]`: optional directory name, to run one smoke test.

## Behaviour

Builds the app for the platform with the test hooks, then runs each `test.sh`, one after another, giving each its own temporary directory and a timeout. A smoke test drives the running app through the test control connection, with the helpers in `lib/common.sh`: `start_test_app`, `click`, `text_of` and `wait_for_text` find the page's elements by their `data-id`.

## Smoke tests

- `about-page`: the app opens on the About page, which shows its heading, what Graft is and its icon.

To add one, make a directory here with a `test.sh` that sources `../lib/common.sh`. A smoke test that runs only on the desktop platforms goes in `desktop-only/<name>/` and sources `../../lib/common.sh`.
