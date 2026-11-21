# About page

## Overview

The About page shows a user which app they are in, which version it is, what it is for, where to find out more and its licence. The left sidebar's About link opens it.

## Behaviour

- The left sidebar's About link and the breadcrumb trail's About option open the About page.
- The page opens with a header: Graft's icon on the left and beside it the heading "About Graft" with Graft's version under it.
- Graft's icon is a code branch on a square of the style guide's accent colour (violet) with rounded corners. The code branch is white in the light theme and dark violet in the dark theme.
- The version reads "Version dev", in the monospace font and the muted text colour. It comes from `frontend/src/lib/version.ts`, the one file that gives it.
- Under the header it shows what Graft is: "Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way."
- Under the description it shows the heading "Find out more" and under that a list of links, each opening in the system's web browser:
  - "Graft on GitHub": https://github.com/ashleydavis/Graft
  - "Playbook on GitHub": https://github.com/ashleydavis/playbook
  - "Ziggy on GitHub": https://github.com/ashleydavis/ziggy
  - "The Graft video series on YouTube": https://www.youtube.com/@CodeCapers/search?query=Graft
- Under the links it names Graft's licence, in the muted text colour: "Graft is released under the MIT licence."
- Graft's licence is in `LICENSE` at the repo root.
- The page shows text, the icon and the links only.
- The page's type, colours and spacing come from the Graft style guide's design tokens: the heading is the page title size, "Find out more" is the section heading size and the links take the accent colour. The page follows the light or dark theme Graft is in.

## Acceptance criteria

- [x] The left sidebar's About link opens the About page.
- [x] The page shows the heading "About Graft".
- [x] The page says what Graft is.
- [x] The page shows Graft's icon, a code branch on a violet square with rounded corners, beside the heading and the version.
- [x] The page shows Graft's version, which comes from `frontend/src/lib/version.ts` and is "dev".
- [x] The page links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube, under the heading "Find out more".
- [x] The page names the MIT licence. `LICENSE` at the repo root holds the MIT licence.
- [x] The page's type, colours and spacing follow the Graft style guide in the light and the dark theme.

## Open questions

None.
