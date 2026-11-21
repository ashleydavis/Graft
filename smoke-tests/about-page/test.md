# about-page/test.sh

Smoke test of the About page. It starts the real app with remote control on, waits for the welcome page Graft starts on and opens the About page with the left sidebar's About link. The page, its heading "About Graft", Graft's version "Version dev", the sentence that describes Graft, its icon and the sentence that names the MIT licence all show. So do the "Find out more" heading and under it the links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh about-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
