# Todo

## Now

- Commit needs a progress indicator to show when it's working, for example while the pre-commit hook runs the tests.
- Commit needs a cancel button to stop a commit in progress that's taking too long (for example running tests).
- Commit and other operations need a log, for example a bottom panel or drawer, that shows what's happening. It shows earlier commands, the commands running now (with a spinner) and any error. It clears when the repo changes and when the user clicks a clear button, and it is searchable.
- Show a commit's error in a toast, following the style guide.
- Breadcrumb trail: it looks good full screen, but in a smaller window when the trail does not fit it wraps, the top part goes off the top of the window and the bottom part overflows the nav bar. Collapse the middle of the trail and truncate long text. Clicking the collapsed part shows a list of the left out items.
- The "Ctrl+/: Show hotkeys" reminder takes too much screen space. Move it to the Help page.
- Changing between commits in the Commits pane and between files in the Commit pane causes jerky, flickery horizontal scrolling, because the rightmost pane keeps closing and opening. It should change seamlessly from one item to the next.

- Clicking outside the shortcuts overlay should dismiss it. There should also be a close button if there isn't one already.
- The Commits pane doesn't have a close button.
- Changing commits with the arrow keys doesn't change what's shown in the Commit pane.
- Using the arrow keys to change files in the Commit pane should update what's shown in the diff pane, but it doesn't.
- Tweak the text on the welcome page.

## Code Review

## Code Review Later

- `read_file_diff` in `backend/src/lib/git-diff-tree.zig`: git reads the file path as a pattern, so opening `foo[1].txt` also shows the diff of `foo1.txt`. Pass the path as `:(literal)<path>` in `args` and keep the plain path in `shown_args`.
- `backend/src/lib/git-log.zig`: with `log.showSignature=true` in the user's git config, `git log` adds signature text to its output, so parsing fails and the commits page shows an error. Add `--no-show-signature` to both `git log` calls.
- `backend/src/lib/git-log.zig`: each later page of commits runs `git log` from the last commit shown, so commits from the other side of a merge never appear. Start every page from the same commit (HEAD or a saved hash) and use `--skip=<offset>`.
- `git-log.zig`, `git-diff-tree.zig` and `pick-repo-folder.zig` in `backend/src/lib/`: `assert` checks data from the frontend (for example an empty repo path), so bad data crashes the backend. Return an error instead (for example `error.InvalidRepoPath`) with text set with `services.fail_with`.
- `backend/src/lib/git-log.zig`: the hash goes to `git log` with no `--` after it, so a branch or file with the same name (for example `cafe`) can return the wrong commit. Add `--` after the hash in `read_commit` and `read_log_page_command`.
- `backend/src/lib/git-interface.zig`: when git is not on PATH the user sees only a bare error name such as `FileNotFound`. Set text with `services.fail_with` saying git was not found on PATH.

## Later

- Reduce merge conflicts again. infra-1 halved them (about one per two approved tickets on 2026-11-23, from about one per ticket before), but they still happen. The causes are in `docs/reducing-conflicts.md` under "Session of 2026-11-23".

- Commits: I'm seeing the main branch, but possibly other branches are hidden? I can't see the other branches.
- Make it easy to filter branches. Maybe a branch selector dropdown dialog that we can use to view, and search branches with options to show/hide them. Also an option for each branch to "show only this one". A reset butt to "show all branches" would be good too.
- Commits: For the following columns in the Commits pane, the user should be able to enable/disable them through the Commits pane configuration drop down. All of these should be hidden by default.
    - Author
    - Date
    - Short sha 
- There should be an info button in the Commits toolbar with an info drop down that shows information about the opened repository.
- Want an "auto sync" button that when toggled on enables automatic pull (with rebase) and push for a repo. It just automatically syncs with the remote when updates are available locally or in the remove.
- Be able to cancel commits that are taking ages due to a pre commit hook.
- Implement the directory browser from the Graft style guide into graft. 
    - It's important that it be keyboard navigable.
    - I'd like to try this two ways:
        1. There's a separate page that always holds the directory browser from which a repo can be selected and click the Open button to open it. We can switch back to the directory browser at any time to open more repos into the current window.
        2. The directory browser is the first pane in the commit explorer. Meaning that when ever a directory is clicked that is a repo, it opens the commit history to the right. Other panes get opened further to the right.
        3. Each repod in the directory browser could have "Open in this window" and "Open in new window".
- When viewing a particular branch, tag, commit, diff or file (focused down) put that thing in the breadcrumb trail.
- Want the following to be context sensitive and relevant to the current selected component or pane:
    - Git command pane
    - Help pane
    - Command pallette
    - Shortcuts overlay
- Might need another color to show a partially staged file. Eg yellow
- Any colors used in a view (eg green for staged) need to be explained in context sensitive help.
- Consider removoing the commit hash from title of Commit pane. When we start adding other buttons to the pane title bar there will be limited screen real estate there.
- When hovered over the filename in the diff title bar show a tooltip with the full path and other info about the file.
- Be able to tear out a pane and make it a "pinned" tab that we can switch back to at any time. 
- Be able to tear out a pane or tab into a new window.
- There probably doesn't need to be a "Commits" link in the left sidebar, because I'm thinking that will go in the "repo explorer" in the repo details pane when a repo is opened or selected.

## Handling multiple repos

- A popup dialog to search and open repos. This has to be fast and keyboard driven. So hotkey to show/hide (also Escape to hide). And up/down arrows to navigate. Type to search for a repo by name or description.
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
