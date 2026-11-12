# Git commands in the right sidebar

## Overview

Graft shows the Git commands behind each page, so a user learns the commands and can run them in a terminal. The right sidebar holds a panel headed "Git commands" with the commands the open page has run.

## Behaviour

- The panel shows the commands of the page that is open. Moving to another page shows that page's commands. A page that has run no Git commands, such as the About and Help pages, shows "This page has run no Git commands."
- Above the commands is `cd <repo>`, which moves a terminal into the repo the commands ran in.
- The commands are listed the most recent first. The most recent is marked "Most recent". A command run again moves to the top rather than showing twice. A page keeps its most recent commands, up to the limit `MAX_COMMANDS_PER_PAGE` in `frontend/src/lib/git-commands.ts` sets.
- Each command, and the `cd` line, has a copy button that copies it to the clipboard.
- Graft keeps the commands while it runs. Closing a pane, closing the sidebar or moving to another page removes none of them.
- A command shown works when pasted into a terminal after the `cd` line. It can differ from what Graft runs: Graft runs `git -C <repo>` and adds `-z` and a `--format` with separator characters to read git's output, and the command shown leaves those out. On the commits page it is `git log --max-count=50`. Opening a commit adds `git log --max-count=1 <hash>` and `git diff-tree -r --root --no-commit-id --name-status <hash>`. Opening a file adds `git diff-tree -r -p --root --no-commit-id <hash> -- <path>`. A word a shell would read differently, such as a path with a space, is quoted for a POSIX shell.
- The backend decides the command shown. Each Git wrapper gives the Git interface function the arguments it runs and the arguments it shows, and the Git interface function sends a `git-command` task event with the `cd` line and the command for each `git` it starts. The frontend only shows what it is sent.

## Acceptance criteria

- [x] The right sidebar shows the Git commands for the active page, and the most recent command run for that page.
- [x] Closing a pane does not remove a command. Moving to another page shows that page's commands.
- [x] Each command can be copied.
- [x] The Git interface function emits a standard Ziggy event with the formatted command line for each `git` it starts, and the help panel handles it. No wrapper or page builds its own list of commands.
- [x] `cd <repo>` is shown above the commands. Each command leaves out `-C`, `-z` and `--format` with separator characters.
- [x] Every command shown works when pasted into a terminal in the repo.

## Open questions

None.
