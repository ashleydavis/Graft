# Git commands in the right sidebar

## Overview

Graft shows the Git commands behind each page and how long each took, so a user learns the commands, can run them in a terminal and sees what the page's Git work cost. The right sidebar holds a panel headed "Git commands" with the commands the open page has run.

## Behaviour

- The panel shows the commands of the page that is open. Moving to another page shows that page's commands. A page that has run no Git commands, such as the About and Help pages, shows "This page has run no Git commands."
- Above the commands is `cd <repo>`, which moves a terminal into the repo the commands ran in.
- The panel lists at most two commands: the two the page ran most recently, the most recent first. The most recent commands are the ones that read what the user opened last, so a short list shows what produced the newest content on the page. With a file open in the commit pane they are the file's diff and the changed files' line counts. With a commit open and no file they are the two `git diff-tree` commands for the commit's changed files. After a file is staged or unstaged in the changes pane with a file open they are the diff the file pane reads again and `git status`, so `git add` or `git restore --staged` counts in the total but is not listed. The limit is `COMMANDS_SHOWN_MAX` in `frontend/src/lib/git-commands.ts`.
- A command run again moves to the top rather than showing twice. A page keeps its most recent commands, listed or not, up to the limit `MAX_COMMANDS_PER_PAGE` in `frontend/src/lib/git-commands.ts` sets.
- Each command, and the `cd` line, has a copy button that copies it to the clipboard.
- Under each command is how long it took, as "Took 12 ms". A command run again shows the duration of its most recent run. Under the `cd` line is "Total time:" with the sum of the durations of every command the page keeps, listed or not, so the total covers every command run for the page.
- A duration under a second is written in whole milliseconds ("12 ms"), one under a minute in seconds to one decimal place ("1.4 s") and a longer one in minutes and seconds ("2 min 5 s"). Each is rounded down.
- The backend measures each duration on a clock that never jumps when the system time is changed, from just before `git` starts to just after it ends, in whole milliseconds.
- Graft keeps the commands while it runs. Closing a pane, closing the sidebar or moving to another page removes none of them.
- A command shown works when pasted into a terminal after the `cd` line. It can differ from what Graft runs: Graft runs `git -C <repo>` and adds `-z` and a `--format` with separator characters to read git's output, and the command shown leaves those out. On the repo explorer page it is `git log --max-count=50`. Opening a commit adds `git log --max-count=1 <hash>`, `git diff-tree -r --root --no-commit-id --name-status <hash>` and `git diff-tree -r --root --no-commit-id --numstat <hash>`. Opening a file adds `git diff-tree -r -p --root --no-commit-id <hash> -- <path>`. A word a shell would read differently, such as a path with a space, is quoted for a POSIX shell.
- The backend decides the command shown. Each Git wrapper gives the Git interface function the arguments it runs and the arguments it shows, and the Git interface function sends a `git-command` task event with the `cd` line, the command and its duration for each `git` it runs, once that `git` has ended. The frontend only shows what it is sent.

## Acceptance criteria

- [x] The right sidebar shows the Git commands for the active page, and the most recent command run for that page.
- [x] Closing a pane does not remove a command. Moving to another page shows that page's commands.
- [x] Each command can be copied.
- [x] The Git interface function emits a standard Ziggy event with the formatted command line for each `git` it starts, and the help panel handles it. No wrapper or page builds its own list of commands.
- [x] `cd <repo>` is shown above the commands. Each command leaves out `-C`, `-z` and `--format` with separator characters.
- [x] Every command shown works when pasted into a terminal in the repo.
- [x] The backend measures how long each git command takes and sends it with the command.
- [x] The panel shows the duration of every command run for the current page, in a human readable form (for example "12 ms", "1.4 s").
- [x] The panel shows the total time of those commands.
- [x] The panel shows at most two commands for the current page: the ones that produced what the page shows.
- [x] The total duration covers every command run for the page.

## Open questions

None.
