# Repo details pane: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

```bash
./scripts/test/create-test-repo.sh
```

Then give the test repo a second branch, feature/x, with a commit of its own that main does not have, leaving main checked out:

```bash
git -C /tmp/graft/test-repo branch feature/x
git -C /tmp/graft/test-repo switch --quiet feature/x
git -C /tmp/graft/test-repo commit --quiet --allow-empty --message "The feature's own commit"
git -C /tmp/graft/test-repo switch --quiet main
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

1. Wait for Graft's window to open on the welcome page, then click "Open repo" and choose `/tmp/graft/test-repo`.
2. Check the repo explorer page opens with one column, a rounded card headed "Repo" and "test-repo" in muted text, with its border in the theme's blue primary colour.
3. Check the card shows "Name" with "test-repo" and "Path" with `/tmp/graft/test-repo` in the code font, then a "Commits" row with the commit icon and a "Changes" row with the pen-to-square icon.
4. Hover the "Commits" row and check it shows the hover colour.
5. Click "Commits". Check the row is selected with a bar on its left edge, the commit pane opens to the right of the repo details pane listing the test repo's commits and the repo details pane keeps the blue border.
6. Click "Change the note" in the commit pane, then notes.txt. Check the commit details pane and the file pane open to the right of the commit pane as before.
7. Click "Changes". Check the Changes row is selected with a bar on its left edge, the commit pane and the panes to its right close and the changes pane, headed "Changes", opens to the right of the repo details pane.
8. Check the card shows a "Branches" heading below the links with "2" beside it, then a "feature/x" row and a "main" row, each with the branch icon and its name in the code font, and a "HEAD" badge on "main" only.
9. Click "feature/x". Check the row is selected with a bar on its left edge, the changes pane closes and a pane headed "feature/x" opens to the right of the repo details pane, listing "The feature's own commit" above "Change the note".
10. Click "Change the note" in the branch pane, then notes.txt. Check the commit details pane and the file pane open to the right of the branch pane, as from the commit pane.
11. Click "main". Check the pane is headed "main" and lists "Change the note" first, with no "The feature's own commit".
12. Choose Dark from the theme menu in the top bar and repeat steps 2 to 5, 7 to 9 and 11. Check the card and the branch pane are drawn in dark colours and their text is readable.
13. Close the window.
14. In a terminal make a repo with no commits, start Graft again and open it:

    ```bash
    git init /tmp/graft/empty-repo
    ```

    Check the repo details pane shows the "Branches" heading with "0" beside it, no branch rows and no error.

## Expected result

Opening a repo shows the repo explorer page with the repo details pane as its only pane, showing the repo's name and path, the Commits and Changes links and the repo's local branches with the checked-out one marked HEAD. Clicking Commits opens the commit pane to its right, and the commit details and file panes open to the right of that. Clicking Changes opens the changes pane in place of the commit pane. Clicking a branch opens a pane headed with its name, listing only its commits, in place of the commit pane, in the light and dark themes. A repo with no commits shows the Branches heading with no rows.
