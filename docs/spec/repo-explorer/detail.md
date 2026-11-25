# Repo explorer page

## Overview

The repo explorer page shows the open repo (see [open-repo](../open-repo/index.md)) in panes that open to the right. It opens on the repo details pane (see [repo-details](repo-details/detail.md)), whose Commits link opens the commit pane, which lists the newest commits of every branch of the repo. It is the first page that shows data from Git: it shows that Graft runs `git`, reads its output in the backend and delivers it to the frontend. The list is styled as the commit pane described in [columns](columns/detail.md).

## Behaviour

- While a repo is open, the left sidebar's "Repo explorer" link opens the repo explorer page.
- The breadcrumb trail shows the page's title, "Repo explorer", so the page starts with its panes, or with the message that no repo is open. After the title it has a step for each open pane, up to the rightmost, as [layout](../layout/detail.md) describes.
- The page reads the open repo. Opening another repo shows that repo in its place, with only the repo details pane open. While no repo is open the page shows "No repo is open. Choose File, then Open repo, to open one."
- A smoke test opens its own test repo with the welcome page's "Open repo" button, as [open-repo](../open-repo/detail.md) describes.
- `scripts/test/create-test-repo.sh` creates a test repo in a known state with a few commits, at `/tmp/graft/test-repo` or at the path given as its argument.
- When the commit pane opens it queues the commits task, a background task that runs the `log` wrapper. It reads the commits afresh each time the commit pane opens.
- The `log` wrapper reads one page of commits at a time, from every local branch, every remote-tracking branch and HEAD. It runs `git log -z --no-show-signature --max-count=<page size> --branches --remotes HEAD --` with a `--format` string whose fields are split by the unit separator (0x1f). `--no-show-signature` stops `log.showSignature=true` in the user's git config adding signature text that the wrapper cannot read, so a repo with signed commits lists its commits. `--branches --remotes HEAD` names only the branches and HEAD, so a commit that only another branch reaches is listed and stashes and other refs are left out. Every later page runs `git log -z --no-show-signature --max-count=<page size> --skip=<count read> --branches --remotes HEAD --`, where the count is how many commits the pane has read so far. Every page starts from the same refs, so the pages together list the same commits as one `git log --branches --remotes HEAD`, newest first, each once, the commits from both sides of a merge included. The `--` after HEAD makes git read HEAD only as a commit, so the page is read even when a file in the repo is named HEAD. Each page reads the branches as they stand when it is read: when a branch moves on between two pages, git can list a commit the pane has already listed, and the pane leaves it out, so each commit is listed once.
- For each commit the `log` wrapper reads the hash, the parent hashes, the refs, the author's name, email and date, the committer's name, email and date, the title and the description.
- In a repo with no commits `git log` fails. When it fails for the first page, the wrapper runs `git rev-parse --verify --quiet HEAD`, which exits with 1 with no output when HEAD has no commit, and then reads an empty page, so the commit pane shows "There are no commits." in place of an error. Any other result, such as a folder outside a repo, is still an error.
- The commit pane lists every commit, newest first, reading the next page as the list scrolls. Each row shows the commit's title, its refs, its author's name, its author date and the first seven characters of its hash, as [columns](columns/detail.md) describes.
- While a commits task runs, the commit pane shows grey placeholder rows where commits will appear. When the task fails an error row in the commit pane shows why, such as git log failing in a folder outside a repo. Once the last page has been read, "That is every commit." shows under the last commit, or "There are no commits." in a repo with none, as [columns](columns/detail.md) describes.
- The `log` wrapper starts `git` through the Git interface function, the one function that runs `git` and reports its exit code, standard output and standard error. Its unit tests use a mock of that function in place of `git`.

## Acceptance criteria

- [x] One Zig Git interface function starts `git` with the arguments it is given and reports back the exit code, standard output and standard error.
- [x] A `log` wrapper calls the Git interface function to run `git log -z` with a `--format` string whose fields are split by the unit separator (0x1f).
- [x] For each commit the `log` wrapper returns the hash, the parent hashes, the refs, the author's name, email and date, the committer's name, email and date, the title and the description.
- [x] The `log` wrapper takes a page size, passed to `--max-count`, and for a later page the count of commits read so far, which it skips with `--skip=<count read>`. Every page starts from every local branch, every remote-tracking branch and HEAD, with `--branches --remotes HEAD`.
- [x] Reading every page of a repo with a merge, a branch of its own, a remote-tracking branch, a detached HEAD and a stash lists the same commits in the same order as one `git log --branches --remotes HEAD`, none missing, none twice and the stash left out.
- [x] A commit git lists again on a later page, because a branch moved on between the pages, is listed once.
- [x] The `log` wrapper passes `--no-show-signature` to `git log` on every page, so with `log.showSignature=true` in the git config and a signed commit in the history the commit pane lists the commits with no error.
- [x] The `log` wrapper passes `--` straight after HEAD on every page, so the page is read even when a file is named HEAD.
- [x] A mock of the Git interface function exists for unit testing the `log` wrapper and future Git abstractions.
- [x] A Ziggy background task runs the `log` wrapper and delivers each parsed page to the UI.
- [x] A repo explorer page on the TanStack router shows the commits as a list in its commit pane.
- [x] While a repo is open, the left sidebar links to the repo explorer page.
- [x] The breadcrumb trail shows the page's title and the page starts with its panes, or with the message that no repo is open.
- [x] The page reads the open repo, and a smoke test opens its own test repo with the welcome page's "Open repo" button.
- [x] A script under `scripts/test/` creates the test repo in a known state with a few commits, at `/tmp/graft/test-repo` or at the path given as its argument.

## Open questions

None.
