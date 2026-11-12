# theme-menu/test.sh

Smoke test of the theme menu in the top bar. It starts the real app with remote control on and the light theme, opens the About page with the left sidebar's About link and checks the menu's button starts on Light. It then opens the menu and chooses Dark, then System, then Light. After each choice it checks the menu has closed, the button shows only that theme's icon and Graft's config file holds the new setting. The About page stays in the main content area throughout.

## How it is invoked

`smoke-tests/run.sh` runs it with every other smoke test, through `bun run test:smoke`. To run it alone:

```bash
bash smoke-tests/run-desktop.sh theme-menu
```

## Arguments

It takes no arguments. `run.sh` gives it the platform, the remote control server and its own temporary directory through the environment, which `../lib/common.sh` reads. The test sets `ZIGGY_THEME` to `light` itself, so it starts on Light whatever the run says.
