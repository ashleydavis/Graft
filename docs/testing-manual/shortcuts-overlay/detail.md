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

1. Wait for Graft's window to open on the welcome page.
2. Press `?`. Check the overlay shows over the page with the heading "Keyboard shortcuts" and the text "Placeholder: Graft's keyboard shortcuts are listed here.", and the page behind it is dimmed.
3. Click outside the overlay. Check it stays open.
4. Press `?`. Check the overlay closes.
5. Press `?` again, then press Escape. Check the overlay closes.
6. Click "About" in the breadcrumb trail. Check the drop-down opens with the focus in its search box.
7. Press `?`. Check the search box shows `?`, the drop-down shows that no page matches "?" and the overlay stays closed.
8. Press Escape to close the drop-down, then pick Dark from the theme menu in the top bar. Press `?` and check the overlay shows in dark colours. Press `?` to close it.
9. Close the window.

## Expected result

`?` shows and closes the keyboard shortcuts overlay, Escape closes it, a click outside leaves it open and `?` typed in a text box types the character and leaves the overlay closed.
