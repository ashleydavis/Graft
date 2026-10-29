# Layout

## Overview

Every page of Graft shows in the same layout, so a user always finds the same things in the same place. A top bar runs across the top of the window. Under it, from left to right, are the left sidebar, the main content area and the right sidebar.

## Behaviour

- The top bar runs across the top of the window. At its left is a menu button and next to it the name "Graft". At its right is the button for the right sidebar. Between them, set off by a divider, is the breadcrumb trail. It holds only these.
- The breadcrumb trail says where the user is. Every page has one. It starts with the repo Graft reads, shown by its folder's name with the repo's full path in its tooltip. It ends with the page being shown, in bold. A chevron separates the steps.
- A step with sibling pages to switch to is a drop-down: a click opens a list of its siblings with a search box that narrows them by name and says "No page matches" when none does. The list ticks the page being shown. Picking another page opens it. Picking the page being shown only closes the list. A step with no page to switch to is plain text.
- Graft reads one repo, so the repo step is plain text. The commits page is the only page about the repo, so its trail is the repo, then "Commits", both plain text. The Help and About pages are the pages about the app, so the trail of each is the repo, then a drop-down of Help and About.
- A step longer than 18 characters is cut to 17 and an ellipsis. Its tooltip holds its full text.
- The left sidebar runs down the left of the window, under the top bar. It holds a "Commits" link to the commits page at its top. At its bottom it holds a "Help" link to the Help page and an "About" link to the About page. Each link has an icon. The link to the page being shown is highlighted.
- The left sidebar is expanded when Graft starts: each link shows its icon and its name.
- The top bar's menu button minimises the left sidebar to a thin strip that shows each link's icon only, and expands it again. The links work in both states. Each link's name shows as its tooltip.
- The main content area fills the space between the sidebars and shows the current page: the About page, the commits page or the Help page.
- The right sidebar is at the right of the window, under the top bar. It is closed when Graft starts. The top bar's button for it slides it in from the right edge and slides it back out. It is empty.
- Each button's tooltip says what a click does next: "Minimise the left sidebar" or "Expand the left sidebar", "Open the right sidebar" or "Close the right sidebar".

## Acceptance criteria

- [x] The app has a top bar, a left sidebar, a right sidebar and a main content area, laid out with the top bar across the top and the left sidebar, main content area and right sidebar side by side under it.
- [x] The About and commits pages show in the main content area.
- [x] The left sidebar starts expanded, and the top bar's menu button minimises it to a strip of icons and expands it again.
- [x] The left sidebar links to the commits page, the Help page and the About page, in both states.
- [x] The right sidebar starts closed, and the top bar's button slides it in and out.
- [x] The top bar and sidebars hold no menu items or buttons for features Graft does not have.
- [x] The top bar shows the breadcrumb trail of every page, starting with the repo and ending with the page shown.
- [x] The About and Help pages' trails end with a drop-down of Help and About that opens the page picked. The commits page's trail is plain text.

## Open questions

None.
