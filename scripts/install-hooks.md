# install-hooks.sh

Installs `.githooks/pre-commit` as the repository's Git pre-commit hook. Git runs hooks only from the clone's own hooks directory, which is not under version control, so each clone runs this once.

## Usage

`bash scripts/install-hooks.sh install`, from anywhere in the checkout.

## Arguments

- `install`: links the hook into the hooks directory. With no argument, the script prints its usage.

## Behaviour

- Makes `<git common dir>/hooks/pre-commit` a link to `.githooks/pre-commit` in this checkout. Every worktree of the repository shares that hooks directory, so one install covers them all.
- Changes no Git configuration.
- Replaces an earlier link, so it can be run again. Stops with an error, changing nothing, when the hooks directory already has a pre-commit hook that is not a link.
