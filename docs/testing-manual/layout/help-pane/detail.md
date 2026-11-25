# Help pane in the right sidebar: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

```bash
./scripts/test/create-test-repo.sh
```

Then build and run Graft with the command for your platform:

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

1. Wait for Graft's window to open on the welcome page. Click the button at the far right of the top bar. Check the right sidebar slides in with the Git commands panel at its top and under it, set off by a line, a pane headed "Help" with a question mark icon. Check it shows "Welcome" and "The page Graft starts on. Its Open repo button opens a local Git repo."
2. Choose File, then "Open repo", and choose `/tmp/graft/test-repo`. Check the Help pane shows "Repo details pane", what it shows, the keys Up, Down, Right, Enter and Escape as key caps, each with what it does, and a list of what a click does.
3. Click the repo details pane's "Commits" link. Check the Help pane still shows "Repo details pane", because the click leaves it active. Press Right. Check it shows "Commit pane" at once, with Up, Down, Left, Right, Enter and Escape and "Click a commit to open its details." first among the clicks.
4. Click the commit "Change the note", then press Right. Check the Help pane shows "Commit details pane". Click "notes.txt", then press Right. Check it shows "File pane" with only Left and Escape as keys.
5. Press Escape. Check it shows "Commit details pane". Click anywhere in the commit pane. Check it shows "Commit pane".
6. Press Escape twice to close the commit details pane and the commit pane. Check the Help pane shows "Repo details pane". Change `/tmp/graft/test-repo/notes.txt` in a text editor and save it, then click the repo details pane's "Commit" link and press Right. Check it shows "Changes pane" with the clicks to stage a file and to commit. Click "notes.txt" in the changes pane and press Right. Check it shows "File pane" with Left and Escape and the line on the diff showing staged changes for a file in the Staged list.
7. Compare each pane's keys and clicks with `docs/spec/repo-explorer/keys/detail.md`. Check every key listed does what the help shows for that pane.
8. Click "Help" in the left sidebar. Check the Help pane shows "Help" and "This page." Click "About". Check it shows "About" and "What Graft is, its version and where to find out more." Check each matches the page's entry under "Pages" on the Help page.
9. Choose the Dark theme in the top bar's theme menu. Check the Help pane is drawn in the dark colours, as the Git commands panel is. Make the window short and check the Help pane scrolls with the Git commands panel.

## Expected result

The right sidebar shows a Help pane under the Git commands panel. On the repo explorer page it shows the active pane's help, with its keys as key caps, and changes at once when another pane becomes active. On every other page it shows the page's name and the Help page's text for the page.
