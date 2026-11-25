# Columns in the repo explorer: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

```bash
./scripts/test/create-test-repo.sh
```

Give the first commit, "Add the readme", a branch and several tags, more badges than its row has room for:

```bash
git -C /tmp/graft/test-repo branch first-branch "$(git -C /tmp/graft/test-repo rev-list --max-parents=0 HEAD)"
```

```bash
for tag in v0.1.0 v0.2.0 v0.3.0 v0.4.0 v0.5.0; do git -C /tmp/graft/test-repo tag "$tag" first-branch; done
```

Create a test repo at `/tmp/graft/merge-repo` with a merge and more commits than one page of the commit list. The side branch's commits are dated between the main line's, so git log lists one from each side in turn:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/merge-repo
```

```bash
git -C /tmp/graft/merge-repo switch --quiet --create side
```

```bash
for number in $(seq 1 30); do GIT_COMMITTER_DATE="@$((1767484800 + number * 120 - 60)) +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Side $number"; done
```

```bash
git -C /tmp/graft/merge-repo switch --quiet main
```

```bash
for number in $(seq 1 30); do GIT_COMMITTER_DATE="@$((1767484800 + number * 120)) +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Main $number"; done
```

```bash
GIT_COMMITTER_DATE="@1767488460 +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com merge --quiet --no-ff --no-edit --message "Merge side" side
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

1. Wait for Graft's window to open on the welcome page, then choose File, then "Open repo". Choose `/tmp/graft/test-repo`.
2. Check the repo explorer page shows the repo details pane as its only column. Click its "Commits" link and check the commit list opens as the second column, in a rounded card headed "Commits" with an X close button at its right. Check a header row above the rows names the columns "Message", "Author", "Date" and "Hash" in small muted text with a line under it, each name in line with its column in the rows and a blank space over the badges. Check each row shows the commit's title, author "Ada Author", date and the first seven characters of its hash. Check "Change the note" has a filled "main" badge with a branch icon and "Add the notes" has a "v1.0" badge with a tag icon, and that the badges sit in a column of their own so the author, date and hash line up from row to row.
3. Check the row of "Add the readme" shows its title first, in full, then its badge column with the badges that fit and a "…" button, with its author, date and hash in line with the rows above. Hover "…" and check its tooltip shows how many more badges there are. Click "…" and check a drop-down opens under it listing first-branch and the tags v0.1.0 to v0.5.0, and that the commit is not selected or opened. Press Escape and check the drop-down closes. Click "…" again, click an empty part of the commit list and check the drop-down closes.
4. Click the commit "Change the note". Check its row is highlighted and its title is bold.
5. Check a third column opens to the right of the commit list, headed "Commit" and the short hash, with an X close button. Check its top row is "Commit details" with a message icon, that the column leaves out the commit's message and facts and that hovering the row colours it. Click the row and check it is highlighted with a bar on its left edge and a fourth column headed "Commit details" with an X close button opens to its right. Check it shows the title "Change the note" in bold, the description "The note now says what the second note is." and the facts "Authored" with "Ada Author <ada@example.com>" and the date and time, "Committed" with "Cy Committer <cy@example.com>" and the date and time, "Hash" with the commit's full hash and "Parent" with the first seven characters of the parent's hash. Click the X of the "Commit details" column and check it closes and the third column stays.
6. Check the "Files changed (1)" heading and the row for notes.txt with its file icon and the path "notes.txt". Hover the row and check the tooltip shows an orange "M", "Modified", "+1 −1" and the path.
7. Click the "Commit details" row, then notes.txt. Check the row of notes.txt is highlighted and the "Commit details" column closes.
8. Check a fourth column opens to the right of the third, headed "notes.txt" with an X close button, with a diff that removes "The first note." on a red row marked "−" and adds "The second note." on a green row marked "+", each with its line numbers. When the fourth column opens beyond the right edge of the window, check the page scrolls sideways until the whole column is in view.
9. Check the repo details pane and the commit list are still shown in full in the first two columns.
10. Click "Add the readme" in the commit list. Check the fourth column closes and the third column shows README.md. Click the "Commit details" row and check the fourth column shows "Add the readme" and "Parents" with "None, this is the first commit". Hover README.md and check the tooltip shows a green "A", "Added" and "+1 −0".
11. Click README.md, then click the X of the fourth column. Check the fourth column closes and the third stays.
12. Click the X of the third column. Check it closes and only the repo details pane and the commit list are left. Click "Change the note", then notes.txt. Hover the X of the commit list and check its tooltip says "Close". Click it and check the commit list, the third column and the fourth column all close, the repo details pane is left alone with its border in the active colour and "Commits" still selected, and the breadcrumb trail in the top bar has no step after "Repo explorer". Click "Commits" to open the commit list again.
13. Click "Change the note", then notes.txt. Check the third and fourth columns each fade in as they open. Click the X of the fourth column and check it fades out as it narrows to nothing, then goes. Click the X of the third column and check it does the same, and that while it narrows a click on "Add the notes" in the commit list selects it and opens its details.
14. Press Escape twice quickly. Check the third column, then the commit list, fade out and narrow away while the keys still act. Press Enter and check the commit list opens again.
15. Choose Dark from the theme menu in the top bar. Check the header row above the commit list is drawn in dark colours and its names are readable. Repeat steps 3 to 8. Check every column is drawn in dark colours and its text is readable.
16. Choose File, then "Open repo", and choose `/tmp/graft/merge-repo`. Click the "Commits" link and scroll the commit list to its end. Check the header row naming the columns stays in view above the rows as the list scrolls. Check every "Side" and "Main" commit from 30 down to 1 is listed once, the two taking turns, the list ends with "Add the readme" and no loading row is left under it. Open the right sidebar and check the most recent command is `git log --no-show-signature --max-count=50 --skip=50 --branches --remotes HEAD --`. Close the sidebar.
17. Close the window. Turn on reduced motion in the system's settings (Reduce Animation in GNOME's Accessibility settings, Animation effects off in Windows' Accessibility settings, Reduce motion in macOS's Accessibility Display settings), run Graft again and open the test repo. Open the commit list, a commit and a file, then close them with their X buttons. Check each column appears and goes at once. Turn reduced motion off again and close the window.
18. Add an empty file to the test repo named after the full hash of "Change the note":

    ```bash
    touch "/tmp/graft/test-repo/$(git -C /tmp/graft/test-repo rev-parse HEAD)"
    ```

    Run Graft again, open the test repo and click its "Commits" link. Click "Change the note" and check the third column shows notes.txt under "Files changed (1)" and its "Commit details" row opens its title, description and facts as in step 5, with no error. Click notes.txt and check the fourth column shows its diff as in step 8. Close the window and delete the file.
