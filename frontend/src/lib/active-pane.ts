//
// Works out the selected pane or page: the active pane while the repo explorer page shows one, and
// the page shown everywhere else. The layout keeps it, so every part drawn over or beside the page
// reads the one value.
//

import { CHANGES_LINK, IRepoExplorerState, tagNameOfLink } from "./repo-explorer";

//
// The name of one of Graft's pages or one of the repo explorer's panes.
//
export type PaneOrPage =
    | "welcome-page"
    | "about-page"
    | "help-page"
    | "repo-explorer-page"
    | "repo-details-pane"
    | "commit-pane"
    | "commit-details-pane"
    | "file-pane"
    | "changes-pane"
    | "working-file-pane"
    | "tag-pane";

//
// The name each pane and page is shown by, such as the heading of the command palette's group of
// commands for it. The changes pane's file pane is a file pane to the user, so both file panes
// share the name.
//
export const PANE_OR_PAGE_NAMES: Record<PaneOrPage, string> = {
    "welcome-page": "Welcome page",
    "about-page": "About page",
    "help-page": "Help page",
    "repo-explorer-page": "Repo explorer page",
    "repo-details-pane": "Repo details pane",
    "commit-pane": "Commit pane",
    "commit-details-pane": "Commit details pane",
    "file-pane": "File pane",
    "changes-pane": "Changes pane",
    "working-file-pane": "File pane",
    "tag-pane": "Tag pane",
};

//
// Works out the repo explorer's active pane from its state, so the repo explorer page can put it
// in the layout's shared value. While the Changes link is open the changes pane and its file pane
// follow the repo details pane, and otherwise the commit pane, the commit details pane and the file
// pane do.
//
export function repoExplorerActivePane(state: IRepoExplorerState): PaneOrPage {
    if (state.activePaneIndex === 0) {
        return "repo-details-pane";
    }
    if (tagNameOfLink(state.openLink) !== undefined) {
        return "tag-pane";
    }
    if (state.openLink === CHANGES_LINK) {
        if (state.activePaneIndex === 1) {
            return "changes-pane";
        }
        return "working-file-pane";
    }
    if (state.activePaneIndex === 1) {
        return "commit-pane";
    }
    if (state.activePaneIndex === 2) {
        return "commit-details-pane";
    }
    return "file-pane";
}

//
// The page each router path shows, for selectedPaneOrPage.
//
const PAGE_PATHS: Record<string, PaneOrPage> = {
    "/": "welcome-page",
    "/about": "about-page",
    "/help": "help-page",
    "/repo-explorer": "repo-explorer-page",
};

//
// Works out the selected pane or page from the router's path and the active pane the repo explorer
// page set, or undefined when it set none: the active pane while the repo explorer page shows one,
// and otherwise the page at the path. A path of no page of Graft's gives undefined.
//
export function selectedPaneOrPage(pathname: string, activePane: PaneOrPage | undefined): PaneOrPage | undefined {
    const page = PAGE_PATHS[pathname];
    if (page === "repo-explorer-page") {
        if (activePane) {
            return activePane;
        }
    }
    return page;
}
