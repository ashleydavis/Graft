# Keyboard shortcuts overlay: manual test steps

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

1. Wait for Graft's window to open on the welcome page. Check the top bar shows "Ctrl+?: Show hotkeys" in small muted code font just before the theme menu's button.
2. Press `?`. Check the overlay shows over the page with the heading "Keyboard shortcuts", a search box with the focus and the shortcuts in one column, and the page behind it is dimmed. Check the first shortcut is "Open repo" with Ctrl+O (Command+O on macOS), and that the menu items with shortcuts, such as Quit and Reload, and the zoom actions Zoom In, Zoom Out and Actual Size are listed with the keys the menus show.
3. Click outside the overlay. Check it stays open.
4. Type `open`. Check only "Open repo" is listed. Clear the search and type `ctrl+q` (on macOS, `⌘Q`). Check only "Quit" is listed. Type `branch` in place of it and check the overlay says no shortcut matches "branch".
5. Clear the search and type `?`. Check the search box shows `?`, only "Keyboard Shortcuts" is listed and the overlay stays open.
6. Press Escape. Check the overlay closes. Press `?` again and check the search box is empty and every shortcut is listed, then press Escape.
7. Click "About" in the breadcrumb trail. Check the drop-down opens with the focus in its search box.
8. Press `?`. Check the search box shows `?`, the drop-down shows that no page matches "?" and the overlay stays closed.
9. Clear the search box, then press Ctrl+? (Ctrl+Shift+/ on most layouts, Ctrl and the `?` key on macOS too). Check the overlay shows and the drop-down's search box is still empty. Check the overlay lists "Keyboard Shortcuts" twice, straight after each other: once with `?` and once with Ctrl and `?`.
10. Press Ctrl+? again, with the focus in the overlay's search box. Check the overlay closes and its search box text is unchanged.
11. Press Escape to close the drop-down. Press Ctrl+? and check the overlay shows, then press Ctrl+? and check it closes.
12. Pick Dark from the theme menu in the top bar. Check "Ctrl+?: Show hotkeys" shows in dark colours. Press `?` and check the overlay and its shortcuts show in dark colours. Press Escape to close it.
13. Close the window.

## Expected result

`?` shows the keyboard shortcuts overlay, which lists every shortcut of Ziggy's action list in one column, starting with Open repo's Ctrl+O. Its search box filters them by label or keys and types `?` without closing the overlay. Escape closes it, a click outside leaves it open and `?` typed in another text box types the character and leaves the overlay closed. Ctrl+? shows and closes the overlay from anywhere, a text box included, leaving the box's text as it was, the overlay lists it and the top bar always shows "Ctrl+?: Show hotkeys".
