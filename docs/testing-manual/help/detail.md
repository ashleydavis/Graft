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
3. Check the page shows the heading "Help" and under it "The left sidebar and the breadcrumb trail in the top bar move between Graft's pages. File, then Open repo, opens a repo, and Repo explorer shows it and lists its commits. About says what Graft is."
4. Check the page shows only the heading and that text.
5. Check the breadcrumb trail in the top bar reads "test-repo" then "Help".
6. Click "About" in the left sidebar, then click "About" in the trail and pick "Help". Check the Help page shows.
7. Close the window.

## Expected result

The Help page opens from the left sidebar and from the breadcrumb trail and shows its heading and how to move between Graft's pages.
