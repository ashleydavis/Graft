# run.sh

Runs the app's smoke tests for one platform: each directory here that holds a `test.sh` starts the real app and checks what it shows. Invoked by `run-desktop.sh`, which the `package.json` script `test:smoke` runs, never directly. Terms are defined in [Ziggy's glossary](https://github.com/ashleydavis/ziggy/blob/main/docs/glossary.md).

## Arguments

- `<platform>`: `linux`, `windows` or `macos`. Each has a library in `lib/<platform>.sh` that puts the app in place, starts it and stops it.
- `[scenario]`: optional directory name, to run one smoke test.

## Behaviour

Puts the built app in place once for the platform, then runs each `test.sh`, one after another, giving each its own temporary directory and a timeout. `ZIGGY_SMOKE_BUILD` names a directory the platform's build script already built the app into, as CI's `app-build` job does: `bin/graft` (Linux, `--prefix`), `graft/graft.exe` (Windows, `--prefix`), `xcode/Build/Products/Release/Graft.app` (macOS, `--build-dir <dir>/xcode`), `xcode/Build/Products/Release-iphonesimulator/Graft.app` (iOS simulator) or `graft.apk` (Android, `--output-dir`). When it is not set, the build script builds into the run directory. A connected iPhone or iPad always gets a device build of its own.

`start_test_app` starts the [remote control server](https://github.com/ashleydavis/ziggy/blob/main/tools/remote-control-server/README.md) on ports the system chooses, reads the ports from the line it prints when it listens and starts the app with `--remote-control` and the server's app port (the `ziggy.remoteControl` extra on Android). The app connects out to the server. The smoke test talks to the server's script port. Every smoke test runs in the light theme, passed as `--theme`, unless `ZIGGY_THEME` says otherwise, so none depends on the system's theme. Each keeps the app's config and state files in its own directory, through `GRAFT_CONFIG_DIR` and `GRAFT_STATE_DIR`, so none reads or writes the developer's own. On Android, `adb reverse` carries the app port from the device to the host. A smoke test drives the running app with the helpers in `lib/common.sh`: it starts the app with `start_app_on_start_page`, opens pages with `open_sidebar_page`, and `click`, `text_of` and `wait_for_text` find the page's elements by their `data-id`.

## Smoke tests

- `welcome-page`: the app opens on the welcome page, whose Open repo button opens a repo on the repo explorer page.
- `about-page`: the About page, opened from the left sidebar, shows its heading, what Graft is and its icon.
- `help-page`: the Help page, opened from the left sidebar with a repo open, shows its heading, Graft's pages and the ways to move between them.
- `new-window`: the File menu's New window item and Ctrl+N each open another window of Graft as a process of its own, on the welcome page. Closing one leaves the others running.
- `theme-menu`: the top bar's theme menu changes the theme to Dark, System and Light, showing each theme's icon and saving each choice in the config file.

To add one, make a directory here with a `test.sh` that sources `../lib/common.sh`. A smoke test that runs only on the desktop platforms goes in `desktop-only/<name>/` and sources `../../lib/common.sh`.
