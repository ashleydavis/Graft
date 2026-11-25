# Repo explorer page

**ID:** repo-explorer
**Spec:** Settled
**Implementation:** Complete

A page that shows the open repo in panes that open to the right, starting with the repo details pane. Its Commits link opens the commit pane, which lists every one of the repo's commits, read a page at a time with `git log` in a background task as the list scrolls. Its Changes link opens the changes pane, which stages and unstages the working tree's files. It shows that Graft runs `git` and reads its output end to end.

## Sub-features

- [repo-details](repo-details/index.md): the repo details pane, the first pane of the repo explorer, with the repo's name and path and the Commits link that opens the commit pane.
- [commit-columns](columns/index.md): the columns that open to the right of the commit list, with a commit's details and a file's diff.
- [changes](changes/index.md): the changes pane, headed "Changes", which the Changes link opens, with the unstaged and staged files, a file's diff and the buttons that stage and unstage a whole file.
- [repo-explorer-keys](keys/index.md): the repo explorer's keys, the arrow keys, Page Up, Page Down, Enter, Escape and M, and Ctrl+1 to return to it from any page.
