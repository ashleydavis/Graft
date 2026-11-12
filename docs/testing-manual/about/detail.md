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

1. Wait for Graft's window to open on the welcome page.
2. Click About in the left sidebar. Check the main content area shows the About page: a green circle with a code branch icon, the heading "About Graft", under it "Version dev" and under that the sentence "Graft is a desktop Git client with a simple, intuitive UI that supports your own process instead of getting in the way."
3. Check that under the sentence there are the links "Graft on GitHub", "Playbook on GitHub", "Ziggy on GitHub" and "The Graft video series on YouTube".
4. Check that under the links the page says "Graft is released under the MIT licence."
5. Click "Graft on GitHub". Check your web browser opens https://github.com/ashleydavis/Graft and Graft's window still shows the About page.
6. Click "Playbook on GitHub". Check your web browser opens https://github.com/ashleydavis/playbook.
7. Click "Ziggy on GitHub". Check your web browser opens https://github.com/ashleydavis/ziggy.
8. Click "The Graft video series on YouTube". Check your web browser opens the Graft videos on YouTube.
9. Check the About page shows only the icon, the heading, the version, the sentence, the links and the licence.
10. Close the window.

## Expected result

The left sidebar's About link opens the About page, with its icon, heading, version, description, links and licence. Each link opens in the web browser.
