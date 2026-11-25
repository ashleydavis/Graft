//
// Holds the help text for each of Graft's pages and for each pane of the repo explorer, in one
// place, so the Help page and the right sidebar's Help pane say the same thing about each page, and
// picks the help for the selected pane or page.
//

import { PaneOrPage } from "./active-pane";

//
// The names of Graft's pages, among the names of the selected pane or page.
//
export type PageView = "welcome-page" | "repo-explorer-page" | "help-page" | "about-page";

//
// The names of the repo explorer's panes, among the names of the selected pane or page.
//
export type ExplorerPane = Exclude<PaneOrPage, PageView>;

//
// What the Help page and the Help pane say about one of Graft's pages.
//
export interface IPageHelp {
    // The page's name in data-ids, such as "repo-explorer" in "help-repo-explorer".
    id: string;

    // The page's name, as the left sidebar and the breadcrumb trail name it.
    name: string;

    // What the page is for.
    description: string;
}

//
// One key, or keys that do the same thing, and what pressing it does in a pane.
//
export interface IKeyHelp {
    // The keys, each as a key cap shows it, such as "Up". Each is drawn as a key cap of its own.
    keys: string[];

    // What the keys do in the pane.
    text: string;
}

//
// The help the Help pane shows for the selected pane or page.
//
export interface IViewHelp {
    // The name of the pane or page, which heads its help.
    name: string;

    // What the pane or page shows or is for.
    description: string;

    // The keys that work in the pane, in the order Up and Down, Left, Right, Enter, Escape. A
    // page's list is empty, because the keyboard shortcuts overlay lists a page's keys.
    keys: IKeyHelp[];

    // What a click does in the pane, one line for each thing to click. A page's list is empty.
    clicks: string[];
}

//
// Graft's pages, by their selected view, in the order the Help page lists them, with what each is
// for. The Help page lists them under "Pages" and the Help pane shows the one shown, so the two
// never differ.
//
export const PAGE_HELP: Record<PageView, IPageHelp> = {
    "welcome-page": {
        id: "welcome",
        name: "Welcome",
        description: "The page Graft starts on. Its Open repo button opens a local Git repo.",
    },
    "repo-explorer-page": {
        id: "repo-explorer",
        name: "Repo explorer",
        description: "Shows the open repo. Its Commits link lists the repo's commits.",
    },
    "help-page": {
        id: "help",
        name: "Help",
        description: "This page.",
    },
    "about-page": {
        id: "about",
        name: "About",
        description: "What Graft is, its version and where to find out more.",
    },
};

//
// The help line for Escape, which closes the rightmost pane whichever pane is active, as
// docs/spec/repo-explorer/keys/detail.md describes. Every pane that can have a pane to its right
// lists it.
//
const ESCAPE_HELP: IKeyHelp = {
    keys: ["Escape"],
    text: "Closes the rightmost pane and makes the pane to its left active.",
};

//
// The help line for a click anywhere in a pane, which makes it active in every pane.
//
const CLICK_TO_ACTIVATE = "Click anywhere in the pane to make it the active pane.";

