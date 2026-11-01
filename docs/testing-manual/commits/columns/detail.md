# Columns on the commits page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo Graft reads at `/tmp/graft/test-repo`:

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

1. Wait for Graft's window to open on the About page, then click its "Commits" link.
2. Check the commits page shows the commit list as its only column.
3. Click the commit "Change the note".
4. Check a second column opens to the right of the commit list, with a "Close" button, the title "Change the note", the description "The note now says what the second note is.", the commit's full hash, one parent hash, the author "Ada Author (ada@example.com)", the committer "Cy Committer (cy@example.com)" and the changed file "M notes.txt".
5. Click "M notes.txt".
6. Check a third column opens to the right of the second, with a "Close" button, the path "notes.txt" and a diff that removes "The first note." and adds "The second note.".
7. Check the commit list is still shown in full in the first column.
8. Click "Add the readme" in the commit list. Check the third column closes and the second column shows "Add the readme", "Parents: none" and the changed file "A README.md".
9. Click "A README.md", then click the "Close" button of the third column. Check the third column closes and the second stays.
10. Click the "Close" button of the second column. Check it closes and only the commit list is left.
11. Close the window.

## Expected result

Clicking a commit opens its details to the right of the commit list, clicking a changed file opens its diff to the right of that and each new column closes with its "Close" button.
