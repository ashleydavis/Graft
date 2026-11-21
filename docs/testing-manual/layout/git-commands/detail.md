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
3. Click "Repo explorer" in the left sidebar. Check the sidebar still shows "This page has run no Git commands." while only the repo details pane is open. Click the repo details pane's "Commits" link. Check the sidebar shows `cd /tmp/graft/test-repo` and under it `git log --max-count=50`.
4. Click the newest commit, "Change the note". Check the sidebar lists two commands: `git diff-tree -r --root --no-commit-id --numstat <hash>` at the top, with `git diff-tree -r --root --no-commit-id --name-status <hash>` under it. The panel lists only the two most recent, because they read the commit's changed files the page shows last.
5. Click notes.txt. Check the sidebar lists two commands: `git diff-tree -r -p --root --no-commit-id <hash> -- notes.txt` at the top, with `git diff-tree -r --root --no-commit-id --numstat <hash>` under it.
6. Check each command has "Took" and a duration under it, such as "Took 12 ms", and the line under the `cd` reads "Total time:" with a duration no shorter than the two listed added together, because it adds up every command the page ran, including `git log --max-count=50`, `git log --max-count=1 <hash>` and the `--name-status` `git diff-tree`, which the page keeps beyond the two it lists. A duration under a second is in milliseconds, one under a minute in seconds to one decimal place ("1.4 s") and a longer one in minutes and seconds.
7. Click the commit details pane's Close button. Check the same two commands are still listed.
8. Click the copy button beside the `cd` line, paste it into a terminal and run it. Then do the same for each command. Check each runs without an error: `git log` lists the commits and `git diff-tree` lists the changed files or shows the diff.
9. Click the button at the far right of the top bar twice, to close and open the sidebar. Check the same two commands are still listed.
10. Click "Help" in the left sidebar. Check the sidebar shows "This page has run no Git commands."
11. Click "Repo explorer" in the left sidebar, then the repo details pane's "Commits" link. Check at most two commands are listed again, with `git log --max-count=50` at the top, because the page ran it again.

## Expected result

The right sidebar shows the two Git commands the open page ran most recently, the most recent first, under the `cd` into the repo, each with how long it took and the total time of every command the page ran. Each copies with its button and runs in a terminal. The commands stay when a pane or the sidebar closes and follow the page that is open.
