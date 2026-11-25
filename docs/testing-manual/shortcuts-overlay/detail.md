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

1. Wait for Graft's window to open on the welcome page. Check the top bar shows "Ctrl+/: Show hotkeys" in small muted code font, then the keyboard shortcuts button (a keyboard icon), then the theme menu's button.
2. Press `?`. Check the overlay shows over the page with the heading "Keyboard shortcuts", a search box with the focus and the shortcuts in one column, and the page behind it is dimmed. Check the first shortcut is "Open repo" with Ctrl+O (Command+O on macOS), and that the menu items with shortcuts, such as Quit and Reload, and the zoom actions Zoom In, Zoom Out and Actual Size are listed with the keys the menus show.
3. Check the title row shows a close button (an X icon) at its right. Hover over it and check its tooltip shows "Close". Click it and check the overlay closes. Press `?` again, click outside the overlay on the dimmed page and check the overlay closes. Press `?` again to show it.
4. Type `open`. Check only "Open repo" is listed. Clear the search and type `ctrl+q` (on macOS, `⌘Q`). Check only "Quit" is listed. Type `branch` in place of it and check the overlay says no shortcut matches "branch".
5. Clear the search and type `?`. Check the search box shows `?`, only "Keyboard Shortcuts" is listed and the overlay stays open.
6. Press Escape. Check the overlay closes. Press `?` again and check the search box is empty and every shortcut is listed, then press Escape.
7. Click "About" in the breadcrumb trail. Check the drop-down opens with the focus in its search box.
8. Press `?`. Check the search box shows `?`, the drop-down shows that no page matches "?" and the overlay stays closed.
9. Clear the search box, then press Ctrl+/ (Ctrl and the `/` key, with no Shift, Ctrl on macOS too). Check the overlay shows and the drop-down's search box is still empty. Check the overlay lists "Keyboard Shortcuts" twice, straight after each other: once with `?` and once with Ctrl and `/`.
10. Press Ctrl+/ again, with the focus in the overlay's search box. Check the overlay closes and its search box text is unchanged.
11. Press Escape to close the drop-down. Press Ctrl+/ and check the overlay shows, then press Ctrl+/ and check it closes. Press Ctrl+Shift+/ and check the overlay stays closed.
12. Hold Ctrl+/ down for two seconds, so the key repeats, then let go. Check the overlay shows and stays open. Hold the keys down for two seconds again and check the overlay closes and stays closed.
13. Hover over the keyboard shortcuts button in the top bar. Check its tooltip shows "Show keyboard shortcuts" followed by "Ctrl+/" in the code font. Click the button. Check the overlay shows with the focus in an empty search box and every shortcut listed. Press Escape to close it.
14. Pick Dark from the theme menu in the top bar. Check "Ctrl+/: Show hotkeys" and the keyboard shortcuts button show in dark colours. Hover over the button and check its tooltip shows in dark colours. Click the button and check the overlay, its shortcuts and its close button show in dark colours. Press Escape to close it.
15. Close the window.

## Expected result

`?` shows the keyboard shortcuts overlay, which lists every shortcut of Ziggy's action list in one column, starting with Open repo's Ctrl+O. Its search box filters them by label or keys and types `?` without closing the overlay. Escape, a click outside it and its close button close it, and `?` typed in another text box types the character and leaves the overlay closed. Ctrl+/ shows and closes the overlay from anywhere, a text box included, and leaves the box's text as it was. It shows or closes the overlay once each time Control is held, so holding the keys leaves the overlay as the first press left it. The overlay lists Ctrl+/. The top bar always shows "Ctrl+/: Show hotkeys", and its keyboard shortcuts button, whose tooltip names Ctrl+/, shows the overlay.
