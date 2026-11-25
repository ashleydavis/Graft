//
// Tests working out the selected pane or page: the repo explorer's active pane from its state, and
// the active pane or the page at the router's path.
//

import { PANE_OR_PAGE_NAMES, repoExplorerActivePane, selectedPaneOrPage } from "../../lib/active-pane";
import { COMMIT_LINK, COMMITS_LINK, initialRepoExplorerState, IRepoExplorerState } from "../../lib/repo-explorer";

//
// Makes a repo explorer state with the link open and the pane at the index active.
//
function explorerState(openLink: string | undefined, activePaneIndex: number): IRepoExplorerState {
    return {
        ...initialRepoExplorerState,
        openLink,
        activePaneIndex,
    };
}

describe("repoExplorerActivePane", () => {
    test("is the repo details pane while the first pane is active", () => {
        expect(repoExplorerActivePane(explorerState(undefined, 0))).toBe("repo-details-pane");
        expect(repoExplorerActivePane(explorerState(COMMITS_LINK, 0))).toBe("repo-details-pane");
    });

    test("names the commit pane, the commit details pane and the file pane while the Commits link is open", () => {
        expect(repoExplorerActivePane(explorerState(COMMITS_LINK, 1))).toBe("commit-pane");
        expect(repoExplorerActivePane(explorerState(COMMITS_LINK, 2))).toBe("commit-details-pane");
        expect(repoExplorerActivePane(explorerState(COMMITS_LINK, 3))).toBe("file-pane");
    });

    test("names the changes pane and its file pane while the Commit link is open", () => {
        expect(repoExplorerActivePane(explorerState(COMMIT_LINK, 1))).toBe("changes-pane");
        expect(repoExplorerActivePane(explorerState(COMMIT_LINK, 2))).toBe("working-file-pane");
    });
});

describe("selectedPaneOrPage", () => {
    test("is the page at the path outside the repo explorer, whatever the active pane", () => {
        expect(selectedPaneOrPage("/", undefined)).toBe("welcome-page");
        expect(selectedPaneOrPage("/about", "commit-pane")).toBe("about-page");
        expect(selectedPaneOrPage("/help", undefined)).toBe("help-page");
    });

    test("is the active pane on the repo explorer page, or the page while it has none", () => {
        expect(selectedPaneOrPage("/repo-explorer", "commit-pane")).toBe("commit-pane");
        expect(selectedPaneOrPage("/repo-explorer", undefined)).toBe("repo-explorer-page");
    });

    test("is undefined for a path of no page of Graft's", () => {
        expect(selectedPaneOrPage("/nowhere", undefined)).toBeUndefined();
    });
});

describe("PANE_OR_PAGE_NAMES", () => {
    test("names both file panes File pane", () => {
        expect(PANE_OR_PAGE_NAMES["file-pane"]).toBe("File pane");
        expect(PANE_OR_PAGE_NAMES["working-file-pane"]).toBe("File pane");
    });
});
