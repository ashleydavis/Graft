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

1. Wait for Graft's window to open on the About page, then click "Commits" in the left sidebar.
2. Check the commits page shows the commit list as its only column, in a rounded card. Check each row shows the commit's title, author "Ada Author", date and the first seven characters of its hash. Check "Change the note" has a filled "HEAD -> main" chip and "Add the notes" has an orange outlined "v1.0" chip.
3. Click the commit "Change the note". Check its row is highlighted and its title is bold.
4. Check a second column opens to the right of the commit list, headed "Commit" with an X close button. Check it shows the title "Change the note" in bold, the description "The note now says what the second note is.", "Authored by Ada Author <ada@example.com> on" with the date and time, "Committed by Cy Committer <cy@example.com> on" with the date and time, the commit's full hash and "Parent: " with the first seven characters of the parent's hash.
5. Check the "Files changed (1)" heading and the row for notes.txt with an orange "M", the path "notes.txt" and "+1 -1".
6. Click notes.txt. Check its row is highlighted.
7. Check a third column opens to the right of the second, headed "notes.txt" with an X close button, with a diff that removes "The first note." and adds "The second note." as plain text. When the third column opens beyond the right edge of the window, check the page scrolls sideways until the whole column is in view.
8. Check the commit list is still shown in full in the first column.
9. Click "Add the readme" in the commit list. Check the third column closes and the second column shows "Add the readme", "Parents: none" and README.md with a green "A" and "+1 -0".
10. Click README.md, then click the X of the third column. Check the third column closes and the second stays.
11. Click the X of the second column. Check it closes and only the commit list is left.
12. Choose Dark from the theme menu in the top bar and repeat steps 3 to 7. Check every column is drawn in dark colours and its text is readable.
13. Close the window.

## Expected result

Each commit row shows its title, refs, author, date and short hash. Clicking a commit opens its full message, author, committer, dates, parents and changed files with their line counts to the right of the commit list, clicking a changed file opens its diff to the right of that, the page scrolls each new column into view and each new column closes with its X button, in the light and dark themes.
