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
2. Check the repo explorer page shows the repo details pane as its only column. Click its "Commits" link and check the commit list opens as the second column, in a rounded card. Check each row shows the commit's title, author "Ada Author", date and the first seven characters of its hash. Check "Change the note" has a filled "main" badge with a branch icon and "Add the notes" has a "v1.0" badge with a tag icon, and that the badges sit in a column of their own so the author, date and hash line up from row to row.
3. Check the row of "Add the readme" shows its title first, in full, then its badge column with the badges that fit and a "…" button, with its author, date and hash in line with the rows above. Hover "…" and check its tooltip shows how many more badges there are. Click "…" and check a drop-down opens under it listing first-branch and the tags v0.1.0 to v0.5.0, and that the commit is not selected or opened. Press Escape and check the drop-down closes. Click "…" again, click an empty part of the commit list and check the drop-down closes.
4. Click the commit "Change the note". Check its row is highlighted and its title is bold.
5. Check a third column opens to the right of the commit list, headed "Commit" and the short hash, with an X close button. Check it shows the title "Change the note" in bold, the description "The note now says what the second note is." and the facts "Authored" with "Ada Author <ada@example.com>" and the date and time, "Committed" with "Cy Committer <cy@example.com>" and the date and time, "Hash" with the commit's full hash and "Parent" with the first seven characters of the parent's hash.
6. Check the "Files changed (1)" heading and the row for notes.txt with its file icon and the path "notes.txt". Hover the row and check the tooltip shows an orange "M", "Modified", "+1 −1" and the path.
7. Click notes.txt. Check its row is highlighted.
8. Check a fourth column opens to the right of the third, headed "notes.txt" with an X close button, with a diff that removes "The first note." on a red row marked "−" and adds "The second note." on a green row marked "+", each with its line numbers. When the fourth column opens beyond the right edge of the window, check the page scrolls sideways until the whole column is in view.
9. Check the repo details pane and the commit list are still shown in full in the first two columns.
10. Click "Add the readme" in the commit list. Check the fourth column closes and the third column shows "Add the readme", "Parents" with "None, this is the first commit" and README.md. Hover README.md and check the tooltip shows a green "A", "Added" and "+1 −0".
11. Click README.md, then click the X of the fourth column. Check the fourth column closes and the third stays.
12. Click the X of the third column. Check it closes and only the repo details pane and the commit list are left.
13. Choose Dark from the theme menu in the top bar and repeat steps 3 to 8. Check every column is drawn in dark colours and its text is readable.
14. Close the window.

## Expected result

Each commit row shows its title, refs, author, date and short hash, the title never hidden by badges, and a commit with more badges than fit shows a "…" whose drop-down lists them all. Clicking a commit opens its full message, author, committer, dates, parents and changed files with their line counts to the right of the commit list, clicking a changed file opens its diff to the right of that, the page scrolls each new column into view and each new column closes with its X button, in the light and dark themes.
