# Columns on the commits page

## Overview

The commits page shows its panes side by side in columns. The first is the commit pane, which holds the commit list. Clicking a commit opens the commit details pane to its right and clicking one of the commit's changed files opens the file pane to the right of that. Each pane is a rounded card, styled as the Graft UI mockup's columns are, in the light and dark themes. The file pane shows the diff as plain text from Git.

## Behaviour

- The commit pane is always the first column. It keeps its full width and is never hidden or cut off. When the panes are wider than the window, the page scrolls sideways. The commit list scrolls inside the commit pane when it is taller than the window.
- Each row of the commit pane shows the commit's title (cut short with an ellipsis when it is too long), its refs, its author's name, its author date as a short date and the first seven characters of its hash. Each ref is a chip: HEAD filled in the primary colour, a tag outlined in orange and labelled with the tag's name and any other branch outlined in grey. The commit whose details are open is highlighted and its title is bold.
- Dates are shown in the locale and time zone of the system Graft runs on.
- Clicking a commit in the commit pane opens the commit details pane to its right. Clicking a commit while the file pane is open closes the file pane.
- The commit details pane is headed "Commit". It shows the commit's full message (the title in bold, then the description when there is one), "Authored by" the author with their email and the date and time, "Committed by" the committer with their email and the date and time, the full hash and the parents as short hashes ("Parent: <hash>" for one, "Parents: <hash>, <hash>" for a merge and "Parents: none" for the first commit).
- Under a "Files changed (<count>)" heading it lists the files the commit changed, each with git's one letter change type (A green, D red, M or T orange), its path and the lines the commit added and deleted ("+1 -1"), or "binary" for a binary file. A commit with no changed files, such as a merge, shows "No files changed in this commit.". The file whose diff is open is highlighted.
- Clicking a changed file opens the file pane to the right of the commit details pane. It is headed by the file's path and shows the file's diff in the commit as plain text, as git writes it.
- When a pane opens beyond the right edge of the window, the page scrolls sideways, smoothly and by the least amount needed, until the pane is in view. A pane that opens already in view leaves the page where it is.
- Each of the commit details pane and the file pane has a close button (an X icon) in its header. Closing the file pane leaves the commit details pane open. Closing the commit details pane closes the file pane with it.
- While a pane's task runs it says "Loading the commit." or "Loading the diff.". When the task fails the pane shows why.
- The commit details pane queues the commit details task, a background task that runs the `log` wrapper for the commit's details and the `diff-tree` wrapper for its changed files.
- The `log` wrapper reads one commit with `git log -z --max-count=1` and the same `--format` string the commits page uses.
- The `diff-tree` wrapper reads the changed files with `git diff-tree -r -z --root --no-commit-id --name-status <hash>`, which compares the commit with its first parent, or with an empty tree for the first commit. git lists no changed files for a merge commit. It reads each file's line counts with the same command and `--numstat` in place of `--name-status`, because git writes only one of the two when given both. It refuses line counts that are not for the same files in the same order.
- The file pane queues the file diff task, a background task that runs the `diff-tree` wrapper for the file's diff with `git diff-tree -r -p --root --no-commit-id <hash> -- <path>`.
- Both wrappers start `git` through the Git interface function. They refuse a hash that is not hexadecimal and an empty file path without starting `git`.

## Acceptance criteria

- [x] The commits page shows the commit pane, which wraps the commit list. No new page or route is added.
- [x] Clicking a commit opens the commit details pane to the right of the commit pane, with the commit's details and changed files.
- [x] Clicking a changed file opens the file pane to the right of the commit details pane, with the file's detail.
- [x] The commit details pane and the file pane can each be closed.
- [x] New Git wrappers call the Git interface function and new Ziggy background tasks run them to get the commit's details, changed files and the file's detail.
- [x] The first column is never hidden or truncated.
- [x] The panes are styled as in the Graft UI mockup, in the light and dark themes, without the mockup's pages, buttons, menus or features.
- [x] The commit pane shows each commit's title, short hash, author, date and refs.
- [x] The commit details pane shows the full message, author, committer, dates, parents and the changed files with their change type and line counts.
- [x] The file pane shows the file's diff as plain text from Git.
- [x] When a pane opens off screen to the right, the page scrolls right so the new pane is in view.

## Open questions

None.
