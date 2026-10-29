# Graft user guide

Graft is a desktop Git client with a simple, intuitive UI. It follows the conventions of other Git clients and of GitHub's pages for commits and branches, so it is familiar from the first use.

## Installing Graft

Graft runs on Linux, Windows and macOS (Intel and Apple silicon). Each platform's package is attached to the GitHub release for that platform, under **Releases** on the repository's page:

- Linux: a `.deb` package and a zip. Graft needs GTK 3 and WebKitGTK 4.1, which the `.deb` installs with it.
- Windows: a zip and an `.msi` installer, which installs Graft for the current user with a Start menu shortcut. It needs no administrator rights.
- macOS: a `.dmg` and a zip, one of each for Intel and for Apple silicon. The app is not notarized.

Graft runs the `git` command, so Git must be installed and on `PATH`.

## Running Graft

Start Graft from your desktop's app menu, the Start menu or the Applications folder.

Several Graft windows can be open at once, for example one on each virtual desktop. Each window is a separate instance of Graft.

## Using Graft

Each feature of Graft has its own section here.

### About page

Graft opens on its About page, which shows Graft's name, its icon and what Graft is. Its **Commits** link opens the commits page.

### Commits page

The commits page lists the first page of the repo's commits, newest first: each commit's title, its author and the first seven characters of its hash. While Graft reads them the page says the commits are loading, and when git cannot read them the page says why. Its **About** link goes back to the About page.

Graft reads the repo at `/tmp/graft/test-repo`. `scripts/test/create-test-repo.sh` creates a test repo there.
