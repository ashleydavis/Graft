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
2. Check the main content area shows the welcome page, centred: Graft's branch mark, under it the heading "Graft", under that the line "A desktop Git client. Open a local Git repo to start working with it." and under that an "Open repo" button with a folder icon.
3. Check the left sidebar has a highlighted "Welcome" link at its top and no "Repo explorer" link. Check the breadcrumb trail reads "Welcome" alone.
4. Click "Open repo". Check the system folder picker opens, titled "Open repo".
5. Cancel the picker. Check Graft still shows the welcome page with no repo open.
6. Click "Open repo" again and choose `/tmp/graft/test-repo`.
7. Check the repo explorer page shows the test repo in its repo details pane. Click its "Commits" link and check the commit pane shows the test repo's commits: "Change the note", "Add the notes" and "Add the readme". Check the trail reads "test-repo" then "Repo explorer" and the left sidebar has a "Repo explorer" link.
8. Click "Help" in the left sidebar, then "Welcome" in the left sidebar. Check the welcome page shows, the Welcome link is highlighted and the trail reads "Welcome" alone, with no "test-repo" step, even though the repo is open.
9. Click "About" in the left sidebar and check the trail reads "test-repo" then "About". Click "Welcome". Check the welcome page shows again with the trail "Welcome" alone.
10. Switch the theme to Dark with the top bar's theme menu, close the window and start Graft again. Check the welcome page shows in dark colours, with the mark, heading, line and button all readable.
11. Close the window.

## Expected result

Graft opens on the welcome page with its mark, its name, a line describing it and an "Open repo" button. The button opens the folder chosen on the repo explorer page, as File, then "Open repo" does. The left sidebar's Welcome link opens the welcome page from the About and Help pages. The trail is "Welcome" alone while it shows, with no repo step, whether or not a repo is open.
