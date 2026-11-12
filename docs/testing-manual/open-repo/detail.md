# Open repo: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create two test repos to open:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/test-repo
```

```bash
./scripts/test/create-test-repo.sh /tmp/graft/other-repo
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

1. Wait for Graft's window to open on the welcome page.
2. Check the left sidebar shows only the "Help" and "About" links and the breadcrumb trail is empty.
3. Open the File menu. Check its first item is "Open repo", above "Close Window".
4. Choose "Open repo". Check the system folder picker opens, titled "Open repo".
5. Cancel the picker. Check Graft still shows the welcome page with no repo open.
6. Choose File, then "Open repo" again, and choose `/tmp/graft/test-repo`.
7. Check the commits page shows the test repo's commits: "Change the note", "Add the notes" and "Add the readme". Check the trail reads "test-repo" then "Commits" and the left sidebar has a "Commits" link again.
8. Click "About" in the left sidebar, then "Commits". Check the same commits show without choosing the repo again.
9. Choose File, then "Open repo", and choose `/tmp/graft/other-repo`. Check the trail reads "other-repo" then "Commits" and the commits page lists that repo's commits.
10. Choose File, then "Open repo", and choose a folder that is not a Git repo, such as `/tmp`. Check the commits page shows why git could not read it.
11. Close the window and start Graft again. Check it starts on the welcome page with no repo open.

## Expected result

Graft starts with no repo open. File, Open repo opens the folder chosen in the commit explorer, in place of the repo open before, and the repo stays open while moving between pages until Graft closes.
