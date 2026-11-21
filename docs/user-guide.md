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

The left sidebar has a link to each page. Each page's section below gives where its link is. The menu button at the left of the top bar minimises the left sidebar to a strip of icons and expands it again.

The button at the far right of the top bar slides the right sidebar in and out. The right sidebar shows the Git commands the page you are on has run, the most recent first, under the `cd` that moves a terminal into the repo. Under each command is how long it took, and under the `cd` is the total time of them all. Click the copy button beside one to copy it, then paste it into a terminal to run it yourself.

The button next to it, which shows the current theme's icon, opens the theme menu, where you pick Graft's colours: **Light**, **Dark** or **System**, which follows your system's light or dark theme. Graft starts on **System** and remembers your choice the next time it opens. The setting is `theme` in Graft's config file, `~/.config/graft/config.toml` on Linux and macOS and `%APPDATA%\Graft\config.toml` on Windows.

Graft remembers whether the left sidebar is minimised and whether the right sidebar is open, and starts with them as you left them.

### Opening a repo

Graft starts with no repo open, on its welcome page, which shows Graft's mark, its name, a line describing Graft and an **Open repo** button. Click **Open repo**, choose **File**, then **Open repo**, or press Ctrl+O (Command+O on macOS). Pick the repo's folder in the folder picker. The repo explorer page opens on that repo, with its name and path in the repo details pane. Opening another repo the same way shows it in place of the one before. The repo stays open while you move between pages, until Graft closes.

### Opening a new window

Choose **File**, then **New window**, or press Ctrl+N (Command+N on macOS), to open another window of Graft. It opens on the welcome page with no repo open, so you can open a different repo in it. Each window runs on its own. Closing one leaves the others open.

### Keyboard shortcuts overlay

Press `?` to show the keyboard shortcuts overlay over the page. It lists every keyboard shortcut of Graft's, with its keys as your platform shows them, in one column. Type in the search box at its top to show only the shortcuts whose name or keys match. The search box has the focus, so `?` typed there types the character. Press Escape to close the overlay. While you type in any other text box, such as the search box of the breadcrumb trail's drop-down, `?` types the character instead of showing the overlay.

### Zoom

Press Ctrl+Plus or Ctrl+= to make everything in the window bigger, Ctrl+Minus to make it smaller and Ctrl+0 to put it back to its normal size (Command in place of Ctrl on macOS). The **View** menu's **Zoom In**, **Zoom Out** and **Actual Size** items do the same. Graft remembers the zoom and starts at it the next time it opens.

### About page

Click **About** at the bottom of the left sidebar to open the About page, which shows Graft's name, its icon, its version and what Graft is. Under "Find out more" it links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on YouTube, which open in your web browser. It names Graft's licence, the MIT licence.

### Help page

Click **Help** at the bottom of the left sidebar to open the Help page, which explains how to move between Graft's pages.

### Repo explorer page

Click **Repo explorer** at the top of the left sidebar to open the repo explorer page. The link shows only while a repo is open, and opening a repo opens the page. The page shows the repo in columns. The first column is the repo details pane, with the repo's name and path and a **Commits** link. Click **Commits** to open the commit pane to its right, which lists the first page of the open repo's commits, newest first, one row each: the commit's title, the branches, tags and HEAD that point at it, its author, the day it was written and the first seven characters of its hash. Dates follow your system's locale and time zone. While Graft reads them the commit pane shows that the commits are loading, and when git cannot read them it shows why. The page's **About** link goes back to the About page.

Click a commit to open a column to its right with the commit's full message, who wrote and made it and when, its hash, its parents and the files it changed. Each changed file shows its change type (A added, D deleted, M modified, T type changed), its path and the lines the commit added and deleted, or "binary" for a binary file. Click one of those files to open another column to the right with the file's diff in that commit, as git writes it. The commit or file you clicked or moved to last in each column is selected, and the open commit's title is bold. Each new column has a close button (an X) and closing the commit's column closes the file's column with it. When a new column opens beyond the right edge of the window, the page scrolls sideways to show it. When the columns are wider than the window, scroll the page sideways.

The columns can also be used from the keyboard, as in the column view of macOS Finder. The active column has a border in the theme's primary colour. The repo details pane is active when the page opens. Up and Down move the selection in the active column, Left and Right move to the column to the left or right, Enter opens the selected Commits link, commit or file in a new column to the right, which becomes active. Escape closes the rightmost column. These keys are left to a text box that has the focus. Press Ctrl+1 (Cmd+1 on macOS) on any page to return to the repo explorer page.
