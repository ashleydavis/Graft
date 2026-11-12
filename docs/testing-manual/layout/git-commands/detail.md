# Git commands in the right sidebar: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo Graft reads:

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

1. Wait for Graft's window to open on the About page.
2. Click the button at the far right of the top bar. Check the right sidebar slides in with the heading "Git commands" and shows "This page has run no Git commands."
3. Click "Commits" in the left sidebar. Check the sidebar shows `cd /tmp/graft/test-repo` and under it `git log --max-count=50`, marked "Most recent".
4. Click the newest commit, "Change the note". Check `git diff-tree -r --root --no-commit-id --name-status <hash>` is now at the top, marked "Most recent", with `git log --max-count=1 <hash>` under it and `git log --max-count=50` last.
5. Click notes.txt. Check `git diff-tree -r -p --root --no-commit-id <hash> -- notes.txt` is now at the top.
6. Click the commit details pane's Close button. Check every command is still listed.
7. Click the copy button beside the `cd` line, paste it into a terminal and run it. Then do the same for each command. Check each runs without an error: `git log` lists the commits and `git diff-tree` lists the changed files or shows the diff.
8. Click the button at the far right of the top bar twice, to close and open the sidebar. Check every command is still listed.
9. Click "Help" in the left sidebar. Check the sidebar shows "This page has run no Git commands."
10. Click "Commits" in the left sidebar. Check the commands are listed again, with `git log --max-count=50` at the top, because the page ran it again.

## Expected result

The right sidebar shows the Git commands the open page has run, the most recent first and marked, under the `cd` into the repo. Each copies with its button and runs in a terminal. The commands stay when a pane or the sidebar closes and follow the page that is open.
