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
2. Check the repo details pane shows a "Commit" row with the pen-to-square icon below "Commits".
3. Click the right sidebar's toggle in the top bar to show the Git commands panel.
4. Click "Commit". Check a card headed "Commit" with "3 files, 0 staged" opens to the right of the repo details pane, with "Unstaged (3)" listing README.md, docs/new.txt and notes.txt, and "Staged (0)" showing "Nothing staged yet.". Check the Git commands panel shows `git status --porcelain=v1 --untracked-files=all --no-renames`.
5. Click the notes.txt row. Check the file pane opens to the right with the diff of notes.txt, "The second note." deleted and "The changed note." added, and the Git commands panel shows `git diff -- notes.txt`.
6. Click docs/new.txt. Check the file pane shows "A new file." as an added line. Click README.md and check it shows "# Test repo" as a deleted line.
7. Hover the double chevron button on the notes.txt row and check the tooltip shows "Stage this file". Click it. Check notes.txt moves to the Staged list with a double chevron left on a green tinge, the header shows "3 files, 1 staged" and the Git commands panel shows `git add -- notes.txt` then `git status`.
8. In a terminal run `git -C /tmp/graft/test-repo status --short` and check notes.txt is staged.
9. Stage README.md and docs/new.txt. Check the Unstaged list shows "Everything is staged." and the terminal shows all three files staged.
10. Click the double chevron left on notes.txt. Check it moves back to the Unstaged list, the Git commands panel shows `git restore --staged -- notes.txt` and the terminal shows notes.txt modified and not staged.
11. Press Escape twice. Check the first closes the file pane and the second closes the changes pane, leaving "Commit" selected.
12. Choose Dark from the theme menu in the top bar and repeat steps 4 to 6. Check the pane is drawn in dark colours and its text is readable.
13. Close the window.

## Expected result

The Commit link opens the changes pane with the unstaged and staged files in two lists. Clicking a file shows its diff in the file pane to the right. Each file's button stages or unstages the whole file, the lists show what git holds after each, and every git command shows in the Git commands panel, in the light and dark themes.
