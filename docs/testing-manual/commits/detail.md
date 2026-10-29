# Commits page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo Graft reads at `/tmp/graft/test-repo`:

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

1. Wait for Graft's window to open on the About page.
2. Click the "Commits" link on the About page, under its description.
3. Check the page shows the heading "Commits", a link "About" and a list of the test repo's commits, newest first: "Change the note", "Add the notes" and "Add the readme", each with the author "Ada Author" and the first seven characters of its hash.
4. Check the hashes match the ones `create-test-repo.sh` printed.
5. Click the "About" link on the commits page, under its heading, and check the About page shows again.
6. Close the window.

## Expected result

The commits page lists the test repo's commits, and the links change between the About page and the commits page.
