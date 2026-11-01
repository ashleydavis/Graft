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

### Layout

Every page shows in the main content area in the middle of the window. A top bar runs across the top, with Graft's name and the breadcrumb trail, which names the repo and the page you are on. On the Help and About pages, click the page's name in the trail to switch between them. The left sidebar has a link to each page: **Commits** at the top and **Help** and **About** at the bottom. The menu button at the left of the top bar minimises the left sidebar to a strip of icons and expands it again. The button at the right of the top bar slides the right sidebar in and out.

### About page

Graft opens on its About page, which shows Graft's name, its icon and what Graft is. Its **Commits** link opens the commits page.

### Help page

The Help page says how to move between Graft's pages.

### Commits page

The commits page lists the first page of the repo's commits, newest first: each commit's title, its author and the first seven characters of its hash. While Graft reads them the page says the commits are loading, and when git cannot read them the page says why. Its **About** link goes back to the About page.

The commit list is the first of the page's columns. Click a commit to open a column to its right with the commit's details and the files it changed. Click one of those files to open another column to the right with the file's diff in that commit. Each new column has a **Close** button and closing the commit's column closes the file's column with it. When the columns are wider than the window, scroll the page sideways.

Graft reads the repo at `/tmp/graft/test-repo`. `scripts/test/create-test-repo.sh` creates a test repo there.
