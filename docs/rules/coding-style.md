# Coding style

Graft follows the developer's global rules in https://github.com/ashleydavis/agent-config/tree/HEAD/rules. Load each one that applies to the change and follow it:

- `general.md`: every language.
- `typescript.md`: the frontend and any TypeScript script.
- `react.md`: the frontend's components and pages.
- `bun.md`: `package.json`, `bun.lock` and installs.
- `zig.md`: the backend and the Zig native apps.
- `writing.md`: comments, text the app displays, commit messages and docs.
- `commits.md`: commit messages.
- `debugging.md`: finding the cause of a bug.

The Git and Zig rules of this project are in [git.md](git.md) and [zig.md](zig.md).

## Project conventions

- File names are kebab-case, in TypeScript and Zig alike (`hello-world.ts`, `hello-world.zig`).
- The frontend's `src/` splits into `pages/` (one directory per page, `pages/<page>/index.tsx`, with components only that page uses under `pages/<page>/components/`), `components/` (components more than one page uses) plus `lib/` (plain code that is not UI).
- The backend's message handlers, task handlers and menu live in `backend/src/lib/` and are registered in `backend/src/app.zig`.
- Every element a smoke test touches has a `data-id`.
- Icons come from the free version of Font Awesome.
- Styling uses MaterialUI components and Tailwind classes. It supports light and dark mode.
- The frontend talks to the backend only through `window.ziggy`.
- The code that came from the Ziggy template is Graft's own: change it the same way as the rest. Ziggy's own code is never patched.

## Implementation rules

These apply to every change.

- Keep it minimal.
- Minimize complexity.
- Don't overengineer.
- Keep it as simple as possible (the developer will say if they want it more complicated).
- Never copy the Graft UI mockup and never add its pages, buttons, menus or features to Graft unless a ticket asks for them. Graft grows one small piece at a time and may never have all the mockup's features.
