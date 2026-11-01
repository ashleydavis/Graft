# test/create-test-repo.sh

Creates the test repo Graft reads, in a known state. The repo has a few commits on `main` with fixed authors, committers, dates and messages, one of them tagged `v1.0` and one with a description, so every run makes the same commits with the same hashes. Git runs with an empty global config, the system config switched off and an empty template, so the commits come out the same on every machine.

The app reads the repo at `/tmp/graft/test-repo` unless a smoke test gives it the path of its own test repo. Each smoke test creates its own repo with this script, in its own temporary directory, so each smoke test running in parallel reads a repo of its own.

The script marks each repo it makes. Run again on the same path, it deletes the repo it made before and makes it again. It refuses a path that exists unless it made it, so it deletes only the repos it made.

## How it is invoked

```bash
./scripts/test/create-test-repo.sh
./scripts/test/create-test-repo.sh <path>
```

With no argument it prints its usage and creates the repo at `/tmp/graft/test-repo`, the repo the app reads by default.

## Arguments

- `path` (optional): the directory to create the test repo in. It must not exist, or must be a test repo this script made. Without it the repo is created at `/tmp/graft/test-repo`.

It exits with 2 when given more than one argument and with 1 when the path exists and was not made by it.
