# repo-details-tags/test.sh

Smoke test of the tags in the repo details pane and the tag pane. It creates a test repo of its own in its temporary directory with `scripts/test/create-test-repo.sh`, which has the lightweight tag `v1.0`, and adds the annotated tag `v2.0` on the newest commit with real `git`, with the tagger Tia Tagger and the message "Release two" and "The second release.". It starts the real app with remote control on and opens the repo with the welcome page's Open repo button, through `open_repo_with_button`.

It checks the repo details pane's Tags heading lists `v1.0` and `v2.0`. It clicks `v1.0` and checks the tag pane opens, titled with the tag's name, showing the short hash and title of the commit the tag points at ("Add the notes") and no tagger. It clicks `v2.0` and checks the tag pane shows that tag in its place: its message's title and description, the commit "Change the note" and the tagger's name and email. It presses Escape and checks the tag pane closes, presses Up and Enter and checks the tag pane opens for `v1.0`, then clicks the tag pane's close button and checks it closes.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh repo-details-tags
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
