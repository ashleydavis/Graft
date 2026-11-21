# Graft

An app built on [Ziggy](https://github.com/ashleydavis/ziggy), with JavaScript/TypeScript, HTML and CSS for the frontend and Zig for everything else.

The same code-base builds for Linux, Windows and macOS, using each platform's system web view for the frontend. Its frontend opens on the welcome page with no repo open, which shows Graft's mark, its name, a line describing Graft and an Open repo button. The About page shows Graft's version, links and licence. The welcome page's button or File, Open repo picks a repo's folder and opens it on the repo explorer page, which shows the repo's name and path, a Commits link that lists the repo's newest commits and a Commit link that lists the changed files to stage and unstage. The left sidebar then links to the repo explorer page. The backend reads the commits with `git log` in a background task.

Check Ziggy's [glossary](https://github.com/ashleydavis/ziggy/blob/main/docs/glossary.md) to understand the jargon.

## Set up, test and run

Install what your platform needs first: see Ziggy's [Dependencies](https://github.com/ashleydavis/ziggy/blob/main/docs/user-guide/dependencies.md).

```bash
bun run setup       # Once per machine, only to build for Windows.

bun run compile     # Type-checks the frontend.
bun run test        # Runs the frontend's unit tests.
bun run test:zig    # Builds the backend and runs its unit tests.
bun run test:smoke  # Builds your app and runs its smoke tests in a hidden window.

bun run linux       # Builds and runs your app on Linux.
bun run windows     # Builds and runs your app on Windows.
bun run macos       # Builds and runs your app on macOS.

bun run dev         # Runs the frontend in your browser with dev mode, which reloads as you save.
```

## Where things are

- `frontend/`: the frontend (TypeScript, React, TanStack Router, MaterialUI, Tailwind and Font Awesome), which runs in the system web view.
- `backend/`: the Zig backend, with the Git interface, its task handlers and menu.
- `native/`: the native project for each platform.
- `scripts/`: the scripts to set up, build, run and package the app, each with a markdown file beside it.
- `smoke-tests/`: the smoke tests, which drive the real app.
- `.github/workflows/`: the GitHub Actions workflows that test the app and publish a release for each platform.

Everything else is in Ziggy's [user guide](https://github.com/ashleydavis/ziggy/blob/main/docs/user-guide.md).
