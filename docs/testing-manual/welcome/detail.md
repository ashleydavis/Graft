# Welcome page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create a test repo to open:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/test-repo
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

1. Wait for Graft's window to open.
2. Check the main content area shows the welcome page, centred: Graft's branch mark, under it the heading "Graft", under that the line "A desktop Git client. Open a local Git repo to see its commits." and under that an "Open repo" button with a folder icon.
3. Check the left sidebar has no "Commits" link and the breadcrumb trail is empty.
4. Click "Open repo". Check the system folder picker opens, titled "Open repo".
5. Cancel the picker. Check Graft still shows the welcome page with no repo open.
6. Click "Open repo" again and choose `/tmp/graft/test-repo`.
7. Check the commits page shows the test repo's commits: "Change the note", "Add the notes" and "Add the readme". Check the trail reads "test-repo" then "Commits" and the left sidebar has a "Commits" link.
8. Switch the theme to Dark with the top bar's theme menu, close the window and start Graft again. Check the welcome page shows in dark colours, with the mark, heading, line and button all readable.
9. Close the window.

## Expected result

Graft opens on the welcome page with its mark, its name, a line describing it and an "Open repo" button. The button opens the folder chosen on the commits page, as File, then "Open repo" does.
