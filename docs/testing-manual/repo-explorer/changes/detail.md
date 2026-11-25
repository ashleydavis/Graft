# Changes pane: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo`, then change a file, delete a file and add a new file in it:

```bash
./scripts/test/create-test-repo.sh
printf 'The changed note.\n' > /tmp/graft/test-repo/notes.txt
rm /tmp/graft/test-repo/README.md
mkdir -p /tmp/graft/test-repo/docs
printf 'A new file.\n' > /tmp/graft/test-repo/docs/new.txt
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
2. Check the repo details pane shows a "Changes" row with the pen-to-square icon below "Commits".
3. Click the right sidebar's toggle in the top bar to show the Git commands panel.
4. Click "Changes". Check a card headed "Changes" with "3 files, 0 staged" opens to the right of the repo details pane, with "Unstaged (3)" listing README.md, docs/new.txt and notes.txt, and "Staged (0)" showing "Nothing staged yet.". Press Right to make the changes pane active and check the Git commands panel shows `git status --porcelain=v1 --untracked-files=all --no-renames`.
5. Click the notes.txt row. Check the file pane opens to the right with the diff of notes.txt, "The second note." deleted and "The changed note." added. Press Right to make the file pane active and check the Git commands panel shows `git diff -- notes.txt`.
6. Click docs/new.txt. Check the file pane is headed exactly "new.txt" and hovering the heading shows "docs/new.txt". Check it shows "A new file." as an added line. Click README.md and check it shows "# Test repo" as a deleted line.
7. Hover the double chevron button on the notes.txt row and check the tooltip shows "Stage this file". Click it. Check notes.txt moves to the Staged list with a double chevron left on a green tinge, the header shows "3 files, 1 staged" and the Git commands panel, with the changes pane active, lists `git status --porcelain=v1 --untracked-files=all --no-renames` above `git add -- notes.txt`.
8. In a terminal run `git -C /tmp/graft/test-repo status --short` and check notes.txt is staged.
9. Stage README.md and docs/new.txt. Check the Unstaged list shows "Everything is staged." and the terminal shows all three files staged.
10. Click the double chevron left on notes.txt. Check it moves back to the Unstaged list and the terminal shows notes.txt modified and not staged. Check the Git commands panel lists `git status --porcelain=v1 --untracked-files=all --no-renames` above `git restore --staged -- notes.txt`.
11. Check the bottom of the pane shows a "Commit message" box and a "Commit 2 files" button, disabled while the box is empty. Hover the button and check the tooltip shows "Write a commit message.".
12. In a terminal add a pre-commit hook that fails:

    ```bash
    mkdir -p /tmp/graft/test-repo/.git/hooks
    printf '#!/bin/sh\necho "The pre-commit hook refused the commit." >&2\nexit 1\n' > /tmp/graft/test-repo/.git/hooks/pre-commit
    chmod +x /tmp/graft/test-repo/.git/hooks/pre-commit
    ```

13. Type "Remove the readme" in the message box, press Enter twice and type "Add the new file too.". Check the button is enabled, then click it. Check the commit section shows "Git did not make the commit:" with "The pre-commit hook refused the commit." under it, the message stays in the box and the Staged list still holds both files.
14. Remove the hook with `rm /tmp/graft/test-repo/.git/hooks/pre-commit` and click the Commit button again. Check the error goes, the message box empties, the Staged list shows "Nothing staged yet.", the button shows "Nothing to commit" and the Git commands panel lists `git status --porcelain=v1 --untracked-files=all --no-renames` above `git commit --message` and the message.
15. Run `git -C /tmp/graft/test-repo log -1` in the terminal and check the newest commit has both lines of the message. Click "Commits" in the repo details pane and check the commit pane lists "Remove the readme" first.
16. Click "Changes" again, then press Escape twice. Check the first closes the file pane if it is open and the next closes the changes pane, leaving "Changes" selected.
17. Choose Dark from the theme menu in the top bar and repeat steps 4 to 6 and 11. Check the pane and its commit section are drawn in dark colours and their text is readable.
18. Close the window.

## Expected result

The Changes link opens the changes pane with the unstaged and staged files in two lists. Clicking a file shows its diff in the file pane to the right. Each file's button stages or unstages the whole file, the lists show what git holds after each, the Commit button commits the staged files with the message or shows git's error text when git refuses, and the Git commands panel lists the two git commands the active pane ran most recently, in the light and dark themes.
