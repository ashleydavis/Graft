# Keyboard shortcuts for the commit explorer: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

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

On macOS press Cmd+1 wherever these steps say Ctrl+1.

## Steps

1. Wait for Graft's window to open on the About page, then choose File, then "Open repo", and choose `/tmp/graft/test-repo`. Click "About" in the left sidebar, then press Ctrl+1. Check the commits page opens with the commit list's border in the theme's blue primary colour and no commit selected.
2. Press Down. Check "Change the note" is shown as selected. Press Down again and check "Add the notes" is selected instead. Press Up and check "Change the note" is selected again. Check the page stays where it was.
3. Press Enter. Check the commit details pane opens to the right with "Change the note", its title in the commit list turns bold and the blue border moves to the commit details pane.
4. Press Down. Check notes.txt is selected. Press Enter. Check the file pane opens with the diff of notes.txt and the blue border moves to it.
5. Press Left. Check the blue border moves to the commit details pane. Press Left again and check it moves to the commit list. Press Left once more and check it stays there. Press Right twice and check it moves to the commit details pane and then the file pane. Press Right again and check it stays on the file pane.
6. Press Escape. Check the file pane closes and the commit details pane has the blue border. Press Escape again. Check the commit details pane closes, the commit list has the blue border and "Change the note" is still selected. Press Escape once more and check the commit list stays open with the blue border.
7. Click "Add the readme". Check it is selected, its details open and the commit list has the blue border. Click README.md in the commit details pane. Check it is selected, its diff opens and the commit details pane has the blue border.
8. Click "Help" in the left sidebar, then press Ctrl+1. Check the commits page opens again.
9. Click "About" in the left sidebar. Click the breadcrumb trail's "About" step to open its drop-down. In its search box type "a", press Left and type "b". Check the drop-down shows that no page matches "ba", so Left moved the cursor. Press Escape to close it.
10. Choose Dark from the theme menu in the top bar, press Ctrl+1 and repeat steps 2 to 4. Check the selected item and the active pane's border are drawn in dark colours and are easy to see.
11. Close the window.

## Expected result

On the commits page Up and Down move the selection, Left and Right move the active pane, Enter opens the selected commit or file in the pane to the right and makes it active. Escape closes the rightmost pane. The selected item shows MaterialUI's selection styling and the active pane has a border in the theme's primary colour, in the light and dark themes. Ctrl+1 opens the commits page from any page. The arrow keys still move the cursor in a text box.
