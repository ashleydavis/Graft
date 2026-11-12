# About page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, build and run Graft with the command for your platform:

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
2. Check the main content area shows the About page: a green circle with a code branch icon, the heading "About Graft" and under it the sentence "Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way."
3. Check the About page shows only the icon, the heading and the sentence: no repo is open, so there is no "Commits" link.
4. Choose File, then "Open repo", and choose any folder. Then click "About" in the left sidebar.
5. Check that under the sentence there is now a link, "Commits".
6. Close the window.

## Expected result

Graft opens straight on the About page, with its icon, heading and description. The link to the commits page shows once a repo is open.
