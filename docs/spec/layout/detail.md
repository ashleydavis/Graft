# Layout

## Overview

Every page of Graft shows in the same layout, so a user always finds the same things in the same place. A top bar runs across the top of the window. Under it, from left to right, are the left sidebar, the main content area and the right sidebar.

## Behaviour

- The top bar runs across the top of the window. At its left is a menu button and next to it the name "Graft". At its right is the theme menu's button and then the button for the right sidebar. Between them, set off by a divider, is the breadcrumb trail. It holds only these.
- The breadcrumb trail says where the user is. Every page has one. While a repo is open it starts with that repo, shown by its folder's name with the repo's full path in its tooltip. While no repo is open it starts with the page. It ends with the page being shown, in the medium weight. A chevron separates the steps.
- A step with sibling pages to switch to is a drop-down: a click opens a list of its siblings with a search box that narrows them by name and says "No page matches" when none does. The list marks the page being shown with the selected colour. Picking another page opens it. Picking the page being shown only closes the list. A step with no page to switch to is plain text.
- Graft has one repo open at a time, so the repo step is plain text. The commits page is the only page about the repo, so its trail is the repo, then "Commits", both plain text. The Help and About pages are the pages about the app, so the trail of each is the repo, then a drop-down of Help and About. The welcome page's trail is the repo alone, so it is empty while no repo is open.
- A step longer than 18 characters is cut to 17 and an ellipsis. Its tooltip holds its full text.
- The left sidebar runs down the left of the window, under the top bar. It holds a "Commits" link to the commits page at its top, shown only while a repo is open. At its bottom it holds a "Help" link to the Help page and an "About" link to the About page. Each link has an icon. The link to the page being shown is highlighted.
- The left sidebar is expanded the first time Graft starts: each link shows its icon and its name.
- The top bar's menu button minimises the left sidebar to a thin strip that shows each link's icon only, and expands it again. The links work in both states. Each link's name shows as its tooltip.
- The main content area fills the space between the sidebars and shows the current page: the welcome page, the About page, the commits page or the Help page.
- The right sidebar is at the right of the window, under the top bar. It is closed the first time Graft starts. The top bar's button for it slides it in from the right edge and slides it back out. It shows the Git commands the open page has run (see [git-commands](git-commands/detail.md)).
- The theme menu picks the colours Graft is drawn in: Light, Dark or System, which follows the system's theme and changes with it. Its button shows the theme in use as an icon, a sun for Light, a moon for Dark and a half filled circle for System, with a small chevron that marks it as a drop-down. A click opens the menu under the button, aligned to its right edge. The menu is headed "Theme" and has a row for each setting, in the order Light, Dark, System. Each row shows the setting's icon, its name and a line saying what it does: "Light colours all the time", "Dark colours all the time" and "Follows your system's theme". The setting in use is marked with the selected colour. Choosing a row closes the menu and changes the theme. Clicking outside the menu or pressing Escape closes it and changes nothing. Graft starts on System. The choice is saved as `theme` in Graft's config file, so the next run starts on it, and a change to that setting while Graft runs changes the theme at once.
- Whether the left sidebar is minimised and whether the right sidebar is open are saved in Graft's state file, as `sidebar.left.minimised` and `sidebar.right.open`, each time the top bar's buttons change them. Graft starts with both sidebars as they were left. A missing or unreadable value leaves the left sidebar expanded and the right sidebar closed.
- Each button's tooltip says what a click does next: "Minimise the left sidebar" or "Expand the left sidebar", "Open the right sidebar" or "Close the right sidebar", and for the theme menu's button the theme in use, such as "Theme: System. Choose a theme".

## Acceptance criteria

- [x] The app has a top bar, a left sidebar, a right sidebar and a main content area, laid out with the top bar across the top and the left sidebar, main content area and right sidebar side by side under it.
- [x] The About and commits pages show in the main content area.
- [x] The left sidebar starts expanded, and the top bar's menu button minimises it to a strip of icons and expands it again.
- [x] The left sidebar links to the commits page, the Help page and the About page, in both states. The commits page link shows only while a repo is open.
- [x] The right sidebar starts closed, and the top bar's button slides it in and out.
- [x] The top bar and sidebars hold no menu items or buttons for features Graft does not have.
- [x] The top bar shows the breadcrumb trail of every page, starting with the open repo, when there is one, and ending with the page shown.
- [x] The About and Help pages' trails end with a drop-down of Help and About that opens the page picked. The commits page's trail is plain text.
- [x] The top bar's theme menu starts on System and offers Light, Dark and System, each with its icon and what it does, marks the one in use and draws Graft in light or dark colours to match the choice, and on System follows the system's theme.
- [x] The theme setting is saved in Graft's config file, and Graft starts on the saved setting.
- [x] Whether the left sidebar is minimised and whether the right sidebar is open are saved in Graft's state file, and Graft starts with both as they were left.
- [x] The window and page are the style guide's background colour, `--color-bg` in `graft.css` (`#FAFAFA` in the light theme and `#09090B` in the dark theme), from the first paint.

## Open questions

None.
