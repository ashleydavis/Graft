# Changes pane

## Overview

The changes pane is where the user gets the working tree's changes ready for the next commit. The repo details pane's Commit link opens it to the right of the repo details pane, in place of the commit pane. It follows the Commit page of the Graft style guide with its two lists, Unstaged above Staged, and a single file diff to its right. It stages and unstages whole files.

## Behaviour

- The repo details pane lists a "Commit" link below the Commits link, with the pen-to-square icon. Clicking it selects it, opens the changes pane to the right of the repo details pane, closing the commit pane and the panes to its right if they were open, and leaves the repo details pane active. Clicking Commits closes the changes pane and its file pane and opens the commit pane.
- The changes pane is a rounded card headed "Commit", with how many files changed and how many are staged beside it in muted text, as in "3 files, 1 staged". A file in both lists counts once. It is laid out as the other panes of the repo explorer are, with the Graft style guide's tokens in the light and dark themes, and fades in as it opens.
- When it opens it queues the working changes task, a background task that runs `git status --porcelain=v1 -z --untracked-files=all --no-renames` through the Git interface function. Every untracked file is listed as itself, and a renamed file shows as a deleted file and a new one. While the task runs the pane shows "Loading the changes.". When the task fails the pane shows why.
- The pane shows two lists, each in a bordered box with a raised heading bar: "Unstaged (n)" above "Staged (n)". A file whose changes are not staged, a new untracked file and a file in conflict are in the Unstaged list. A file whose changes are staged is in the Staged list. A file with staged and unstaged changes is in both. Each list scrolls on its own. An empty Unstaged list shows "Everything is staged." and an empty Staged list shows "Nothing staged yet.". A working tree with no changes shows "No changes. The working tree matches the last commit." with a check mark in place of the lists.
- Each row shows the stage button, the file's icon and its path, with the directory muted and the file name in the main text colour. The row is a MaterialUI `ListItemButton`: it shows the hover and selected colours and a bar on its left edge while its file pane is open.
- A row in the Unstaged list has a square button with a double chevron right in the style guide's stage button colours, with the tooltip "Stage this file". Clicking it stages the whole file with `git add -- <path>`, through the stage file task. A row in the Staged list has a double chevron left on a slight green tinge, with the tooltip "Unstage this file". Clicking it unstages the whole file with `git restore --staged -- <path>`, through the unstage file task. A new file, a modified file and a deleted file are staged and unstaged the same way. A click on the button leaves the selection as it was.
- The stage file, unstage file and working file diff tasks refuse a path that is empty, absolute or has a `..` part, so git reads and changes files inside the repo only.
- After each stage and unstage the pane reads the changes again, so the lists show what git holds. When the file that moved had its file pane open or was selected, the selection and the file pane follow it to its row in the other list. When a row that was selected or open is no longer listed, its selection is dropped and its file pane closes. When git refuses to stage or unstage, the pane shows why above the lists and the lists stay as they were.
- Clicking a row selects it, opens the file pane to the right of the changes pane with the file's diff and makes the changes pane active. The file pane is the one the commit details pane opens (see [columns](../columns/detail.md)), headed by the file's icon and path with a close button. For a row in the Staged list it shows `git diff --cached -- <path>`, for a row in the Unstaged list `git diff -- <path>`, and for an untracked file `git diff --no-index -- /dev/null <path>`, which shows every line as added. The working file diff task reads it. The diff is read again each time the changes are read.
- The keys move through the changes pane as through the other panes (see [keys](../keys/detail.md)): Down and Up move through the Unstaged rows then the Staged rows, Enter opens the selected row's file pane and makes it active and Escape closes the file pane, then the changes pane.
- Every Git command the changes pane runs goes through the Git interface function, so the right sidebar's Git commands panel counts it in the total time and lists it while it is one of the page's two most recent, as for the other panes.

## Acceptance criteria

- [x] The repo details pane has a Commit link that opens the Commit pane to its right.
- [x] The Commit pane shows the unstaged and staged files in two separate lists.
- [x] Selecting a file shows its diff in a single file diff pane to the right.
- [x] A file can be staged (moving it from the unstaged list to the staged list) and unstaged (the reverse), whole files only.
- [x] The lists update after each stage and unstage.
- [x] The Commit pane follows the mockup in the Graft style guide, without the buttons and features it shows beyond stage and unstage.
- [x] The git commands it runs show in the git commands panel like the other panes.

## Open questions

None.
