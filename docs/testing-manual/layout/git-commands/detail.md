# Git commands in the right sidebar: manual test steps

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
2. Click the button at the far right of the top bar. Check the right sidebar slides in with the heading "Git commands" and shows "This page has run no Git commands."
3. Click "Repo explorer" in the left sidebar. Check the sidebar shows "This pane has run no Git commands." while the repo details pane is active. Click the repo details pane's "Commits" link, then press Right to make the commit pane active. Check the sidebar shows `cd /tmp/graft/test-repo` and under it `git log --no-show-signature --max-count=50 --branches --remotes HEAD --`.
4. Click the newest commit, "Change the note". The commit pane stays active, so check the sidebar still lists only `git log --no-show-signature --max-count=50 --branches --remotes HEAD --`.
5. Press Right to make the commit details pane active. Check the sidebar lists two commands at once: `git diff-tree -r --root --no-commit-id --numstat <hash> --` at the top, with `git diff-tree -r --root --no-commit-id --name-status <hash> --` under it. The panel lists only the two most recent, because they read the commit's changed files the pane shows last.
6. Check each command has "Took" and a duration under it, such as "Took 12 ms", and the line under the `cd` reads "Total time:" with a duration no shorter than the two listed added together, because it adds up every command the commit details pane ran, including `git log --no-show-signature --max-count=1 <hash> --`, which the pane keeps beyond the two it lists. A duration under a second is in milliseconds, one under a minute in seconds to one decimal place ("1.4 s") and a longer one in minutes and seconds.
7. Press Left. Check the sidebar shows `git log --no-show-signature --max-count=50 --branches --remotes HEAD --` again. Press Left again. Check it shows "This pane has run no Git commands."
8. Click notes.txt, then press Right to make the file pane active. Check the sidebar lists only `git diff-tree -r -p --root --no-commit-id <hash> -- notes.txt`.
9. Press Escape to close the file pane. Check the sidebar shows the commit details pane's two `git diff-tree` commands. Click notes.txt and press Right again. Check `git diff-tree -r -p --root --no-commit-id <hash> -- notes.txt` is still listed.
10. Click the copy button beside the `cd` line, paste it into a terminal and run it. Then do the same for each command, in each pane. Check each runs without an error: `git log` lists the commits and `git diff-tree` lists the changed files or shows the diff.
11. Click the button at the far right of the top bar twice, to close and open the sidebar. Check the same command is still listed. Click "Help" in the left sidebar. Check the sidebar shows "This page has run no Git commands."
12. Close the window. Add a commit with two files whose names git could read as a pattern:

    ```bash
    printf 'The bracket file.\n' > '/tmp/graft/test-repo/foo[1].txt'
    ```

    ```bash
    printf 'The plain file.\n' > /tmp/graft/test-repo/foo1.txt
    ```

    ```bash
    git -C /tmp/graft/test-repo add --all
    ```

    ```bash
    git -C /tmp/graft/test-repo commit --message "Add the two files"
    ```

    Run Graft again, open `/tmp/graft/test-repo`, open the right sidebar and the commit list, click "Add the two files", click foo[1].txt and press Right to make the file pane active. Check the sidebar's top command is `git diff-tree -r -p --root --no-commit-id <hash> -- 'foo[1].txt'`, with no `:(literal)` in it.

## Expected result

The right sidebar shows the two Git commands the active pane ran most recently, or on a page with no panes the page, the most recent first, under the `cd` into the repo, each with how long it took and the total time of every command kept for the pane or page. It follows the active pane at once as the keys and clicks change it, and shows "This pane has run no Git commands." for a pane that ran none. Each command copies with its button and runs in a terminal. A file's path is shown as the user would type it, without `:(literal)`. The commands stay when a pane or the sidebar closes.
