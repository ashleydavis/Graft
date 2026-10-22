# Documentation

## Required documents

These must exist and stay in sync with the spec.

- `CLAUDE.md`: what Graft is, its stack, constraints, run and test commands and configuration.
- `docs/setup.md`: how to set up the project and a worktree.
- `docs/development.md`: how to run, test and add a feature.
- `docs/architecture.md`: the system's parts, how they fit together and the design decisions behind them.
- `docs/user-guide.md`: user-facing guide.
- `docs/spec/`: what Graft does, feature by feature.
- `docs/testing-manual/`: the manual test steps for each feature, mirroring the spec.

## Documentation rules

These apply to every change.

- Always update the spec and testing manual when behaviour changes.
- Keep the docs and the testing manual in sync with every code change. Keep the required documents above current with every change that affects them.
- Every testing manual `detail.md` is self-contained, with the startup commands in fenced code blocks.
- No doc mentions other projects. Ziggy, which Graft is built on, is the exception.
- Every shell script has a markdown file beside it, named after the script, saying what it is for, how it is invoked and what each argument means.
