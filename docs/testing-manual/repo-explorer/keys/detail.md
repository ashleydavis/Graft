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

On macOS press Cmd+1 wherever these steps say Ctrl+1, Cmd+C wherever they say Ctrl+C and Cmd+V wherever they say Ctrl+V.

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
14. Copy key. Press Ctrl+1, press Escape until only the repo details pane is open, then press Enter to open the commit list. Press Down to select "Change two files" and press Ctrl+C. Press `?` to show the keyboard shortcuts overlay, press Ctrl+V in its search box and check it holds the commit's full hash, the same as `git -C /tmp/graft/test-repo rev-parse HEAD` prints. Press Escape to close the overlay.
15. Press Enter to open the commit's details, with README.md selected, and press Ctrl+C. Paste into the overlay's search box as in step 13 and check it holds README.md.
16. In a terminal, change a file and stage a new file in a directory:

    ```bash
    printf 'A changed note.\n' > /tmp/graft/test-repo/notes.txt
    mkdir -p /tmp/graft/test-repo/docs
    printf 'A new file.\n' > /tmp/graft/test-repo/docs/new.txt
    git -C /tmp/graft/test-repo add docs/new.txt
    ```

    Back in Graft press Escape until only the repo details pane is open, press Down to select "Changes" and Enter to open the changes pane. With no row selected press Ctrl+C, paste into the overlay's search box and check it still holds README.md. Press Down to select notes.txt in the Unstaged list, press Ctrl+C and check the paste holds notes.txt. Press Down to select docs/new.txt in the Staged list, press Ctrl+C and check the paste holds docs/new.txt.
17. Click the commit message box, type "Fix the copy key", select the text with Ctrl+A and press Ctrl+C. Delete the text, press Ctrl+V and check the box holds "Fix the copy key" again. Then click the repo details pane's Commits link, click a commit to open its details, drag the mouse over part of the commit's description, press Ctrl+C, paste into the overlay's search box as in step 13 and check it holds that text.
18. Press Ctrl+1, press Escape until only the repo details pane is open, then press Enter to open the commit list. Press Down and Enter on "Change two files", then press Enter on README.md to open its diff. Press Home and End with the file pane active and check the selection and the diff stay as they are. Press Left so the commit details pane has the blue border. Press End and check notes.txt is selected and the file pane shows its diff at once. Press Home and check the "Commit details" row is selected and the "Commit details" pane opens in place of the file pane at once. Press Escape to close the "Commit details" pane, then press End. Check the commit details pane shows "Add the readme", the last commit, and keeps the blue border. Press Home and check it shows "Change two files". Press Left so the commit list has the blue border. Press End. Check "Add the readme" is selected and in view and the commit details pane shows it. Press Home and check "Change two files" is selected and shown. Press Left so the repo details pane has the blue border. Press End and check "Changes" is selected, then Home and check "Commits" is selected.
19. Press Down to select "Changes" and Enter to open the changes pane. In a terminal, change one file and stage another:

    ```bash
    printf 'A fourth note.\n' >> /tmp/graft/test-repo/notes.txt
    printf 'The readme.\n' >> /tmp/graft/test-repo/README.md
    git -C /tmp/graft/test-repo add README.md
    ```

    Back in Graft press Escape and Enter to read the changes again. Press End and check the last row of the Staged list is selected. Press Home and check the first row of the Unstaged list is selected. Click in the commit message box, type "abc", press Home and type "x". Check the box shows "xabc" and the selected row stays the same. Press End and type "y". Check the box shows "xabcy". Click the changes pane's title, hold Ctrl and press End, and check the same row stays selected.
20. To check End reads the next page, in a terminal add more commits than fit in one page:

    ```bash
    for index in $(seq 1 60); do git -C /tmp/graft/test-repo commit --allow-empty --message "Empty commit $index"; done
    ```

    Back in Graft press Escape until only the repo details pane is open, press Home and Enter to open the commit list, then press End. Check the last commit of the first page is selected and in view and a loading row shows briefly under it while the next page is read. Press End again and check the selection moves on to the last commit of the next page.
21. In a terminal, add a commit that adds sixty files and sixty empty commits under it, so the commit list and the commit's changed files are longer than their panes:

    ```bash
    for number in $(seq 1 60); do git -C /tmp/graft/test-repo commit --allow-empty --message "Empty commit $number"; done
    for number in $(seq 1 60); do printf 'File %s.\n' "$number" > "/tmp/graft/test-repo/many-$number.txt"; done
    git -C /tmp/graft/test-repo add .
    git -C /tmp/graft/test-repo commit --message "Add many files"
    ```

    Back in Graft press Ctrl+1, press Escape until only the repo details pane is open, then press Enter to open the commit list. Press Page Down and check "Add many files", the first commit, is selected. Count the commit rows that fit in the commit list, then press Page Down again. Check the selection moved down by that many rows, the selected row is in view at the bottom of the list and the page did not scroll. Press Page Up and check "Add many files" is selected again and in view. Press Page Up again and check it stays selected.
