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
3. Click "Commits" in the left sidebar. Check the sidebar shows `cd /tmp/graft/test-repo` and under it `git log --max-count=50`.
4. Click the newest commit, "Change the note". Check `git diff-tree -r --root --no-commit-id --numstat <hash>` is now at the top, with `git diff-tree -r --root --no-commit-id --name-status <hash>` under it, then `git log --max-count=1 <hash>` and `git log --max-count=50` last.
5. Click notes.txt. Check `git diff-tree -r -p --root --no-commit-id <hash> -- notes.txt` is now at the top.
6. Check each command has "Took" and a duration under it, such as "Took 12 ms", and the line under the `cd` reads "Total time:" with a duration no shorter than any one command's, because it adds them all up. A duration under a second is in milliseconds, one under a minute in seconds to one decimal place ("1.4 s") and a longer one in minutes and seconds.
7. Click the commit details pane's Close button. Check every command is still listed.
8. Click the copy button beside the `cd` line, paste it into a terminal and run it. Then do the same for each command. Check each runs without an error: `git log` lists the commits and `git diff-tree` lists the changed files or shows the diff.
9. Click the button at the far right of the top bar twice, to close and open the sidebar. Check every command is still listed.
10. Click "Help" in the left sidebar. Check the sidebar shows "This page has run no Git commands."
11. Click "Commits" in the left sidebar. Check the commands are listed again, with `git log --max-count=50` at the top, because the page ran it again.

## Expected result

The right sidebar shows the Git commands the open page has run, the most recent first, under the `cd` into the repo, each with how long it took and the total time of them all. Each copies with its button and runs in a terminal. The commands stay when a pane or the sidebar closes and follow the page that is open.
