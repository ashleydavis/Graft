# Layout

## Overview

Every page of Graft shows in the same layout, so a user always finds the same things in the same place. A top bar runs across the top of the window. Under it, from left to right, are the left sidebar, the main content area and the right sidebar.

## Behaviour

- The top bar runs across the top of the window. At its left is a menu button and next to it the name "Graft". At its right is the button for the right sidebar. It holds only these.
- The left sidebar runs down the left of the window, under the top bar. It holds a link to the commits page, named "Commits", at its top and a link to the About page, named "About", at its bottom. Each link has an icon. The link to the page being shown is highlighted.
- The left sidebar is expanded when Graft starts: each link shows its icon and its name.
- The top bar's menu button minimises the left sidebar to a thin strip that shows each link's icon only, and expands it again. The links work in both states. Each link's name shows as its tooltip.
- The main content area fills the space between the sidebars and shows the current page: the About page or the commits page.
- The right sidebar is at the right of the window, under the top bar. It is closed when Graft starts. The top bar's button for it slides it in from the right edge and slides it back out. It is empty.
- Each button's tooltip says what a click does next: "Minimise the left sidebar" or "Expand the left sidebar", "Open the right sidebar" or "Close the right sidebar".

## Acceptance criteria

- [x] The app has a top bar, a left sidebar, a right sidebar and a main content area, laid out with the top bar across the top and the left sidebar, main content area and right sidebar side by side under it.
- [x] The About and commits pages show in the main content area.
- [x] The left sidebar starts expanded, and the top bar's menu button minimises it to a strip of icons and expands it again.
- [x] The left sidebar links to the commits page and the About page, in both states.
- [x] The right sidebar starts closed, and the top bar's button slides it in and out.
- [x] The top bar and sidebars hold no menu items or buttons for features Graft does not have.

## Open questions

None.
