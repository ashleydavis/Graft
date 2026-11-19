# Todo

## Now

- Almost every ticket has merge conflicts because of how some code is laid out (for example the actions list). The conflicts break Playbook's merge train. Restructure the code so parallel tickets rarely touch the same lines.
    - First this before anything else.
    - All other tickets are dependent on this one.
    - Backend:
        - `backend/src/lib/actions.zig`: split the one action list into a declaration per feature and build the list from them. Move the comment that describes every action to each declaration.
        - `backend/src/test/actions.test.zig`: check actions by name. Drop the checks of the total and of indexes.
        - `backend/src/app.zig`: the shared message and task lists. Let each feature declare its own.
        - `backend/src/lib/menu.zig`: menu items for actions all go in this one file.
    - Frontend:
        - `frontend/src/components/app-layout.tsx`: move each action handler into a hook the feature owns (for example `useOpenRepoAction`), so the layout gains one line per feature.
        - `frontend/src/test/components/app-layout.test.ts`: split the tests to match the feature hooks.
        - `frontend/src/test/install-app-window.ts`: build the `window.ziggy` fake from one small fake per feature.
        - `frontend/src/main.tsx`: one route per line, and no single-line `addChildren([...])` list.
        - `frontend/src/components/left-sidebar.tsx`: the shared list of sidebar links.
    - Docs:
        - `docs/architecture.md` and `docs/user-guide.md`: stop listing every shortcut and feature in shared sentences. Link to each feature's own section instead.
        - `docs/spec/open-repo/detail.md`: remove the shared shortcut text.
        - `docs/spec/index.md`, `docs/testing-manual/index.md` and `what-changed.yaml`: one entry per line, so additions do not touch neighbouring lines.
    - Smoke tests:
        - `smoke-tests/lib/common.sh`: add a helper that starts Graft and waits for the start page, and one that opens a page from the left sidebar.
        - Change every `smoke-tests/*/test.sh` that waits for `about-page` or `welcome-page` itself to use those helpers.
- In the project rules, reference the Graft style guide (repo at ../../style-guide). The style guide shows what Graft should look like. Make this note in the project rules: Don't add features to Graft just because they are in the style guide. But for feature you are asked to add or change please make sure they follow the standard set in the style guide.
    - All other tickets depend on this one because they need to follow the styling laid down in the styl guide.
- Next big feature:
    - The Commit pane, including
        - Stage
        - Unstage 
        - Commit
    - I want this implemented minimally.
    - Follow the mockup in the style guide for styllng.
        - There's no need to add all the buttons and features indicated in the style guide. Do the minimum possible so that I can stage / unstage and commit files (hunks are not necesary right now). Make sure it looks good though, like the style guide.
    - I want this implemented using panes like what we have in the commit explorer. 
        - When a repo is opened show the repo details.
        - From the repo details click Commits which opens the Commits paned to the right.
        - Or click Commit which opens the Commit pane to the right. This contains the UI to stage, unstaged and makes commits.
    - The commit explorer should probably be renamed "repo explorer" because it now encompasses other aspects of the repo in addition to the commit log.
- Ctrl+? should open the shortcuts overlay and it should work in text boxes. The text "Ctrl+?: Show hotkeys" should appear somewhere in the app as a visual reminder to the user.
- Finish the welcome page, about page and help page to a reasonable standard.
- There is a wierd "About" link next to the Commits title that seems out of place and should be removed. In fact remove the "Commits" title because the page title is already displayed in the breadcrumb trail. We don't need to display redundant page titles.
- Breadcrumb trail: The page title should slightly bigger and bolder so it looks like the title part of the breaddcrumb trail.
- Breadcrumb trail: Add current repo name to the trail between "Graft" and "Commits".
- The first commit in commit log of Graft just seems to have a bunch of badges/chips. 
    - There is a branch and bunch of tags legitimately there.
    - In Graft the commit message might be scrolled off scrreen, but when I scroll horizontally I don't see it, like it's been truncated.
    - The fix: Don't display the badges before the commit message. Have a tight column to the right of the commit message for the badges. Don't sure more badges than can fit. If we truncate the badges show a "..." or similar. Clicking that should show a dropdown with all the badges.
- Git Command pane: In the right side pane I'd some performance stats displayed. It should show (in human readable format) the duration of the commands (all the commands) that were run to generate the information displayed on the current page.
- Git Command pane: too many Git commands are shown. It should show one or two, so the user can see what produced the information without being overwhelmed.
- Commits: only the first page of commits is shown. All pages should be shown and loaded dynamically page by page while the user scrolls. Use TanStack Virtual to make the virtual list of commits.
- There is no entry for the welcome page in breadcrumb trail. Or in the left side menu. It would be good to have that otherwise it's not possible to find the welcome page after navigating to about or help pages.
- Commits: Changing rows (up/down arrows) in the commit log should change the Commit pane and it doesn't (without pressing enter, but pressing enter should select the Commit pane).
- Commits: Changing rows (up/down arrows) in Commit file list should change what is shown in the diff pane (without pressing enter, but pressing enter should select the file diff pane).
- Breadcrumb trail: It should show all current panes to the righmost. E.g. <repo> => <commits> => <the commit> => <the-file>
- In the title bar of the diff pane only show the file name and not the full path. 
- Clicking anywhere in a pane (e.g. in the pane title bar) should seleted the pane.
- Commits: the highlighted file in the commit file list should always be visible, starting with the first file and while moving between files with the arrow keys.
- A navbar button that shows the keyboard shortcuts overlay.
- Animate the panes in the commit explorer as they open and close.

## Code Review

- Remove `shown_args` from `GitCommand` in `backend/src/lib/git-interface.zig` and derive the command the help panel shows from `args`, by leaving out `-z` and the `--format` argument with separator characters.
    - Stop filtering at `--`, so a file path such as `-z` after it is never removed.
    - Update the spec (`docs/spec/layout/git-commands/detail.md`), which says each wrapper passes both lists, and the tests that check `expected_shown_args`.
- Remove `GRAFT_TEST_REPO` and `backend/src/lib/ui-query.zig`. Smoke tests that require a repo to be open can click Graft's open repo button and cause the repo to be opened through the normal mechanism.

## Code Review Later

- `read_file_diff` in `backend/src/lib/git-diff-tree.zig`: git reads the file path as a pattern, so opening `foo[1].txt` also shows the diff of `foo1.txt`. Pass the path as `:(literal)<path>` in `args` and keep the plain path in `shown_args`.
- `backend/src/lib/git-log.zig`: with `log.showSignature=true` in the user's git config, `git log` adds signature text to its output, so parsing fails and the commits page shows an error. Add `--no-show-signature` to both `git log` calls.
- `backend/src/lib/git-log.zig`: each later page of commits runs `git log` from the last commit shown, so commits from the other side of a merge never appear. Start every page from the same commit (HEAD or a saved hash) and use `--skip=<offset>`.
- `git-log.zig`, `git-diff-tree.zig` and `pick-repo-folder.zig` in `backend/src/lib/`: `assert` checks data from the frontend (for example an empty repo path), so bad data crashes the backend. Return an error instead (for example `error.InvalidRepoPath`) with text set with `services.fail_with`.
- `backend/src/lib/git-log.zig`: the hash goes to `git log` with no `--` after it, so a branch or file with the same name (for example `cafe`) can return the wrong commit. Add `--` after the hash in `read_commit` and `read_log_page_command`.
- `backend/src/lib/git-interface.zig`: when git is not on PATH the user sees only a bare error name such as `FileNotFound`. Set text with `services.fail_with` saying git was not found on PATH.

## Later

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