# Repo explorer page: manual test steps

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

1. Wait for Graft's window to open on the welcome page.
2. Choose File, then "Open repo", and choose `/tmp/graft/test-repo`.
3. Check the breadcrumb trail in the top bar ends with "Repo explorer" and the page starts with the repo details pane, alone, at its top. Click its "Commits" link and check the commit pane opens to its right with a list of the test repo's commits, newest first: "Change the note", "Add the notes" and "Add the readme", each with the author "Ada Author", its date and the first seven characters of its hash.
4. Check the hashes match the ones `create-test-repo.sh` printed.
5. Click "About" in the left sidebar and check the About page shows.
6. Click "Repo explorer" in the left sidebar, then the repo details pane's "Commits" link, and check the commit pane shows the same commits.
7. Close the window and start Graft again. Press Ctrl+1 (Cmd+1 on macOS) on the welcome page. Check the breadcrumb trail ends with "Repo explorer" and the page shows only "No repo is open. Choose File, then Open repo, to open one."
8. Close the window.

## Expected result

The repo explorer page's commit pane lists the test repo's commits. The left sidebar opens the repo explorer page and the About page. The breadcrumb trail names the repo explorer page. The page starts with its panes, or with the message that no repo is open.
