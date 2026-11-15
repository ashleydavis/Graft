# about-page/test.sh

Smoke test of the About page. It starts the real app with remote control on, and checks that the app opens on the About page: the page, its heading "About Graft", the sentence that says what Graft is and its icon all show.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh about-page
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads.
