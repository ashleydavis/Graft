# Columns in the repo explorer

## Overview

The repo explorer page shows its panes side by side in columns. The first is the repo details pane (see [repo-details](../repo-details/detail.md)), whose Commits link opens the commit pane, which holds the commit list, to its right. Clicking a commit opens the commit details pane to its right and clicking one of the commit's changed files opens the file pane to the right of that. Each pane is a rounded card with a header, styled as the Graft style guide's commit explorer is, in the light and dark themes. The file pane shows the diff as rows with old and new line numbers.

## Behaviour

- The repo details pane is always the first column and the commit pane the second while it is open. Each keeps its full width and always shows in full. When the panes are wider than the window, the page scrolls sideways. The commit list scrolls inside the commit pane when it is taller than the window.
- Each row of the commit pane shows the commit's title (cut short with an ellipsis when it is too long), its refs, its author's name, its author date as a short date and the first seven characters of its hash. The title comes first and the refs sit after it in a narrow column of their own, as in the style guide's commit list, so the title always keeps its room and the author, date and hash line up from row to row. Each ref is a badge with its kind's icon: the checked-out branch filled in the accent colour and named without "HEAD -> ", a remote branch, a tag named without "tag: " and any other branch. The column shows only the badges that fit its width, in git's order, worked out from the measured widths of the column and the badges. When some are left out it shows a "…" button after them, whose tooltip shows how many more there are, and the first badge always shows, cut short with an ellipsis when it alone is too wide. Clicking "…" opens a drop-down under it listing every badge of the commit, in the style guide's ref badge look, and the selected and open commits stay as they were. The drop-down closes on Escape or a click outside it. Hovering a commit's title shows it in a tooltip. The selected commit has the selected background, and the commit whose details are open has a bar on its left edge and a bold title (see [keys](../keys/detail.md)).
- The commit list is a virtual list built with TanStack Virtual (`@tanstack/react-virtual`, locked to an exact version in `package.json`). It draws only the rows in view and a few either side, so a repo with any number of commits scrolls smoothly.
- The commit pane reads the commits a page at a time, newest first, with the commits task. The page size is `COMMIT_PAGE_SIZE` in `frontend/src/lib/commit-pages.ts`. Opening the commit pane reads the first page, from HEAD, and reads it afresh each time the pane opens. When the last row the list draws comes within `NEAR_END_ROW_COUNT` rows of the last commit read, the pane reads the next page and adds it under the commits already listed. Each page after the first runs `git log --no-show-signature --max-count=<page size> --skip=<count read> <start hash> --`: it starts from the first page's first commit, which the pane keeps as the start commit, and skips the commits already read. So the pages list every commit once, the commits from both sides of a merge included, and a commit made on top after the first page is read does not shift them. It reads one page at a time. A page with fewer commits than the page size ends at the repo's first commit, so it is the last page the pane reads.
- While a page is read, a loading row under the commits shows a spinner and "Loading the commits.". Before the first page is read it is the only row. When a page could not be read, an error row under the commits shows why, the commits already read stay listed and the pane reads the next page only after it opens again.
- A page read before the commit pane closed and opened again is dropped, so the list shows only the pages read since the pane last opened.
- Dates are shown in the locale and time zone of the system Graft runs on.
- Clicking a commit in the commit pane opens the commit details pane to its right. Clicking a commit while the file pane is open closes the file pane.
- The commit details pane is headed "Commit" with the short hash beside it. It shows the commit's full message (the title in bold, then the description when there is one) and a list of facts, each labelled: "Authored" with the author's name, email and the date and time, "Committed" with the committer's name, email and the date and time, "Hash" with the full hash and "Parent" or "Parents" with the parents as short hashes ("None, this is the first commit" for the first commit).
- Under a "Files changed (<count>)" heading it lists the files the commit changed, each with its file icon and its path, the directory muted. Hovering a file shows a tooltip with git's one letter change type in its colour (A green, D red, M or T orange) and its name, the lines the commit added and deleted ("+1 −1"), or "Binary file" for a binary file, what the change means and the path. A commit with no changed files, such as a merge, shows "No files changed in this commit.". The selected file has the selected background and the file whose diff is open has a bar on its left edge.
- Clicking a changed file opens the file pane to the right of the commit details pane. It is headed by the file's icon and the file's name, with the full path in the title's tooltip, and shows every line of the file's diff in the commit as git writes it, as rows: an added or removed line on its diff colour with its old and new line numbers and a "+" or "−" marker, a hunk header as a muted bar and git's own header lines muted.
- When a pane opens beyond the right edge of the window, the page scrolls sideways, smoothly and by the least amount needed, until the pane is in view. A pane that opens already in view leaves the page where it is.
- Each pane after the repo details pane animates as it opens and as it closes, over the style guide's normal duration (`--duration-normal`) with its standard easing (`--ease-standard`). An opening pane fades in. A closing pane stays drawn while it fades out and its column narrows to nothing, so the panes to its right slide left into its place, and then it goes. Opening another commit's details or another file's diff fades the pane in afresh.
- The keys and clicks act on the open panes while a pane animates. A closing pane ignores clicks and gives up the focus. A pane that is closing opens again at once when the user opens it again, such as with Enter after Escape closed it.
- While the system's reduced motion setting is on, the panes open and close at once.
- Each of the commit details pane and the file pane has a close button (an X icon) in its header. Closing the file pane leaves the commit details pane open. Closing the commit details pane closes the file pane with it.
- While a pane's task runs it says "Loading the commit." or "Loading the diff.". When the task fails the pane shows why.
- The commit details pane queues the commit details task, a background task that runs the `log` wrapper for the commit's details and the `diff-tree` wrapper for its changed files.
- The `log` wrapper reads one commit with `git log -z --no-show-signature --max-count=1 <hash> --` and the same `--format` string the commit pane uses. `--no-show-signature` stops `log.showSignature=true` in the user's git config adding signature text that the wrapper cannot read, so a signed commit's details show. The `--` after the hash makes git read it only as a commit, so `git log` reads the commit even when a file in the repo has the hash as its name.
- The `diff-tree` wrapper reads the changed files with `git diff-tree -r -z --root --no-commit-id --name-status <hash> --`, which compares the commit with its first parent, or with an empty tree for the first commit. git lists no changed files for a merge commit. It reads each file's line counts with the same command and `--numstat` in place of `--name-status`, because git writes only one of the two when given both. It refuses line counts that are not for the same files in the same order.
- Every `git log` and `git diff-tree` that reads a commit puts `--` straight after the hash, so git reads the hash only as a commit, even when a file in the repo has the hash as its name. Without it git stops with "ambiguous argument".
- The file pane queues the file diff task, a background task that runs the `diff-tree` wrapper for the file's diff with `git diff-tree -r -p --root --no-commit-id <hash> -- :(literal)<path>`. The `:(literal)` makes git read the path as it is, with `*`, `?` and `[` in it read as those characters: opening `foo[1].txt` shows its diff alone. The help panel shows the path without `:(literal)`.
- Both wrappers start `git` through the Git interface function. They refuse a hash that is not hexadecimal and an empty file path without starting `git`.
- The commits, commit details and file diff tasks refuse a request with an empty repo path with an error, before starting `git`. The task fails with the text "The repo path is empty. Give the path of the repo to read." and the backend keeps running and handles the next message. Graft itself always sends the path of the open repo, so the text shows only to a smoke test that sends an empty path.

