# Repo details pane

## Overview

Opening a repo shows the repo explorer page with the repo details pane as its first pane. The pane shows which repo is open and leads to the panes about the repo. Its Commits link opens the commit pane to its right, and the commit details pane and the file pane open to the right of that (see [columns](../columns/detail.md)). Its Changes link opens the changes pane to its right in place of the commit pane (see [changes](../changes/detail.md)). Below the links it lists the repo's local branches, and opening a branch shows the branch pane, with only that branch's commits, in place of the commit pane.

## Behaviour

- The repo explorer page opens with the repo details pane alone and active, with no item selected. Opening another repo shows its repo details pane afresh.
- The pane is a rounded card headed "Repo" with the repo's name beside it in muted text, laid out as the other panes of the repo explorer are, with the Graft style guide's tokens in the light and dark themes. It never shrinks.
- It shows two labelled facts, as the commit details pane lays out a commit's facts: "Name" with the repo's folder name and "Path" with the repo's full path in the code font.
- Below the facts it shows the Commits link, a row with the commit icon and "Commits", then the Changes link, a row with the pen-to-square icon and "Changes", which opens the changes pane (see [changes](../changes/detail.md)). The row is a MaterialUI `ListItemButton`, as the rows of the other panes are: it shows the hover and selected colours, and a bar on its left edge while the commit pane is open.
- Clicking the Commits link selects it, opens the commit pane to the right of the repo details pane and leaves the repo details pane active. The commit pane opens afresh, with no commit selected or open, and reads the commits.
- The keys move through the repo details pane as through the other panes (see [keys](../keys/detail.md)): Down selects the Commits link, Down again the Changes link and Down again each branch in turn, Enter opens the selected link's or branch's pane and makes it active and Escape in the commit pane, the branch pane or the changes pane closes it and makes the repo details pane active.
- Below the links the pane shows a "Branches" heading with the number of the repo's local branches beside it, as the style guide's sidebar heads its Branches group, then one row per local branch in the order of their names, each with the branch icon and the branch's name in the code font. The checked-out branch has a "HEAD" badge after its name, filled in the colour of the commit list's checked-out branch badge.
- Each branch row is a MaterialUI `ListItemButton`, as the links are, with the hover and selected colours, and its `data-id` is `repo-details-branch-<name>`, as in `repo-details-branch-feature/x`.
- The page reads the branches when it opens, with the branches task, a background task that runs the `branch` wrapper. The `branch` wrapper runs `git for-each-ref --sort=refname '--format=%(HEAD) %(refname)' refs/heads/`, which writes each branch's full ref name on a line, with `*` before the checked-out one. While the branches are read the pane shows "Loading the branches." under the heading, and when they cannot be read it shows why. A repo with no commits has no branches, so it shows the heading with a count of 0, no rows and no error.
- Clicking a branch selects it, opens the branch pane to the right of the repo details pane in place of the commit pane or the changes pane and leaves the repo details pane active. The branch pane is the commit pane headed with the branch's name: it lists only the commits reachable from the branch, newest first, read a page at a time with the same rows as the commit pane. Its first page runs `git log -z --no-show-signature --max-count=<page size> refs/heads/<branch> --`, and every later page starts from its first commit, as the commit pane's do. Opening a commit in it opens the commit details pane and then the file pane, as from the commit pane. Opening another branch reads that branch's commits afresh.
- A branch's name comes from git, so the commits task checks the name is one of the branches `git for-each-ref` lists before it passes it to git, and the `log` wrapper refuses a name that starts with "-". It passes the branch as its full ref name, `refs/heads/<branch>`, with `--` after it, so a tag or a file with the branch's name is never read in its place.
- The repo details pane shows what Graft already holds about the repo. The right sidebar's Git commands panel lists the `git for-each-ref` command that reads the branches, and the `git log` commands once the commit pane or the branch pane reads the commits.

## Acceptance criteria

- [x] The repo explorer is named the repo explorer in code, specs, testing manuals, user guide and UI text.
- [x] Opening a repo shows the repo explorer with a repo details pane as its first pane.
- [x] The repo details pane shows the repo's details (at least its name and path) and a Commits link.
- [x] Clicking Commits opens the commit pane to the right of the repo details pane, and the existing commit details and file panes open to its right as before.
- [x] The keyboard moves between the panes, the repo details pane among them, with the same keys as between the other panes.
- [x] The repo details pane follows the Graft style guide.
- [x] The repo details pane lists the repo's local branches under a "Branches" heading below its links, one row each with a branch icon and the branch's name, as the style guide's sidebar page lays out its Branches group. The checked-out branch is marked.
- [x] Each branch row is the same kind of row as the links (a MaterialUI `ListItemButton` with the hover and selected colours) and has a `data-id` naming the branch.
- [x] Clicking a branch, or selecting it with Up and Down and pressing Enter, opens a pane to the right of the repo details pane, in place of the Commits pane or the changes pane, titled with the branch's name.
- [x] That pane lists only the commits reachable from the branch, newest first, read a page at a time as the Commits pane reads them, with the same rows.
- [x] Opening a commit in it opens the commit details pane and then the file pane, as from the Commits pane.
- [x] The branches are read in the Zig backend, in a task, by a new wrapper over the Git interface function. The Git commands panel lists the command.
- [x] A repo with no branches (no commits yet) shows the heading with no rows and no error.

## Open questions

None.
