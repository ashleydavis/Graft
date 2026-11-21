# Help page: manual test steps

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

1. Wait for Graft's window to open on the welcome page. Choose File, then "Open repo", choose `/tmp/graft/test-repo`, then click "About" in the left sidebar.
2. Click "Help" at the bottom of the left sidebar. Check the Help page shows in the main content area and the Help link is highlighted.
3. Check the page shows the heading "Help" and under it "Graft shows one page at a time in the middle of its window. These are its pages and the ways to move between them."
4. Check the "Pages" section lists, each name above its text: "Welcome" with "The page Graft starts on. Its Open repo button opens a local Git repo.", "Repo explorer" with "Shows the open repo. Its Commits link lists the repo's commits.", "Help" with "This page." and "About" with "What Graft is, its version and where to find out more."
5. Check the "Moving between pages" section lists, each name above its text: "Left sidebar" with "Repo explorer is at the top while a repo is open. Help and About are at the bottom. The menu button at the left of the top bar shrinks the sidebar to its icons and expands it again.", "Breadcrumb trail" with "The top bar shows the open repo and the page you are on. On the Help and About pages, click the page's name to switch between them.", "File menu" with "Open repo opens a local Git repo in the repo explorer. New window opens another Graft window on the welcome page." and "Keyboard" with "Press ? to list Graft's keyboard shortcuts, such as the ones that open a repo and return to the repo explorer.", the `?` drawn as a key cap.
6. Check the page shows only the heading, the line under it and those sections. Check the headings are larger and bolder than the text, each entry's name is in the main text colour and its text in the muted text colour.
7. Choose Dark in the top bar's theme menu. Check the page shows the same content in the dark colours, with every line readable. Choose System again.
8. Check the breadcrumb trail in the top bar reads "test-repo" then "Help".
9. Click "About" in the left sidebar, then click "About" in the trail and pick "Help". Check the Help page shows.
10. Close the window.

## Expected result

The Help page opens from the left sidebar and from the breadcrumb trail and shows its heading, Graft's pages and how to move between them, in the light and the dark theme.
