# Layout: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

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

1. Wait for Graft's window to open on the welcome page. Check the left sidebar has no "Repo explorer" link and the breadcrumb trail is empty, because no repo is open. Choose File, then "Open repo", choose `/tmp/graft/test-repo`, then click "About" in the left sidebar.
2. Check a top bar runs across the top of the window, holding only a menu button and the name "Graft" at its left, two buttons at its right with "Ctrl+/: Show hotkeys" just before them and the breadcrumb trail between: "test-repo", a chevron, then "About" with a drop-down arrow, larger and bolder than "test-repo", like the name "Graft", and still inside the top bar.
3. Check the left sidebar runs down the left under the top bar, with a "Repo explorer" link at its top and "Help" and "About" links at its bottom, each with an icon. Check the About link is highlighted.
4. Check the About page shows in the main content area, to the right of the left sidebar.
5. Check the right sidebar is closed: the main content area reaches the right edge of the window.
6. Click the "Repo explorer" link in the left sidebar. Check the repo explorer page shows in the main content area, the Repo explorer link is highlighted and the trail reads "test-repo" then "Repo explorer", both plain text, with "Repo explorer" larger and bolder than "test-repo", so the top bar reads "Graft", "test-repo", then "Repo explorer".
7. Click the menu button in the top bar. Check the left sidebar slides narrower to a strip that shows only the icons.
8. Hover over each icon in the strip. Check its tooltip names it.
9. Click the About icon. Check the About page shows in the main content area.
10. Click the menu button again. Check the left sidebar slides wider and shows the names again.
11. Click the button at the far right of the top bar. Check a right sidebar slides in from the right edge and the main content area narrows to make room.
12. Click the same button again. Check the right sidebar slides back out.
13. Hover over "test-repo" in the trail. Check its tooltip is "/tmp/graft/test-repo".
14. Click "Help" in the left sidebar. Check the Help page shows and the trail ends with "Help".
15. Click "Help" in the trail. Check a drop-down opens under it with a search box, "Help" highlighted and "About".
16. Type "ab" in the search box. Check only "About" is listed. Type "zz". Check it says "No page matches "zz".".
17. Press Escape. Check the drop-down closes. Click "Help" in the trail again and check both pages are listed.
18. Click "Help" in the drop-down. Check the drop-down closes and the Help page still shows.
19. Click "Help" in the trail, then "About". Check the About page shows and the trail ends with "About".
20. Hover over the button to the left of the right sidebar's button. Check it shows a half filled circle with a small chevron and its tooltip is "Theme: System. Choose a theme".
21. Click it. Check a menu opens under it, headed "Theme", with rows for Light, Dark and System, each with its icon and a line saying what it does, and System highlighted.
22. Press Escape. Check the menu closes and the theme does not change.
23. Open the menu and choose Light. Check the menu closes, the button shows a sun and Graft is drawn in light colours.
24. Open the menu and choose Dark. Check the button shows a moon and Graft is drawn in dark colours: a dark background with light text, in the top bar, both sidebars, the main content area and the menu itself.
25. Open the menu and choose System. Check the button shows the half filled circle and Graft is drawn in the system's theme. Change the system's theme between light and dark and check Graft follows it.
26. Choose Dark from the menu, then close the window.
27. Start Graft again. Check the window is dark grey from the start, apart from the white splash screen, and the theme menu's button shows the moon.
28. Choose System from the menu, and close the window.
29. Start Graft again. Click the menu button in the top bar to minimise the left sidebar, and click the button at the far right of the top bar to open the right sidebar. Close the window.
30. Start Graft again. Check the left sidebar is minimised to its strip of icons and the right sidebar is open.
31. Click the menu button to expand the left sidebar and click the right sidebar's button to close it. Close the window.
32. Start Graft again. Check the left sidebar is expanded and the right sidebar is closed.

## Expected result

Every page shows in the main content area, between the left sidebar and the right sidebar, under the top bar.

The top bar's breadcrumb trail names the open repo and the page shown, with the page's step larger and bolder as its title. On the Help and About pages its drop-down switches between them.

The menu button minimises and expands the left sidebar, and its links work in both states. The button at the far right of the top bar slides the right sidebar in and out.

The theme menu moves Graft between light, dark and the system's theme, highlights the one in use, and Graft starts on the theme last picked.

Graft starts with the left sidebar minimised or expanded and the right sidebar open or closed, as they were left when it last closed.
