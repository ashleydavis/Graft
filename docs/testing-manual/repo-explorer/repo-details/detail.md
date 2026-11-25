# Repo details pane: manual test steps

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

## Steps

1. Wait for Graft's window to open on the welcome page, then click "Open repo" and choose `/tmp/graft/test-repo`.
2. Check the repo explorer page opens with one column, a rounded card headed "Repo" and "test-repo" in muted text, with its border in the theme's blue primary colour.
3. Check the card shows "Name" with "test-repo" and "Path" with `/tmp/graft/test-repo` in the code font, then a "Commits" row with the commit icon and a "Changes" row with the pen-to-square icon.
4. Hover the "Commits" row and check it shows the hover colour.
5. Click "Commits". Check the row is selected with a bar on its left edge, the commit pane opens to the right of the repo details pane listing the test repo's commits and the repo details pane keeps the blue border.
6. Click "Change the note" in the commit pane, then notes.txt. Check the commit details pane and the file pane open to the right of the commit pane as before.
7. Click "Changes". Check the Changes row is selected with a bar on its left edge, the commit pane and the panes to its right close and the changes pane, headed "Changes", opens to the right of the repo details pane.
8. Choose Dark from the theme menu in the top bar and repeat steps 2 to 5 and 7. Check the card is drawn in dark colours and its text is readable.
9. Close the window.

## Expected result

Opening a repo shows the repo explorer page with the repo details pane as its only pane, showing the repo's name and path and the Commits and Changes links. Clicking Commits opens the commit pane to its right, and the commit details and file panes open to the right of that. Clicking Changes opens the changes pane in place of the commit pane, in the light and dark themes.
