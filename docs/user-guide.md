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

Graft shows a splash screen with its icon while it starts.

Every page shows in the main content area in the middle of the window.

A top bar runs across the top, with Graft's name and the breadcrumb trail, which names the open repo and the page you are on. On the Help and About pages, click the page's name in the trail to switch between them.

The left sidebar has a link to each page: **Commits** at the top and **Help** and **About** at the bottom. The **Commits** link shows only while a repo is open. The menu button at the left of the top bar minimises the left sidebar to a strip of icons and expands it again.

The button at the far right of the top bar slides the right sidebar in and out. The right sidebar shows the Git commands the page you are on has run, the most recent first, under the `cd` that moves a terminal into the repo. Click the copy button beside one to copy it, then paste it into a terminal to run it yourself.

The button next to it, which shows the current theme's icon, opens the theme menu, where you pick Graft's colours: **Light**, **Dark** or **System**, which follows your system's light or dark theme. Graft starts on **System** and remembers your choice the next time it opens. The setting is `theme` in Graft's config file, `~/.config/graft/config.toml` on Linux and macOS and `%APPDATA%\Graft\config.toml` on Windows.

Graft remembers whether the left sidebar is minimised and whether the right sidebar is open, and starts with them as you left them.

### Opening a repo

Graft starts with no repo open. Choose **File**, then **Open repo**, and pick the repo's folder in the folder picker. The commits page opens on that repo's commits. Opening another repo the same way shows it in place of the one before. The repo stays open while you move between pages, until Graft closes.

### Keyboard shortcuts overlay

Press `?` to show the keyboard shortcuts overlay over the page. Press `?` again or Escape to close it. While you type in a text box, such as the search box of the breadcrumb trail's drop-down, `?` types the character instead. The overlay shows placeholder text in place of the shortcuts.

### About page

Graft opens on its About page, which shows Graft's name, its icon, its version and what Graft is. It links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube, which open in your web browser. It names Graft's licence, the MIT licence.

### Help page

The Help page says how to move between Graft's pages.

### Commits page

The commits page lists the first page of the open repo's commits, newest first: each commit's title, its author and the first seven characters of its hash. While Graft reads them the page says the commits are loading, and when git cannot read them the page says why. Its **About** link goes back to the About page.

The commit list is the first of the page's columns. Click a commit to open a column to its right with the commit's details and the files it changed. Click one of those files to open another column to the right with the file's diff in that commit. Each new column has a **Close** button and closing the commit's column closes the file's column with it. When the columns are wider than the window, scroll the page sideways.
