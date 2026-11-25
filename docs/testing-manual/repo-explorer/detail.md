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

Create a test repo at `/tmp/graft/branches-repo` with main checked out, a branch other holding a commit only it reaches, a remote-tracking branch origin/remote-only holding a commit only it reaches, a branch empty pointing at the first commit and a stash:

```bash
./scripts/test/create-test-repo.sh /tmp/graft/branches-repo
```

```bash
git -C /tmp/graft/branches-repo switch --quiet --create other HEAD~1
```

```bash
git -C /tmp/graft/branches-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Other branch commit"
```

```bash
git -C /tmp/graft/branches-repo switch --quiet --create remote-only main
```

```bash
git -C /tmp/graft/branches-repo -c user.name="Ada Author" -c user.email=ada@example.com commit --quiet --allow-empty --message "Remote branch commit"
```

```bash
git -C /tmp/graft/branches-repo update-ref refs/remotes/origin/remote-only remote-only
```

```bash
git -C /tmp/graft/branches-repo switch --quiet main
```

```bash
git -C /tmp/graft/branches-repo branch --quiet -D remote-only
```

```bash
git -C /tmp/graft/branches-repo branch empty "$(git -C /tmp/graft/branches-repo rev-list --max-parents=0 HEAD)"
```

```bash
echo "A note to stash." > /tmp/graft/branches-repo/notes.txt
```

```bash
git -C /tmp/graft/branches-repo -c user.name="Ada Author" -c user.email=ada@example.com stash --quiet --message "Stashed note"
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

Create an empty repo at `/tmp/graft/empty-repo`, with no commits:

```bash
git init --quiet /tmp/graft/empty-repo
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
7. Choose File, then "Open repo", and choose `/tmp/graft/paging-repo`. Click the "Commits" link and check the list starts with "Commit 120". Scroll down the commit list. Check that before the list ends a row with a spinner and "Loading the commits." shows under the last commit for a moment, then more commits are added under it, and that scrolling on reaches "Add the readme" as the last row, with no loading row under it and "That is every commit." in grey text under it. Check "That is every commit." did not show while the loading row showed.
8. Click the button at the far right of the top bar to open the right sidebar. Check at most two Git commands are listed, the most recent at the top being `git log --no-show-signature --max-count=50 --skip=<count read> --branches --remotes HEAD --`, the read of a later page from every branch and HEAD, skipping the commits already read, and that "Total time:" is no shorter than the two listed added together, because it adds up the first page's `git log --no-show-signature --max-count=50 --branches --remotes HEAD --` too. Click the button again to close the sidebar.
9. Press Escape, then Enter, to close the commit pane and open it again, with the commit pane active. Hold Down. Check the selection moves down the commits, the list scrolls to keep the selected row in view, more pages are read as it nears the end and it stops on "Add the readme". Press Enter and check the commit details pane opens for "Add the readme".
10. Choose File, then "Open repo", and choose `/tmp/graft/merge-repo`. Click the "Commits" link and check the list starts with "Merge side". Scroll down the commit list to its end. Check every commit from "Side 30" and "Main 30" down to "Side 1" and "Main 1" is listed once, the side branch's and the main line's taking turns, and the list ends with "Add the readme". Open the right sidebar and check the most recent command is `git log --no-show-signature --max-count=50 --skip=50 --branches --remotes HEAD --`. Close the sidebar.
11. Choose File, then "Open repo", and choose `/tmp/graft/branches-repo`. Click the "Commits" link and check the list shows, newest first, "Remote branch commit" with an origin/remote-only badge, "Other branch commit" with an other badge, "Change the note" with the main badge, "Add the notes" with the v1.0 tag and "Add the readme" with an empty badge, each once, and no "Stashed note" or other stash commit. Open the right sidebar and check the most recent command is `git log --no-show-signature --max-count=50 --branches --remotes HEAD --`. Copy it and the `cd` line above it into a terminal and check it lists the same five commits in the same order. Close the sidebar.
12. Choose File, then "Open repo", and choose `/tmp/graft/signed-repo`. Click the "Commits" link and check the list starts with "Sign the notes", then "Change the note", with no error row. Click "Sign the notes" and check the commit details pane shows its title and hash, with no error.
13. Choose File, then "Open repo", and choose `/tmp/graft/empty-repo`. Click the "Commits" link and check the commit pane shows "There are no commits." in grey text, with no error row and no loading row.
14. Close the window and start Graft again. Press Ctrl+1 (Cmd+1 on macOS) on the welcome page. Check the breadcrumb trail ends with "Repo explorer" and the page shows only "No repo is open. Choose File, then Open repo, to open one."
15. Close the window.

## Expected result

The repo explorer page's commit pane lists the test repo's commits. The list covers every local branch, every remote-tracking branch and HEAD, so a commit only another branch reaches is listed with that branch's badge, and stashes are left out. For a repo with more commits than one page, the list reads the next page as it scrolls, with a loading row while it reads, until it ends at the first commit of every branch's history with "That is every commit." under it. A repo with no commits shows "There are no commits." and no error. Every page starts from every branch and HEAD and a later page skips the commits already read, so a repo with a merge lists the commits from both sides of the merge, each once. A repo with a signed commit and `log.showSignature=true` lists its commits and shows the signed commit's details with no error. The Down key moves the selection across the pages with the selected row kept in view. The left sidebar opens the repo explorer page and the About page. The breadcrumb trail names the repo explorer page. The page starts with its panes, or with the message that no repo is open.
