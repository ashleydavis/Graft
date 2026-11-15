# Commits page

**ID:** commits
**Spec:** Settled
**Implementation:** Complete

A page that lists the first page of the open repo's commits, read with `git log` in a background task. It shows that Graft runs `git` and reads its output end to end.

## Sub-features

- [commit-columns](columns/index.md): the columns that open to the right of the commit list, with a commit's details and a file's diff.
- [commit-keys](keys/index.md): the commit explorer's keys, the arrow keys, Enter and Escape, and Ctrl+1 to return to it from any page.
