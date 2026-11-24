# Repo explorer page: manual test steps

## Start Graft

From the repo root, after the setup in `docs/setup.md`, create the test repo at `/tmp/graft/test-repo` to open in Graft:

```bash
./scripts/test/create-test-repo.sh
```

Create a second test repo at `/tmp/graft/paging-repo` with more commits than one page of the commit list, by adding empty commits to a copy of the test repo:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/paging-repo
```

```bash
for number in $(seq 1 120); do git -C /tmp/graft/paging-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Commit $number"; done
```

Create a test repo at `/tmp/graft/merge-repo` with a merge and more commits than one page of the commit list. The side branch's commits are dated between the main line's, so git log lists one from each side in turn:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/merge-repo
```

```bash
git -C /tmp/graft/merge-repo switch --quiet --create side
```

```bash
for number in $(seq 1 30); do GIT_COMMITTER_DATE="@$((1767484800 + number * 120 - 60)) +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Side $number"; done
```

```bash
git -C /tmp/graft/merge-repo switch --quiet main
```

```bash
for number in $(seq 1 30); do GIT_COMMITTER_DATE="@$((1767484800 + number * 120)) +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Main $number"; done
```

```bash
GIT_COMMITTER_DATE="@1767488460 +0000" git -C /tmp/graft/merge-repo -c user.name="Ada Author" -c user.email=ada@example.com merge --quiet --no-ff --no-edit --message "Merge side" side
```

Create another test repo at `/tmp/graft/signed-repo` whose newest commit is signed, with `log.showSignature=true` in its config, which makes `git log` add signature text to its output. Make an SSH key to sign with (if `/tmp/graft/signing-key` is there from an earlier run, answer `n` to keep it):

```bash
./scripts/test/create-test-repo.sh /tmp/graft/signed-repo
```

```bash
ssh-keygen -q -t ed25519 -N "" -C graft-test -f /tmp/graft/signing-key
```

```bash
git -C /tmp/graft/signed-repo -c user.name="Ada Author" -c user.email=ada@example.com -c gpg.format=ssh -c user.signingkey=/tmp/graft/signing-key commit --quiet --allow-empty --gpg-sign --message "Sign the notes"
```

```bash
git -C /tmp/graft/signed-repo config log.showSignature true
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

1. Wait for Graft's window to open on the welcome page.
2. Choose File, then "Open repo", and choose `/tmp/graft/test-repo`.
3. Check the breadcrumb trail in the top bar ends with "Repo explorer" and the page starts with the repo details pane, alone, at its top. Click its "Commits" link and check the commit pane opens to its right with a list of the test repo's commits, newest first: "Change the note", "Add the notes" and "Add the readme", each with the author "Ada Author", its date and the first seven characters of its hash.
4. Check the hashes match the ones `create-test-repo.sh` printed.
5. Click "About" in the left sidebar and check the About page shows.
6. Click "Repo explorer" in the left sidebar, then the repo details pane's "Commits" link, and check the commit pane shows the same commits.
7. Choose File, then "Open repo", and choose `/tmp/graft/paging-repo`. Click the "Commits" link and check the list starts with "Commit 120". Scroll down the commit list. Check that before the list ends a row with a spinner and "Loading the commits." shows under the last commit for a moment, then more commits are added under it, and that scrolling on reaches "Add the readme" as the last row, with no loading row under it.
8. Click the button at the far right of the top bar to open the right sidebar. Check at most two Git commands are listed, the most recent at the top being `git log --no-show-signature --max-count=50 --skip=<count read> <hash>`, the read of a later page from the hash of "Commit 120", the first commit listed, skipping the commits already read, and that "Total time:" is no shorter than the two listed added together, because it adds up the first page's `git log --no-show-signature --max-count=50` too. Click the button again to close the sidebar.
9. Press Escape, then Enter, to close the commit pane and open it again, with the commit pane active. Hold Down. Check the selection moves down the commits, the list scrolls to keep the selected row in view, more pages are read as it nears the end and it stops on "Add the readme". Press Enter and check the commit details pane opens for "Add the readme".
10. Choose File, then "Open repo", and choose `/tmp/graft/merge-repo`. Click the "Commits" link and check the list starts with "Merge side". Scroll down the commit list to its end. Check every commit from "Side 30" and "Main 30" down to "Side 1" and "Main 1" is listed once, the side branch's and the main line's taking turns, and the list ends with "Add the readme". Open the right sidebar and check the most recent command is `git log --no-show-signature --max-count=50 --skip=50 <hash>`, where the hash is the one of "Merge side". Close the sidebar.
11. Choose File, then "Open repo", and choose `/tmp/graft/signed-repo`. Click the "Commits" link and check the list starts with "Sign the notes", then "Change the note", with no error row. Click "Sign the notes" and check the commit details pane shows its title and hash, with no error.
12. Close the window and start Graft again. Press Ctrl+1 (Cmd+1 on macOS) on the welcome page. Check the breadcrumb trail ends with "Repo explorer" and the page shows only "No repo is open. Choose File, then Open repo, to open one."
13. Close the window.

## Expected result

The repo explorer page's commit pane lists the test repo's commits. For a repo with more commits than one page, the list reads the next page as it scrolls, with a loading row while it reads, until it ends at the repo's first commit. Every page after the first starts from the first commit listed and skips the commits already read, so a repo with a merge lists the commits from both sides of the merge, each once. A repo with a signed commit and `log.showSignature=true` lists its commits and shows the signed commit's details with no error. The Down key moves the selection across the pages with the selected row kept in view. The left sidebar opens the repo explorer page and the About page. The breadcrumb trail names the repo explorer page. The page starts with its panes, or with the message that no repo is open.
