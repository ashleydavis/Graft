# Commits page

## Overview

The commits page lists the newest commits of the open repo (see [open-repo](../open-repo/index.md)). It is the first page that shows data from Git: it shows that Graft runs `git`, reads its output in the backend and delivers it to the frontend. The list is styled as the commit pane described in [columns](columns/detail.md).

## Behaviour

- While a repo is open, the left sidebar's "Commits" link opens the commits page, and the commits page links back to the About page.
- The page reads the open repo. Opening another repo shows that repo's commits in its place, with no commit open. While no repo is open the page shows "No repo is open. Choose File, then Open repo, to open one."
- A smoke test opens its own test repo with the welcome page's "Open repo" button, as [open-repo](../open-repo/detail.md) describes.
- `scripts/test/create-test-repo.sh` creates a test repo in a known state with a few commits, at `/tmp/graft/test-repo` or at the path given as its argument.
- When the page opens it queues the commits task, a background task that runs the `log` wrapper.
- The `log` wrapper reads one page of commits at a time. It runs `git log -z --max-count=<page size>` with a `--format` string whose fields are split by the unit separator (0x1f). Given the hash of the last commit of the previous page, it starts from that commit and skips it with `--skip=1`, so a new commit on top does not shift the pages.
- For each commit the `log` wrapper reads the hash, the parent hashes, the refs, the author's name, email and date, the committer's name, email and date, the title and the description.
- The page shows the first page only, of up to 50 commits, newest first. Each row shows the commit's title, its refs, its author's name, its author date and the first seven characters of its hash, as [columns](columns/detail.md) describes.
- While the task runs the page says "Loading the commits.". When the task fails the page shows why, such as git log failing in a folder that is not a repo.
- The `log` wrapper starts `git` through the Git interface function, the one function that runs `git` and reports its exit code, standard output and standard error. Its unit tests use a mock of that function in place of `git`.

## Acceptance criteria

- [x] One Zig Git interface function starts `git` with the arguments it is given and reports back the exit code, standard output and standard error.
- [x] A `log` wrapper calls the Git interface function to run `git log -z` with a `--format` string whose fields are split by the unit separator (0x1f).
- [x] For each commit the `log` wrapper returns the hash, the parent hashes, the refs, the author's name, email and date, the committer's name, email and date, the title and the description.
- [x] The `log` wrapper takes a page size, passed to `--max-count`, and an optional hash of the last commit of the previous page. Given that hash, it starts from it and skips it with `--skip=1`.
- [x] A mock of the Git interface function exists for unit testing the `log` wrapper and future Git abstractions.
- [x] A Ziggy background task runs the `log` wrapper and delivers the parsed first page to the UI.
- [x] A commits page on the TanStack router shows the first page of commits as a list.
- [x] While a repo is open, the left sidebar links to the commits page and the commits page links to the About page.
- [x] The page reads the open repo, and a smoke test opens its own test repo with the welcome page's "Open repo" button.
- [x] A script under `scripts/test/` creates the test repo in a known state with a few commits, at `/tmp/graft/test-repo` or at the path given as its argument.

## Open questions

None.
