# About page

## Overview

The About page shows a user which app they are in, which version it is, what it is for, where to find out more and its licence. The left sidebar's About link opens it.

## Behaviour

- The left sidebar's About link and the breadcrumb trail's About option open the About page.
- The page shows the heading "About Graft".
- Above the heading it shows Graft's icon: a code branch in a green circle.
- Under the heading it shows Graft's version: "Version dev". The version comes from `frontend/src/lib/version.ts`, the one file that gives it.
- Under the version it shows what Graft is: "Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way."
- Under the description it shows a list of links, each opening in the system's web browser:
  - "Graft on GitHub": https://github.com/ashleydavis/Graft
  - "Playbook on GitHub": https://github.com/ashleydavis/playbook
  - "Ziggy on GitHub": https://github.com/ashleydavis/ziggy
  - "The Graft video series on YouTube": https://www.youtube.com/@CodeCapers/search?query=Graft
- Under the links it names Graft's licence: "Graft is released under the MIT licence."
- Graft's licence is in `LICENSE` at the repo root.
- The page shows text, the icon and the links only.

## Acceptance criteria

- [x] The left sidebar's About link opens the About page.
- [x] The page shows the heading "About Graft".
- [x] The page says what Graft is.
- [x] The page shows Graft's icon, a code branch in a green circle.
- [x] The page shows Graft's version, which comes from `frontend/src/lib/version.ts` and is "dev".
- [x] The page links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube.
- [x] The page names the MIT licence. `LICENSE` at the repo root holds the MIT licence.

## Open questions

None.
