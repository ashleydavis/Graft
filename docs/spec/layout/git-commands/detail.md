# Git commands in the right sidebar

## Overview

Graft shows the Git commands behind each pane and page and how long each took, so a user learns the commands, can run them in a terminal and sees what the Git work cost. The right sidebar holds a panel headed "Git commands" with the commands of the selected pane: the active pane on the repo explorer page and the page shown on every other page.

## Behaviour

- On the repo explorer page the panel shows the commands of the active pane, the pane the keys act on, marked by its border. The commit pane shows its `git log` page reads, the commit details pane its `git log --max-count=1 <hash>` and `git diff-tree` commands, the file pane its file's `git diff-tree -p` command, the changes pane the commands its own tasks ran (status, stage, unstage and commit) and the changes pane's file pane its diff command.
- When another pane becomes active, by Left, Right, Enter, Escape or a click, the panel shows that pane's commands at once. A pane that has run no Git commands, such as the repo details pane, shows "This pane has run no Git commands." The line under the heading reads "The Git commands this pane ran."
- On every other page the panel shows the commands of the page shown, and the line under the heading reads "The Git commands this page ran." A page that has run no Git commands, such as the About and Help pages, shows "This page has run no Git commands." The repo explorer page with no repo open has no panes, so it shows the page's text too.
- The active pane is one value the layout holds, set by the repo explorer page as its active pane changes and cleared when the page closes, so every part of the layout that follows the selected pane or page reads the same one.
- Above the commands is `cd <repo>`, which moves a terminal into the repo the commands ran in.
- The panel lists at most two commands: the two the pane or page ran most recently, the most recent first. The most recent commands are the ones that read what the user opened last, so a short list shows what produced the pane's newest content. With a commit open the commit details pane lists the two `git diff-tree` commands for the commit's changed files. After a file is staged in the changes pane it lists `git status` above `git add`, and the changes pane's file pane lists the diff it read again above the one it read before. The limit is `COMMANDS_SHOWN_MAX` in `frontend/src/lib/git-commands.ts`.
- A command run again moves to the top rather than showing twice. Each pane and page keeps its own most recent commands, listed or not, up to the limit `MAX_COMMANDS_PER_PAGE` in `frontend/src/lib/git-commands.ts` sets.
- Each command, and the `cd` line, has a copy button that copies it to the clipboard.
- Under each command is how long it took, as "Took 12 ms". A command run again shows the duration of its most recent run. Under the `cd` line is "Total time:" with the sum of the durations of every command the pane or page keeps, listed or not, so the total covers every command kept for it.
- A duration under a second is written in whole milliseconds ("12 ms"), one under a minute in seconds to one decimal place ("1.4 s") and a longer one in minutes and seconds ("2 min 5 s"). Each is rounded down.
- The backend measures each duration on a clock that never jumps when the system time is changed, from just before `git` starts to just after it ends, in whole milliseconds.
- Graft keeps the commands while it runs. Closing a pane, closing the sidebar or moving to another page removes none of them. Opening a pane again shows the commands it kept, with any new ones on top.
- A command shown works when pasted into a terminal after the `cd` line. It can differ from what Graft runs: Graft runs `git -C <repo>` and adds `-z` and a `--format` with separator characters to read git's output, and the command shown leaves those out. On the repo explorer page it is `git log --no-show-signature --max-count=50 --branches --remotes HEAD --`, which lists the commits of every local branch, every remote-tracking branch and HEAD. Each later page of commits the commit list reads as it scrolls adds `git log --no-show-signature --max-count=50 --skip=<count read> --branches --remotes HEAD --`, where the count is how many commits the list has read, so the two commands listed after a scroll are the most recent page reads. In a repo with no commits the first page's `git log` fails, and Graft adds `git rev-parse --verify --quiet HEAD`, which finds that HEAD has no commit. Opening a commit adds `git log --no-show-signature --max-count=1 <hash> --`, `git diff-tree -r --root --no-commit-id --name-status <hash> --` and `git diff-tree -r --root --no-commit-id --numstat <hash> --`. Opening a file adds `git diff-tree -r -p --root --no-commit-id <hash> -- <path>`, with the path as the user would type it: Graft runs it as `:(literal)<path>`, so git reads `*`, `?` and `[` in it as those characters. The command shown leaves `:(literal)` out. Pasted into a terminal, a path with `*`, `?` or `[` in it is read by git as a pattern, so the command shown can list the diffs of other files that match it as well. A word a shell would read differently, such as a path with a space, is quoted for a POSIX shell.
- The backend decides the command shown. Each Git wrapper gives the Git interface function only the arguments it runs. The Git interface function derives the command shown from them: the same arguments without `-z` and without a `--format` that writes separator characters by their hex code (`%x`). Every argument after `--` is a path and is always shown, even one named `-z`, without the `:(literal)` Graft puts in front of it. For each `git` it runs, once that `git` has ended, the Git interface function sends a `git-command` task event with the `cd` line, the command and its duration. The frontend only shows what it is sent.

## Acceptance criteria

- [x] The right sidebar shows the Git commands for the active page, and the most recent command run for that page.
- [x] Closing a pane does not remove a command. Moving to another page shows that page's commands.
- [x] Each command can be copied.
- [x] The Git interface function emits a standard Ziggy event with the formatted command line for each `git` it starts, and the help panel handles it. No wrapper or page builds its own list of commands.
- [x] `cd <repo>` is shown above the commands. Each command leaves out `-C`, `-z` and `--format` with separator characters.
- [x] Every command shown works when pasted into a terminal in the repo.
- [x] The `git log` command shown for the commit list names every branch and HEAD with `--branches --remotes HEAD --`, and lists the same commits when pasted into a terminal.
- [x] The Git interface function derives the command shown from the arguments Graft runs, and every argument after `--` is shown.
- [x] The backend measures how long each git command takes and sends it with the command.
- [x] The panel shows the duration of every command run for the current page, in a human readable form (for example "12 ms", "1.4 s").
- [x] The panel shows the total time of those commands.
- [x] The panel shows at most two commands for the current page: the ones that produced what the page shows.
- [x] The total duration covers every command run for the page.
- [x] A path Graft passes as `:(literal)<path>` is shown as the user would type it, without `:(literal)`.
- [x] On the repo explorer page the panel shows the Git commands run for the active pane: the commit pane, the commit details pane, the file pane, the changes pane and the changes pane's file pane each show their own.
- [x] When another pane becomes active, by Left, Right, Enter, Escape or a click, the panel shows that pane's commands at once.
- [x] A pane that has run no Git commands, such as the repo details pane, shows "This pane has run no Git commands."
- [x] On every other page the panel shows the page's commands, and a page that has run none shows "This page has run no Git commands."
- [x] The limits on the commands kept and shown apply to each pane, and "Total time:" adds up the commands kept for the active pane.
- [x] Closing a pane keeps its commands. Opening the pane again shows them with any new ones on top.

## Open questions

None.
