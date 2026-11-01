# Layout: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo Graft reads:

```bash
./scripts/test/create-test-repo.sh
```

Then build and run Graft with the command for your platform:

```bash
bun run linux
```

```bash
bun run windows
```

```bash
bun run macos
```

## Steps

1. Wait for Graft's window to open.
2. Check a top bar runs across the top of the window, holding only a menu button and the name "Graft" at its left and one button at its right.
3. Check the left sidebar runs down the left under the top bar, with a "Commits" link at its top and an "About" link at its bottom, each with an icon, and that the About link is highlighted.
4. Check the About page shows in the main content area, to the right of the left sidebar.
5. Check the right sidebar is closed: the main content area reaches the right edge of the window.
6. Click the "Commits" link in the left sidebar. Check the commits page shows in the main content area and the Commits link is highlighted.
7. Click the menu button in the top bar. Check the left sidebar slides narrower to a strip that shows only the icons.
8. Hover over each icon in the strip. Check its tooltip names it.
9. Click the About icon. Check the About page shows in the main content area.
10. Click the menu button again. Check the left sidebar slides wider and shows the names again.
11. Click the button at the right of the top bar. Check a right sidebar slides in from the right edge and the main content area narrows to make room.
12. Click the same button again. Check the right sidebar slides back out.
13. Close the window.

## Expected result

Every page shows in the main content area, between the left sidebar and the right sidebar, under the top bar. The menu button minimises and expands the left sidebar, its links work in both states and the button at the right of the top bar slides the right sidebar in and out.
