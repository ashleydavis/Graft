# signed-commits/test.sh

Smoke test of the repo explorer page reading a repo with a signed commit when the repo's git config has `log.showSignature=true`, which makes `git log` add signature text to its output unless it is given `--no-show-signature`. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, makes an SSH key in the same directory with `ssh-keygen`, adds an empty commit, "Sign the notes", signed with that key through `gpg.format=ssh`, and sets `log.showSignature=true` in the repo's config. It checks the newest commit is signed and that a plain `git log` in the repo adds signature text, so the setup does reproduce the problem. It then starts the real app with remote control on, opens the repo with the welcome page's Open repo button, through `open_repo_with_button`, and opens the commit pane with `open_commit_pane`. It checks the signed commit and the commit before it, "Change the note", are listed and the commit pane shows no error. It clicks the signed commit, checks the commit details pane names its short hash, clicks the "Commit details" row and checks the "Commit details" pane shows its title, hash and parent and no error.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh signed-commits
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
