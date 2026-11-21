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

- File names are kebab-case, in TypeScript and Zig alike (`test-commands.ts`, `git-log.zig`).
- The frontend's `src/` splits into `pages/` (one directory per page, `pages/<page>/index.tsx`, with components only that page uses under `pages/<page>/components/`), `components/` (components more than one page uses) plus `lib/` (plain code that is not UI).
- The backend's message handlers, task handlers and menu live in `backend/src/lib/`. Each feature declares its own actions, menu items, messages and tasks in its file under `backend/src/features/`, and `backend/src/app.zig`, `backend/src/lib/actions.zig` and `backend/src/lib/menu.zig` build Graft's lists from them, one line per feature.
- Each frontend feature whose action works on every page registers its handler in a hook of its own under `frontend/src/components/` (such as `useOpenRepoAction`), and `AppLayout` calls one hook per feature.
- Every element a smoke test touches has a `data-id`.
- Icons come from the free version of Font Awesome.
- Styling uses MaterialUI components and Tailwind classes. Graft has no light/dark mode yet. Do not add one or choose a mode.
- The frontend talks to the backend only through `window.ziggy`.
- Code calls `window.ziggy` where it needs it. Never pass it, or a part of it, in as a parameter or prop. A test puts its fake on `window.ziggy` (`frontend/src/test/fake-ziggy.ts`).
- The code that came from the Ziggy template is Graft's own: change it the same way as the rest. Ziggy's own code is never patched.

## Implementation rules

These apply to every change.

- Keep it minimal.
- Minimize complexity.
- Don't overengineer.
- Keep it as simple as possible (the developer will say if they want it more complicated).
- Never copy the Graft UI mockup and never add its pages, buttons, menus or features to Graft unless a ticket asks for them. Graft grows one small piece at a time and may never have all the mockup's features.
