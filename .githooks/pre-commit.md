# pre-commit

The Git pre-commit hook. Before each commit it runs `scripts/test-everything.sh`, which runs only the checks whose watched files changed. It refuses the commit when one fails. A commit whose changes no check watches, such as a docs-only change, runs no checks.

## Usage

Git runs it before each commit once `scripts/install-hooks.sh install` has linked it into the repository's hooks directory. It takes no arguments.

## Behaviour

- Runs from the top of the working tree being committed, so a commit in a git worktree checks that worktree.
- Clears the `GIT_INDEX_FILE`, `GIT_DIR`, `GIT_WORK_TREE` and `GIT_PREFIX` variables Git sets for hooks, so tests that run `git` in temporary repos do not act on this repository.
- Runs the checks through `mise exec` when mise is installed, so they use the versions `mise.toml` locks.
- Exits non-zero when a check fails, which makes Git refuse the commit. It fixes, stages and changes nothing.
