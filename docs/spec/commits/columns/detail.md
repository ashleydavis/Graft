# Columns on the commits page

## Overview

The commits page shows its panes side by side in columns. The first is the commit pane, which holds the commit list. Clicking a commit opens the commit details pane to its right and clicking one of the commit's changed files opens the file pane to the right of that. The content of the commit details pane and the file pane is unstyled: the feature shows that the columns work and that the backend reads a commit's details, changed files and a file's diff from Git.

## Behaviour

- The commit pane is always the first column. It keeps its full width and is never hidden or cut off. When the panes are wider than the window, the page scrolls sideways.
- Clicking a commit in the commit pane opens the commit details pane to its right. Clicking a commit while the file pane is open closes the file pane.
- The commit details pane shows the commit's title, description, full hash, parent hashes ("none" for the first commit), author and committer with their emails and dates and the files the commit changed, each with git's one letter status (A, D, M or T) and its path.
- Clicking a changed file opens the file pane to the right of the commit details pane. It shows the file's path and the file's diff in the commit, as git writes it.
- Each of the commit details pane and the file pane has a Close button. Closing the file pane leaves the commit details pane open. Closing the commit details pane closes the file pane with it.
- While a pane's task runs it says "Loading the commit." or "Loading the diff.". When the task fails the pane shows why.
- The commit details pane queues the commit details task, a background task that runs the `log` wrapper for the commit's details and the `diff-tree` wrapper for its changed files.
- The `log` wrapper reads one commit with `git log -z --max-count=1` and the same `--format` string the commits page uses.
- The `diff-tree` wrapper reads the changed files with `git diff-tree -r -z --root --no-commit-id --name-status <hash>`, which compares the commit with its first parent, or with an empty tree for the first commit. git lists no changed files for a merge commit.
- The file pane queues the file diff task, a background task that runs the `diff-tree` wrapper for the file's diff with `git diff-tree -r -p --root --no-commit-id <hash> -- <path>`.
- Both wrappers start `git` through the Git interface function. They refuse a hash that is not hexadecimal and an empty file path without starting `git`.

## Acceptance criteria

- [x] The commits page shows the commit pane, which wraps the commit list. No new page or route is added.
- [x] Clicking a commit opens the commit details pane to the right of the commit pane, with the commit's details and changed files.
- [x] Clicking a changed file opens the file pane to the right of the commit details pane, with the file's detail.
- [x] The commit details pane and the file pane can each be closed.
- [x] New Git wrappers call the Git interface function and new Ziggy background tasks run them to get the commit's details, changed files and the file's detail.
- [x] The content of the new panes is unstyled.
- [x] The first column is never hidden or truncated.

## Open questions

None.
