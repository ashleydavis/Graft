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
2. Check a top bar runs across the top of the window, holding only a menu button and the name "Graft" at its left, one button at its right and the breadcrumb trail between them: "test-repo", a chevron, then "About" in bold with a drop-down arrow.
3. Check the left sidebar runs down the left under the top bar, with a "Commits" link at its top and "Help" and "About" links at its bottom, each with an icon. Check the About link is highlighted.
4. Check the About page shows in the main content area, to the right of the left sidebar.
5. Check the right sidebar is closed: the main content area reaches the right edge of the window.
6. Click the "Commits" link in the left sidebar. Check the commits page shows in the main content area, the Commits link is highlighted and the trail reads "test-repo" then "Commits", both plain text.
7. Click the menu button in the top bar. Check the left sidebar slides narrower to a strip that shows only the icons.
8. Hover over each icon in the strip. Check its tooltip names it.
9. Click the About icon. Check the About page shows in the main content area.
10. Click the menu button again. Check the left sidebar slides wider and shows the names again.
11. Click the button at the right of the top bar. Check a right sidebar slides in from the right edge and the main content area narrows to make room.
12. Click the same button again. Check the right sidebar slides back out.
13. Hover over "test-repo" in the trail. Check its tooltip is "/tmp/graft/test-repo".
14. Click "Help" in the left sidebar. Check the Help page shows and the trail ends with "Help".
15. Click "Help" in the trail. Check a drop-down opens under it with a search box, "Help" ticked and "About".
16. Type "ab" in the search box. Check only "About" is listed. Type "zz". Check it says "No page matches "zz".".
17. Press Escape. Check the drop-down closes. Click "Help" in the trail again and check both pages are listed.
18. Click "Help" in the drop-down. Check the drop-down closes and the Help page still shows.
19. Click "Help" in the trail, then "About". Check the About page shows and the trail ends with "About".
20. Close the window.

## Expected result

Every page shows in the main content area, between the left sidebar and the right sidebar, under the top bar. The top bar's breadcrumb trail names the repo and the page shown. On the Help and About pages its drop-down switches between them. The menu button minimises and expands the left sidebar, its links work in both states and the button at the right of the top bar slides the right sidebar in and out.
