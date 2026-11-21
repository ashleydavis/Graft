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
2. Click About in the left sidebar. Check the main content area shows the About page: a violet square with rounded corners holding a code branch icon, and beside it the heading "About Graft" with "Version dev" under it in a monospace font. Under them check it shows the sentence "Graft is a simple intuitive Git user-interface to streamline your process instead of getting in your way".
3. Check that under the sentence there is the heading "Find out more" and under it the links "Graft on GitHub", "Playbook on GitHub", "Ziggy on GitHub" and "The Graft video series on YouTube", in violet and underlined.
4. Check that under the links the page says "Graft is released under the MIT licence."
5. Click "Graft on GitHub". Check your web browser opens https://github.com/ashleydavis/Graft and Graft's window still shows the About page.
6. Click "Playbook on GitHub". Check your web browser opens https://github.com/ashleydavis/playbook.
7. Click "Ziggy on GitHub". Check your web browser opens https://github.com/ashleydavis/ziggy.
8. Click "The Graft video series on YouTube". Check your web browser opens the Graft videos on YouTube.
9. Check the About page shows only the icon, the heading, the version, the sentence, the "Find out more" heading, the links and the licence.
10. Pick Dark from the theme menu in the top bar. Check the About page turns dark, with light text, and the icon, headings, version, links and licence all still read clearly.
11. Close the window.

## Expected result

The left sidebar's About link opens the About page, with its icon, heading, version, description, "Find out more" heading, links and licence, in the light and the dark theme. Each link opens in the web browser.
