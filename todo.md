# Todo

## Now


## Code Review


## Later

- Keep the automatic stash and unstash during a pull (and rebase). It works well.
- Be able to amend commits.
- Pull, rebase and push is one button. What the button does is configurable.
- Watching for changes:
    - Graft watches the file system for changes in a way that never runs the system out of file watchers.
    - It might find out how many file watchers the system supports and keep to a quota well below that limit.
    - It falls back to polling for changes when file watchers are not working or the quota is reached.
    - It ignores very big directories such as `node_modules` and `.git`.
    - When the watcher notices new files and adds them to the unstaged or staged area, the selection does not change, so the user never loses their place.
- Graft must have a searchable list of recent repos.
- Graft needs built-in help that shows the user how to get started. The welcome page and Help page exist, but might need more work. Review them from a new user's point of view.
- If the Graft config file is bad report the error as a toast message.
- If the Graft state file is bad, delete it, create it again and report that the file was correcte d in a warning toast message.
- Commit and other operations need a log, for example a bottom panel or drawer, that shows what's happening. It shows earlier commands, the commands running now (with a spinner) and any error. It clears when the repo changes. It needs:
    - Collapse and expand.
    - A Clear all button.
    - Search.
- Want an "auto sync" button that when toggled on enables automatic pull (with rebase) and push for a repo. It just automatically syncs with the remote when updates are available locally or in the remote.
- Stage and unstage hunks, as in the style guide.
- Might need another color to show a partially staged file. Eg yellow.
- Any colors used in a view (eg green for staged) need to be explained in context sensitive help.
- Be able to tear out a pane and make it a "pinned" tab that we can switch back to at any time.
    - When there are too many tabs to show, a searchable drop down tab picker lists them all. A hotkey opens it, the arrow keys move through it and Enter picks a tab and brings it in as the last shown tab, in place of the tab that was last.
    - Tabs can be reordered by dragging.
- Be able to tear out a pane or tab into a new window.
- The context senstive help should have "Suggested commands" below the actual commands. These should show 1 or 2 commands that user might want to run next against their repo depending on the page or pane they are currently looking at.
- Discard a file, hunk or picked lines straight away with no confirmation, as in the style guide. The discarded part stays in view faded and struck through, and its Discard button turns into Undo.
    - A discarded file or hunk should be undoable/restorable as specified in the Graft style guide. This should survive app restarts or changes between repos. You should stash the hunk with a hash of it's content and a name that indicates it's a stash used by Graft.