//
// The help for each pane of the repo explorer: what it shows and the keys and clicks that do
// something in it, as docs/spec/repo-explorer/keys/detail.md, columns/detail.md, changes/detail.md
// and repo-details/detail.md describe. Each pane lists only the keys that do something in it.
//
export const PANE_HELP: Record<ExplorerPane, IViewHelp> = {
    "repo-details-pane": {
        name: "Repo details pane",
        description: "The open repo's name and path, with the Commits link to its commits and the Commit link to the changes in its working tree.",
        keys: [
            {
                keys: ["Up", "Down"],
                text: "Selects the Commits link or the Commit link.",
            },
            {
                keys: ["Right"],
                text: "Makes the pane to the right active, when one is open.",
            },
            {
                keys: ["Enter"],
                text: "Opens the selected link's pane and makes it active.",
            },
            ESCAPE_HELP,
        ],
        clicks: [
            "Click Commits to list the repo's commits in the commit pane.",
            "Click Commit to open the changes pane.",
            CLICK_TO_ACTIVATE,
        ],
    },
    "commit-pane": {
        name: "Commit pane",
        description: "The repo's commits, newest first, with each commit's title, refs, author, date and short hash. More commits are read as the list scrolls.",
        keys: [
            {
                keys: ["Up", "Down"],
                text: "Selects the commit above or below. While a commit's details are open, they show the selected commit.",
            },
            {
                keys: ["Left"],
                text: "Makes the repo details pane active.",
            },
            {
                keys: ["Right"],
                text: "Makes the commit details pane active, when it is open.",
            },
            {
                keys: ["Enter"],
                text: "Opens the selected commit's details and makes the commit details pane active.",
            },
            ESCAPE_HELP,
        ],
        clicks: [
            "Click a commit to open its details.",
            "Click … beside a commit's refs to list them all.",
            CLICK_TO_ACTIVATE,
        ],
    },
    "commit-details-pane": {
        name: "Commit details pane",
        description: "The open commit's message, author, committer, hash and parents, and the files it changed.",
        keys: [
            {
                keys: ["Up", "Down"],
                text: "With no file open, opens the commit above or below. With a file open, selects the file above or below and shows its diff.",
            },
            {
                keys: ["Left"],
                text: "Makes the commit pane active.",
            },
            {
                keys: ["Right"],
                text: "Makes the file pane active, when it is open.",
            },
            {
                keys: ["Enter"],
                text: "Opens the selected file's diff in the file pane and makes it active.",
            },
            ESCAPE_HELP,
        ],
        clicks: [
            "Click a changed file to open its diff.",
            "Click the close button to close this pane and the file pane.",
            CLICK_TO_ACTIVATE,
        ],
    },
    "file-pane": {
        name: "File pane",
        description: "The open file's diff in the commit, with old and new line numbers.",
        keys: [
            {
                keys: ["Left"],
                text: "Makes the commit details pane active.",
            },
            {
                keys: ["Escape"],
                text: "Closes this pane and makes the commit details pane active.",
            },
        ],
        clicks: [
            "Click the close button to close this pane.",
            CLICK_TO_ACTIVATE,
        ],
    },
    "changes-pane": {
        name: "Changes pane",
        description: "The working tree's changed files in two lists, Unstaged above Staged, and under them the commit message and the Commit button.",
        keys: [
            {
                keys: ["Up", "Down"],
                text: "Selects the file above or below, through the Unstaged files and then the Staged files.",
            },
            {
                keys: ["Left"],
                text: "Makes the repo details pane active.",
            },
            {
                keys: ["Right"],
                text: "Makes the file pane active, when it is open.",
            },
            {
                keys: ["Enter"],
                text: "Opens the selected file's diff in the file pane and makes it active.",
            },
            ESCAPE_HELP,
        ],
        clicks: [
            "Click a file to open its diff.",
            "Click the double chevron beside a file to stage it, or beside a staged file to unstage it.",
            "Write a commit message and click Commit to commit the staged files.",
            CLICK_TO_ACTIVATE,
        ],
    },
    "working-file-pane": {
        name: "File pane",
        description: "The changed file's diff: its staged changes for a file in the Staged list and its unstaged changes for a file in the Unstaged list.",
        keys: [
            {
                keys: ["Left"],
                text: "Makes the changes pane active.",
            },
            {
                keys: ["Escape"],
                text: "Closes this pane and makes the changes pane active.",
            },
        ],
        clicks: [
            "Click the close button to close this pane.",
            CLICK_TO_ACTIVATE,
        ],
    },
};

//
// Picks the help for the selected pane or page, for the Help pane to show: a pane's help from
// PANE_HELP, or a page's name and what it is for from PAGE_HELP, with no keys or clicks. A path
// with no page of its own, whose view is undefined, gets undefined.
//
export function viewHelp(view: PaneOrPage | undefined): IViewHelp | undefined {
    if (view === undefined) {
        return undefined;
    }
    if (isPageView(view)) {
        return {
            name: PAGE_HELP[view].name,
            description: PAGE_HELP[view].description,
            keys: [],
            clicks: [],
        };
    }
    return PANE_HELP[view];
}

//
// Returns true when the selected view is one of Graft's pages, which PAGE_HELP holds, rather than
// a repo explorer pane, so viewHelp knows which table to read it from.
//
export function isPageView(view: PaneOrPage): view is PageView {
    return view in PAGE_HELP;
}
