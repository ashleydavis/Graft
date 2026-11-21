# New window: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create a test repo to open:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/test-repo
```

Then build and run Graft with the command for your platform:

```bash
bun run linux
```

```bash
bun run windows
```

```bash
bun run macos
```

## Steps

1. Wait for Graft's window to open on the welcome page.
2. Choose File, then "Open repo", then choose `/tmp/graft/test-repo`. Check the repo explorer page shows the test repo's commits.
3. Open the File menu. Check its first item is "New window", with its shortcut beside it: Ctrl+N on Linux and Windows, Command+N on macOS.
4. Choose "New window". Check a second Graft window opens on the welcome page, with a breadcrumb trail of "Welcome" alone and no "Repo explorer" link in the left sidebar.
5. Check the first window still shows the test repo's commits.
6. In the first window, press Ctrl+N (Command+N on macOS). Check a third Graft window opens on the welcome page.
7. Check each window is a process of its own: on Linux run `pgrep -a graft` and check it lists three processes.
8. Close the third window. Check the first and second windows are still open and respond to clicks. On Linux check `pgrep -a graft` lists two processes.
9. In the second window, press `?`. Check the keyboard shortcuts overlay lists "New window" with Ctrl+N (Command+N on macOS). Press Escape.
10. Close the other windows.

## Expected result

File, New window and Ctrl+N (Command+N on macOS) each open another window of Graft as a process of its own, on the welcome page with no repo open. Closing one window leaves the others running. The keyboard shortcuts overlay lists New window with its shortcut.
