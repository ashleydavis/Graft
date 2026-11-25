# commit-file-literal-path/test.sh

Smoke test of a file's diff for a path git could read as a pattern. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, then commits `foo[1].txt` and `foo1.txt`, each with a line of its own. It starts the real app with remote control on, opens the right sidebar, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, opens the commit pane through `open_commit_pane` and clicks the newest commit, which lists both files. It clicks `foo[1].txt` and checks the file pane shows its line and not the line of `foo1.txt`, which a path read as a pattern would also match. It presses Right to make the file pane active and checks the help panel shows `git diff-tree -r -p --root --no-commit-id <hash> -- 'foo[1].txt'`, the path as the user would type it, without `:(literal)`.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh commit-file-literal-path
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