- The staged and unstaged file lists can be searched by file name and contents.
- Full commit search over file names, contents and commit messages.
- The title bar should say the curent open repo name and the checked-out branch.
- The user should be able to set the name of the repo. This should have a button to open the rename dialog from the repo pane configuration dropdown and should be remembered. It doesn't affect the directory name of the repo. The rename dialog should be triggerable by hotkey.
- Commit graph in the commit list, as in the style guide: coloured lanes, merge and branch curves, dotted lanes for unmerged branches, six lane colours reused in order, and each commit's dot ringed in the row's background colour so it stands clear of the lane lines. The Graph column can be turned on and off in the Commits pane configuration drop down. It is shown by default.
- Commit list columns drop out when the list is too narrow, as in the style guide.
- A HEAD badge on the commit the working tree is on, including a detached HEAD, as in the style guide.
- A commit actions menu, as in the style guide (New branch here, New tag here, Copy hash, Revert, Reset to here), opened from a button or by right-clicking a commit row. New branch's key is B and New tag's key is T.
- A "Compare with" option for a commit, as in the style guide: against its parent or against the files on disk now.
- Detect renamed and copied files, and show the old path and how similar the files are, as in the style guide.
- Selecting a directory in a commit's file list opens a pane with the diffs of all its files stacked, as in the style guide.
- Focus a tree on one directory, with a button to go to the parent directory, as in the style guide.
- Commits: There should be an info button in the Commits toolbar with an info drop down that shows information about the opened repository, according to the style guide, including the checked-out branch, how far it is ahead of and behind its remote, any conflicts and the last fetch time.
- Diff: There should be an info button for each file diff that shows details of the file, according to the style guide.
- Info buttons, according to the style guide, on everything that has details to show: each file (in file lists and diffs), hunk, commit, branch, tag, remote and directory. Details such as a file's status (added, modified, renamed, copied, conflict) go in the info drop down, never as letters on the rows.
- A side by side diff view, with the L key to switch between it and unified, as in the style guide. The choice is saved in Graft's state file.
- Mark the words that changed within a changed line of a diff, as in the style guide.
- Long diff lines stay on one row and scroll sideways, with the W key to switch wrapping on and off, as in the style guide. Graft always wraps now. The choice is saved in Graft's state file.
- Unchanged lines between hunks folded behind a bar that counts them, shown or folded again by click or Space, as in the style guide.
- Choose between showing the whole file and only the changes in a diff, with the F key, as in the style guide. The choice is saved in Graft's state file.
- A diff options button on the diff's header, as in the style guide, opening a drop down configuration dialog for the diff (unified or side by side, wrap long lines, whole file or only changes), each option with its key shown beside it.
- The diff card's header shows the change status (added, modified, deleted, renamed or copied), line counts and a rename as old path → new path, as in the style guide.
- In stacked diffs (such as a directory's), each diff folds away under its header with a button or the E key, as in the style guide. A deleted file's diff starts folded.
- Diffs over 200 changed lines wait behind a button to show them, as in the style guide.
- A plain note in place of the diff for a rename with no changes, a binary file (with its sizes) and a mode change, as in the style guide. Graft shows git's raw header lines now.
- In a diff, the current hunk or run of unchanged lines is marked with a border, as in the style guide, and a click picks one.
- Find in the diff (Ctrl+F or a button), as in the style guide: highlights matches, shows "n of m", has Previous and Next and closes with Escape.
- A diff explorer, as in the style guide, to review a whole commit or all the working changes in one pass: every changed file's diff in one scrolling column, a toolbar naming the current file and change with Previous and Next change and file buttons, Up and Down to step through the changes and Shift+Up and Shift+Down to jump file to file.
- In a diff, Up and Down move between hunks, or between lines in line selection mode. They also move to the previous or next file when at the first or last hunk. Shift+Up and Shift+Down move to the previous or next file.
- In a diff, Home and End move to the first and last hunk, Ctrl+Home and Ctrl+End move to the first and last file, and Page Up and Page Down move a page of hunks at a time.
- Line selection mode in a diff (V key), as in the style guide: pick lines with click, Shift+click and Ctrl+click, Space stages or unstages them, and a bar stages, unstages or discards the picked lines.
- A green bar beside staged lines and staged hunks in a diff, as in the style guide.
- In a diff, Delete or Backspace discards the picked lines, else the current hunk, else the file, as in the style guide. Pressing it again on a discarded part brings it back.
- In a diff, Space stages or unstages the current hunk, or the whole file when no hunk is current, as in the style guide.
- A stage or unstage button next to each changed file, as in the style guide. This includes a partly staged file.
- S and U stage and unstage the selected file in a file list, as in the style guide.
- Directory rows in a tree of changed files have buttons that stage, unstage, discard and undo every file inside them, as in the style guide.
- Changes pane modes, as in the style guide: a "Combined" mode, with one list of every changed file and one diff, as the default, and the S key to switch to the "Staged and unstaged" mode with separate Unstaged and Staged lists. The choice is saved in Graft's state file.
- In the changes pane's "Staged and unstaged" mode, the H key stacks the Unstaged and Staged panels or puts them side by side, and each panel can be collapsed or maximised, as in the style guide. The choices are saved in Graft's state file.
- A "No verify" checkbox on the commit box that skips Git's commit hooks (`git commit --no-verify`), as in the style guide.
- A toast after committing, as in the style guide: "Committed n files: <title>" or "Amended the last commit: <title>".
- Ctrl+Enter commits the staged changes from the changes pane, as in the style guide.
- A "Commit and Push" button beside the Commit button in the changes pane, which commits the staged changes and then pushes. Its key is Ctrl+Shift+Enter.
- Changes pane keys, as in the style guide: Space stages or unstages the selected file or directory, Right moves into the diff, Left or Escape goes back to the file list, and Enter moves to the commit summary.
- The diff slides in from the left whenever a different file is selected in the changes pane, by mouse click or by key, as in the style guide.
- Each toolbar button (such as Push and Pull) has a drop down dialog to configure its default behaviour or a one-off behaviour for the next run.
- Status banners, as in the style guide (info, success, warning, error, with an optional title and a Dismiss button), for things like a rebase in progress, a branch behind its remote or a rejected push.
- A progress bar for network work (fetch, pull, push, clone), as in the style guide, with a percentage or a moving bar when the size is unknown, labelled with what Git is doing (such as "Receiving objects" or "Connecting to origin").
- Rows that do not match a search are faded, not hidden, as on the style guide's overview page.
- File icons chosen by whole file name for `Cargo.lock`, `Dockerfile` and `LICENSE`, as in the style guide.

## Handling multiple repos

- A popup dialog to search and open repos. This has to be fast and keyboard driven. So hotkey (Ctrl+P) to show/hide (also Escape to hide). And up/down arrows to navigate. Type to search for a repo by name or description.
- To show which repos are open, we just need an open repos section in the left side pane. Like vs code open editors.
- Breadcrumb trail: The breadcrumb trail can also be used to switch between open repos by clicking on the repo name in the breadcrumb trail. This opens a drop down searachable list of open repos. A hotkey should also trigger that dropdown and it should be navigable and searchable using the keyboards. Search repos just by typing or by clicking the search button and typing in the search input.
    - Clicking on the repo name should open the repo quick select dropdown dialog. 
        - It shows recent repos, all repos it knows about, all repos in the currently authenticated GitHub account. 
        - It is in the center of the screen.
        - It is also triggered by shortcut key.
        - Escape to exit.
        - Arrows keys to navigate repos.
        - Type to trigger search mode and search for repos.
        - Enter to open a repo.
- However multiple repos are handled, need to be able tear each one out to its own window when required.


## Performance

- Cache the local directory structure (only after the browser asks for first time). Watch for changes. Do a throttled update of the cache. This means the directory browser is instantly available on every subsequent viewing. Or don't need update the cache automatically. Just mark the cache as dirty if something changes. That way the cache regenerates on the next use.


## Future

- Stash management. Stash's key is Ctrl+Shift+S.
- Bisect.
- Advanced worktree management: easy create, merge and destroy. Take a chunk of code and factor it out to a worktree or collapse it back. Make worktrees on worktrees to stack work on work.
- An easy way to navigate tags, worktrees and branches. Could there be one consolidated view for them?
- Focus mode: focus on a particular branch or worktree.
- Could one search cover the whole app? For example the commit list, file contents, staged and unstaged files, tags, branches and worktrees from the same search view.
- A global PRs view.
- Be able to open a repo directly from GitHub (possibly cloning it locally).
- Comments: the user can put comments on commits, files, diff hunks and practically anything else in a repo. A separate page of the app lists those comments. This lets the developer highlight potential issues, often caused by AI, to come back to later.
- Graft records an audit log of the changes made to the Git repo through the UI.
- Graft must let the user edit their local identity.
- Graft must let the user set the identity on a repo by repo basis.
- Image diff, as in the style guide: before and after side by side on a checkerboard, with dimensions and file sizes.
- A Blame view of a file, as a tab beside the Unified and Side by side diff views, as in the style guide: each line shows the commit and author that last changed it.
- A Settings page, as in the style guide, with switches for fetching in the background, showing whitespace changes, auto-stash, prune on fetch, signing commits, running hooks and the pull mode (merge, rebase, fast-forward only or ask each time). Its key is Ctrl+,.
- Rebase and interactive rebase.
- Complete branch management.
    - A Create branch dialog, as in the style guide, with a branch name and a start point. It checks the name and says what is wrong (for example "Branch names cannot contain spaces"), then creates the branch and switches to it. Its key is B.
    - A Delete branch button, as in the style guide, disabled for a protected branch with the reason in its tooltip.
    - A Merge drop down button, as in the style guide (Merge into main, Rebase onto main, Tag this commit), and a merge mode choice (merge commit, rebase or squash).