19. Add a commit with two files whose names git could read as a pattern:

    ```bash
    printf 'The bracket file.\n' > '/tmp/graft/test-repo/foo[1].txt'
    ```

    ```bash
    printf 'The plain file.\n' > /tmp/graft/test-repo/foo1.txt
    ```

    ```bash
    git -C /tmp/graft/test-repo add --all
    ```

    ```bash
    git -C /tmp/graft/test-repo commit --message "Add the two files"
    ```

    Run Graft again, open `/tmp/graft/test-repo` and the commit list, click "Add the two files" and check "Files changed (2)" lists foo1.txt and foo[1].txt. Click foo[1].txt and check the fourth column shows only the green row "The bracket file.", with no row "The plain file.".
20. From the repo root, run `bash smoke-tests/run-desktop.sh refused-task-data`, which sends the commits, commit details and file diff tasks an empty repo path, data outside what the window sends. Check it ends with `PASSED: refused-task-data`, so each task failed with "The repo path is empty. Give the path of the repo to read." and Graft kept running.
21. Close the window. Add an empty file to the test repo named after the short hash of "Change the note":

    ```bash
    touch "/tmp/graft/test-repo/$(git -C /tmp/graft/test-repo rev-parse --short HEAD~1)"
    ```

    Run Graft again, open the test repo and click its "Commits" link. Click "Change the note", click the "Commit details" row and check the fourth column shows its title, description and facts as in step 5, with no error. Close the window and delete the file.

## Expected result

A header row names the commit list's columns, in line with them, and stays in view as the list scrolls. Each commit row shows its title, refs, author, date and short hash, the title never hidden by badges, and a commit with more badges than fit shows a "…" whose drop-down lists them all. Clicking a commit opens its "Commit details" row and changed files with their line counts to the right of the commit list, the row opens its full message, author, committer, dates and parents in a column of their own, clicking a changed file opens its diff to the right of that, the commit list reads each page after the first from the first commit listed so a merge's commits from both sides are each listed once, the page scrolls each new column into view and each new column closes with its X button, the commit list's X closing the columns to its right with it, in the light and dark themes. Each column fades in as it opens and fades and narrows away as it closes while the keys and clicks keep working, and opens and closes at once under reduced motion. A file whose name has `[` in it shows its own diff alone. The backend refuses an empty repo path with an error and keeps running. A commit's details show even when a file is named after the commit's short hash. A commit's details, changed files and diffs show even when a file is named after the commit's full hash.
