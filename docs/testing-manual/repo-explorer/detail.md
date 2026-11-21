# Repo explorer page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

```bash
./scripts/test/create-test-repo.sh
```

Create a second test repo at `/tmp/graft/paging-repo` with more commits than one page of the commit list, by adding empty commits to a copy of the test repo:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/paging-repo
```

```bash
for number in $(seq 1 120); do git -C /tmp/graft/paging-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Commit $number"; done
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
7. Choose File, then "Open repo", and choose `/tmp/graft/paging-repo`. Click the "Commits" link and check the list starts with "Commit 120". Scroll down the commit list. Check that before the list ends a row with a spinner and "Loading the commits." shows under the last commit for a moment, then more commits are added under it, and that scrolling on reaches "Add the readme" as the last row, with no loading row under it.
8. Click the button at the far right of the top bar to open the right sidebar. Check at most two Git commands are listed, the most recent at the top being `git log --max-count=50 --skip=1 <hash>`, the read of a later page, and that "Total time:" is no shorter than the two listed added together, because it adds up the first page's `git log --max-count=50` too. Click the button again to close the sidebar.
9. Press Escape, then Enter, to close the commit pane and open it again, with the commit pane active. Hold Down. Check the selection moves down the commits, the list scrolls to keep the selected row in view, more pages are read as it nears the end and it stops on "Add the readme". Press Enter and check the commit details pane opens for "Add the readme".
10. Close the window and start Graft again. Press Ctrl+1 (Cmd+1 on macOS) on the welcome page. Check the breadcrumb trail ends with "Repo explorer" and the page shows only "No repo is open. Choose File, then Open repo, to open one."
11. Close the window.

## Expected result

The repo explorer page's commit pane lists the test repo's commits. For a repo with more commits than one page, the list reads the next page as it scrolls, with a loading row while it reads, until it ends at the repo's first commit, and the Down key moves the selection across the pages with the selected row kept in view. The left sidebar opens the repo explorer page and the About page. The breadcrumb trail names the repo explorer page. The page starts with its panes, or with the message that no repo is open.
