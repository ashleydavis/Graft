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
2. Check the window shows the About page: a green circle with a code branch icon, the heading "About Graft" and under it the sentence "Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way."
3. Check the page shows only the icon, the heading and the sentence.
4. Close the window.

## Expected result

Graft opens straight on the About page, with its icon, heading and description.
