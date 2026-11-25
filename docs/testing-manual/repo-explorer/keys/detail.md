# Keyboard shortcuts for the repo explorer: manual test steps

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

1. Wait for Graft's window to open on the welcome page, then choose File, then "Open repo", and choose `/tmp/graft/test-repo`. Click "About" in the left sidebar, then press Ctrl+1. Check the repo explorer page opens with the repo details pane alone, its border in the theme's blue primary colour and no item selected. Press Down and check "Commits" is selected. Press Enter and check the commit list opens to the right with the blue border and no commit selected.
2. Press Down. Check "Change the note" is shown as selected. Press Down again and check "Add the notes" is selected instead. Press Up and check "Change the note" is selected again. Check the page stays where it was.
3. Press Enter. Check the commit details pane opens to the right with "Change the note", its title in the commit list turns bold and the blue border moves to the commit details pane.
4. Press Left. Check the blue border moves to the commit list. Press Down. Check "Add the notes" is selected and the commit details pane shows "Add the notes" at once while the blue border stays on the commit list. Press Down twice more and check "Add the readme" is selected and shown, and the commit details pane still shows it after the second press at the last commit. Press Up twice and check the commit details pane shows "Change the note" again, and Up once more at the first commit leaves it showing. Press Enter. Check the blue border moves to the commit details pane and notes.txt, the commit's one file, is already selected. Press Down. Check the commit details pane shows "Add the notes" at once and keeps the blue border. Press Up and check it shows "Change the note" again. Press Left, click the empty space in the commit details pane and press Down. Check it shows "Add the notes". Press Left, then Right, then Up. Check it shows "Change the note" with the blue border on the commit details pane. Press Enter. Check the file pane opens with the diff of notes.txt and the blue border moves to it.
5. Press Left. Check the blue border moves to the commit details pane. Press Left again and check it moves to the commit list. Press Left again and check it moves to the repo details pane. Press Left once more and check it stays there. Press Right three times and check it moves to the commit list, the commit details pane and then the file pane. Press Right again and check it stays on the file pane.
6. Press Escape. Check the file pane closes and the commit details pane has the blue border. Press Escape again. Check the commit details pane closes, the commit list has the blue border and "Change the note" is still selected. Press Escape again and check the commit list closes, the repo details pane has the blue border and "Commits" is still selected. Press Escape once more and check the repo details pane stays open with the blue border. Press Enter to open the commit list again.
7. Click "Add the readme". Check it is selected, its details open and the commit list has the blue border. Click README.md in the commit details pane. Check it is selected, its diff opens and the commit details pane has the blue border.
8. Click the file pane's title bar, where it shows README.md. Check the blue border moves to the file pane. Click the empty space below the repo details pane's links and check the blue border moves to the repo details pane. Click the commit list's "Commits" title and check it moves to the commit list. Click the space between two panes and check the border stays where it is. Close the file pane with its X button and check the commit details pane has the blue border. Click "Changes" in the repo details pane and check the changes pane opens with the repo details pane still active, then click the changes pane's title and check the blue border moves to the changes pane. Click "Commits" in the repo details pane to open the commit list again.
9. Click "Help" in the left sidebar, then press Ctrl+1. Check the repo explorer page opens again on the repo details pane.
10. Click "About" in the left sidebar. Click the breadcrumb trail's "About" step to open its drop-down. In its search box type "a", press Left and type "b". Check the drop-down shows that no page matches "ba", so Left moved the cursor. Press Escape to close it.
11. Choose Dark from the theme menu in the top bar, press Ctrl+1, press Down and Enter to open the commit list and repeat steps 2 to 4. Check the selected item and the active pane's border are drawn in dark colours and are easy to see.
12. Choose Light from the theme menu. In a terminal, add a commit that changes two files to the test repo:

    ```bash
    printf '# The test repo\n' > /tmp/graft/test-repo/README.md
    printf 'The third note.\n' > /tmp/graft/test-repo/notes.txt
    git -C /tmp/graft/test-repo commit --all --message "Change two files"
    ```

    Back in Graft press Ctrl+1, press Escape until only the repo details pane is open, then press Enter to open the commit list. Press Down and Enter on "Change two files". README.md is selected as the file list opens, so press Enter and check the file pane shows its diff. Press Left so the commit details pane has the blue border. Press Down. Check notes.txt is selected and the file pane shows its diff at once, without Enter, while the commit details pane keeps the blue border. Press Up and check the file pane shows README.md's diff again. Press Down, then Enter. Check the blue border moves to the file pane. Press Up and check the file pane still shows notes.txt.
13. Press Left so the commit details pane has the blue border, then press Up twice. Check the "Commit details" row at the top of the commit details pane is selected and the "Commit details" pane opens in place of the file pane at once, with "Change two files" in bold, while the commit details pane keeps the blue border. Press Down and check README.md is selected and its diff opens in place of the "Commit details" pane. Press Up and check the "Commit details" pane opens again. Press Escape and check the "Commit details" pane closes and the commit details pane has the blue border with the "Commit details" row still selected. Press Enter and check the "Commit details" pane opens and has the blue border. Click inside the commit details pane, then inside the "Commit details" pane, and check the blue border follows each click.
14. Close the window.

## Expected result

On the repo explorer page Up and Down move the selection. While a commit's details are open, Up and Down in the commit list, and in the commit details pane while no file's diff is open, show the newly selected commit at once. While a file's diff or the "Commit details" pane is open, Up and Down in the commit details pane show the newly selected file's diff, or the "Commit details" pane for the "Commit details" row above the first file, at once. Enter on the "Commit details" row opens the "Commit details" pane and Escape closes it. Left and Right move the active pane. Enter opens the selected Commits link, commit or file in the pane to the right and makes it active. Escape closes the rightmost pane. Clicking anywhere in a pane makes it the active pane. The selected item shows MaterialUI's selection styling and the active pane has a border in the theme's primary colour, in the light and dark themes. Ctrl+1 opens the repo explorer page from any page. The arrow keys still move the cursor in a text box.
