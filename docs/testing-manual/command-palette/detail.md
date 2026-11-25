# Command palette: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo Graft reads:

```bash
./scripts/test/create-test-repo.sh
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

1. Wait for Graft's window to open on the welcome page. Press Ctrl+Shift+P (Cmd+Shift+P on macOS). Check the palette shows near the top of the window with the page behind it dimmed, and its search box shows "Type a command" and has the focus.
2. Check the list starts with the heading "Welcome page" over Open repo and New window, then the heading "Other commands" over the rest, and that Command Palette itself is not listed. Check each command with a shortcut shows its keys as key caps, and Open repo is highlighted.
3. Press Down twice. Check the highlight moves to the second row and then into the "Other commands" group. Press Up and check it moves back.
4. Type `zoom`. Check only Zoom In, Zoom Out and Actual Size are listed, under "Other commands", and the "Welcome page" heading has gone. Type `branch` in place of it and check the palette shows `No command matches "branch".`
5. Press Escape. Check the palette closes and no command ran. Press Ctrl+Shift+P again and check the search box is empty.
6. Type `keyboard` and press Enter. Check the palette closes and the keyboard shortcuts overlay shows. Press Escape to close it.
7. Click "About" in the left sidebar, then click "About" in the breadcrumb trail. With the focus in the drop-down's search box, press Ctrl+Shift+P. Check the palette shows, its first heading is "About page" and the drop-down's search box is still empty. Press Escape twice.
8. Go to the welcome page and click Open repo. Choose the test repo. Click the Commits link, then click inside the commit pane. Press Ctrl+Shift+P and check the list starts with the heading "Commit pane" over Copy and Select All.
9. Click New window in the list. Check the palette closes and a new window of Graft opens. Close the new window.
10. Pick Dark from the theme menu in the top bar. Press Ctrl+Shift+P and check the palette, its headings, its highlighted row and its key caps show in dark colours. Press Escape.
11. Close the window.

## Expected result

Ctrl+Shift+P shows the command palette over every page, from a text box too. It lists the selected pane or page's commands first under its name and every other command under "Other commands". Typing filters both groups by label, Up and Down move the highlight, Enter and a click run a command and close the palette, and Escape closes it with the search cleared.