22. Press Enter to open "Add many files", then Left. Press Page Down and check the commit details pane shows the commit a page down at once while the commit list keeps the blue border. Press Page Down until the selection is past the last commit of the first page of commits and check the list goes on into the next page of commits, with no pause at the end of the first. Press Ctrl+= twice to zoom in, press Page Up and check it moves by fewer rows than before. Press Ctrl+0. Make the window shorter, press Page Up and check it moves by fewer rows again. Make the window its old size and press Page Up until "Add many files" is open.
23. Press Right. Check many-1.txt is selected. Press Enter, then Left. Press Page Down. Check the file a page down is selected and in view and the file pane shows its diff at once, while the commit details pane keeps the blue border. Press Page Down until the last file is selected, then once more. Check it stays on the last file. Press Page Up and check it moves back by a page. Press Right so the file pane has the blue border, press Page Down and Page Up and check the file pane still shows the same file.
24. Press Escape three times so the repo details pane is active with "Commits" selected. Press Page Down and check "Changes" is selected. Press Page Up and check "Commits" is selected. Press Page Down and Enter to open the changes pane.
25. In a terminal, make more changed files than the Unstaged list shows at once, then stage some of them:

    ```bash
    for number in $(seq 1 40); do printf 'Changed %s.\n' "$number" > "/tmp/graft/test-repo/many-$number.txt"; done
    git -C /tmp/graft/test-repo add many-1.txt many-2.txt many-3.txt
    ```

    Back in Graft press Escape and Enter to read the changes again with the changes pane active. Press Page Down and check the first unstaged file is selected. Press Page Down and check the selection moves down by the rows that fit in the Unstaged list and its row is in view. Press Page Down until the selection moves into the Staged list, then on to its last row. Check each selected row is in view. Press Page Up and check it moves back up. Click the commit message box, press Page Down and Page Up and check the selection stays where it was. Hold Ctrl and press Page Down and check the selection stays where it was.
26. Press Ctrl+1, press Escape until only the repo details pane is open, then press Enter to open the commit list, press Down and Enter on "Change two files" and press Enter on README.md so the file pane has the blue border. Press M. Check the file pane fills the page, the other panes are gone and the file pane keeps the blue border. Press Left and Right and check nothing changes. Press M again and check every pane is back. Press Left so the commit details pane is active, press Up so README.md is selected, press M and check the commit details pane fills the page. Press Down and check notes.txt is selected while the commit details pane stays maximised, then press M and check the panes are back with the file pane showing notes.txt's diff. Press Shift+M, Ctrl+M and Alt+M (Cmd+M on macOS too) and check none of them maximises a pane. Press Left so the commit details pane is active, press M and then Escape. Check the commit details pane and the file pane close and the commit list and the repo details pane are back, with the commit list's blue border. Press Escape until only the repo details pane is open, click "Changes" to open the changes pane, click the commit message box and type "m". Check the box shows "m" and no pane is maximised.
27. Press Ctrl+1, press Escape until only the repo details pane is open, press Down and Enter to open the commit list, then Down and Enter to open "Change the note". Press Left so the commit list has the blue border. Press C. Check the commit list becomes a narrow strip with "Commits" down it and the blue border. Press Down and check the commit details pane shows "Add the notes" while the strip keeps the blue border. Press Right and check the blue border moves to the commit details pane, then Left and check it moves back to the strip. Press Left again and check it moves to the repo details pane. Press Right, then C, and check the commit list comes back with the blue border. Press Shift+C and check the columns stay as they are. Click "Changes" in the repo details pane, click the Commit message box, type "c" and check the letter goes in the box and no column collapses. Press Escape until the commit list is open, press M to maximise it, press C and check nothing collapses, then press M again.
28. Press Escape until only the repo details pane is open. Click the repo details pane's empty space, then press Down until "main" under "Branches" is selected, after "Commits" and "Changes". Press Enter. Check a pane headed "main" opens to the right with the blue border. Press Down and check "Change the note" is selected. Press Enter and check its details open. Press Escape twice. Check the pane headed "main" closes, the repo details pane has the blue border and "main" is still selected.
29. Press Escape until only the repo details pane is open. Press Down until "v1.0" under Tags is selected, after "Commits", "Changes" and any branches, then Enter. Check the tag pane opens for v1.0 with the blue border. Press Up and Down and check the tag pane still shows v1.0. Press Left and check the blue border moves to the repo details pane, then Right and check it moves back to the tag pane. Press Escape and check the tag pane closes, the repo details pane has the blue border and "v1.0" is still selected.
30. Close the window.

## Expected result

On the repo explorer page Up and Down move the selection. Page Up and Page Down move it by the rows that fit in the list, stop at the first and last item, keep the selected row in view, read the next page of commits near the end and follow the window's size and zoom. Home and End move it to the first and last item, and in the commit list End reads the next page. While a commit's details are open, Up and Down in the commit list, and in the commit details pane while no file's diff is open, show the newly selected commit at once. While a file's diff or the "Commit details" pane is open, Up and Down in the commit details pane show the newly selected file's diff, or the "Commit details" pane for the "Commit details" row above the first file, at once. Enter on the "Commit details" row opens the "Commit details" pane and Escape closes it. Left and Right move the active pane. Enter opens the selected Commits link, commit or file in the pane to the right and makes it active. Escape closes the rightmost pane. Clicking anywhere in a pane makes it the active pane. The selected item shows MaterialUI's selection styling and the active pane has a border in the theme's primary colour, in the light and dark themes. Ctrl+1 opens the repo explorer page from any page. Ctrl+C copies the selected commit's full hash or the selected file's path from the root of the repo, leaves the clipboard as it was with no item selected and still copies the selected text in a text box. The arrow keys, Page Up, Page Down, Home and End still move the cursor in a text box. M maximises the active pane and restores the panes, the maximised pane keeps the blue border and its keys, Escape closes it and brings the other panes back, and M is left to a text box and to Shift, Ctrl, Alt and Cmd. C collapses the active pane into a strip and restores it, Left and Right move through the strip, which shows the active border, C is left to a text box and is ignored with Shift, and C does nothing while a pane is maximised. Enter opens the selected branch in the pane to the right too, and Escape closes it, keeping the branch selected. Enter opens the selected tag in the tag pane too, Left and Right move between the repo details pane and the tag pane, and Escape closes the tag pane, keeping the tag selected.