## Acceptance criteria

- [x] The repo explorer page shows the commit pane, which wraps the commit list.
- [x] Clicking a commit opens the commit details pane to the right of the commit pane, with the commit's details and changed files.
- [x] Clicking a changed file opens the file pane to the right of the commit details pane, with the file's detail.
- [x] The commit details pane and the file pane can each be closed.
- [x] With `log.showSignature=true` in the git config, the commit details pane shows a signed commit with no error.
- [x] New Git wrappers call the Git interface function and new Ziggy background tasks run them to get the commit's details, changed files and the file's detail.
- [x] The first columns, the repo details pane and the commit pane, always show in full.
- [x] The panes are styled as in the Graft style guide, in the light and dark themes, without the style guide's other features.
- [x] The commit pane shows each commit's title, short hash, author, date and refs.
- [x] The commit details pane shows the full message, author, committer, dates, parents and the changed files, with each file's change type and line counts in its tooltip.
- [x] The commit details pane shows the commit when a file in the repo has the same name as the commit's short hash.
- [x] The file pane shows every line of the file's diff from Git, with line numbers.
- [x] The commit details pane lists a commit's changed files and the file pane shows their diffs when a file in the repo has the commit's full hash as its name.
- [x] The file pane's title shows the file's name only, wherever the file pane is used.
- [x] When a pane opens off screen to the right, the page scrolls right so the new pane is in view.
- [x] The commit message shows first in each row, and is never pushed out of view by badges.
- [x] Badges show in a narrow column to the right of the message.
- [x] The column shows only the badges that fit, and shows "…" when some are left out.
- [x] Clicking "…" opens a drop-down listing every badge of that commit, which closes on Escape or a click outside.
- [x] The commit list is a virtual list built with TanStack Virtual (`@tanstack/react-virtual`, at an exact version).
- [x] Scrolling near the end of the loaded commits reads the next page, until the repo's last commit.
- [x] Each page after the first starts from the first page's first commit and skips the commits already read, so a repo with a merge lists every commit once, in the order of one `git log` from that commit.
- [x] A loading row shows while a page is read and an error row when it fails.
- [x] A pane animates as it opens and as it closes, using the style guide's duration and easing tokens.
- [x] The animation is turned off while the system's reduced motion setting is on.
- [x] Keys and clicks work during the animation.
- [x] The file pane passes the file's path to git as a literal path, so a path with `*`, `?` or `[` in it shows that file's diff alone.
- [x] The commits, commit details and file diff tasks refuse an empty repo path with an error naming what was wrong and what to do, and the backend keeps running.

## Open questions

None.
