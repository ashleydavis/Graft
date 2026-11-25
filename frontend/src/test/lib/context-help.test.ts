//
// Tests the help text table and the help picked for each pane and page: each page's name and what
// it is for, each pane's name, what it shows and its keys and clicks, and none for a path with no
// page of its own.
//

import { ExplorerPane, IViewHelp, PAGE_HELP, PANE_HELP, viewHelp } from "../../lib/context-help";

//
// Lists the keys a pane's help names, each key once, in the order the help lists them.
//
function helpKeys(help: IViewHelp | undefined): string[] {
    return help?.keys.flatMap(keyHelp => keyHelp.keys) ?? [];
}

describe("PAGE_HELP", () => {
    test("lists the pages in the order the Help page lists them, each with its name and what it is for", () => {
        expect(Object.values(PAGE_HELP)).toEqual([
            {
                id: "welcome",
                name: "Welcome",
                description: "The page Graft starts on. Its Open repo button opens a local Git repo.",
            },
            {
                id: "repo-explorer",
                name: "Repo explorer",
                description: "Shows the open repo. Its Commits link lists the repo's commits.",
            },
            {
                id: "help",
                name: "Help",
                description: "This page.",
            },
            {
                id: "about",
                name: "About",
                description: "What Graft is, its version and where to find out more.",
            },
        ]);
    });
});

describe("isPageView", () => {
    test("is true for each page", () => {
        expect(isPageView("welcome-page")).toBe(true);
        expect(isPageView("repo-explorer-page")).toBe(true);
        expect(isPageView("help-page")).toBe(true);
        expect(isPageView("about-page")).toBe(true);
    });

    test("is false for each pane", () => {
        const panes: ExplorerPane[] = ["repo-details-pane", "commit-pane", "commit-details-pane", "file-pane", "changes-pane", "working-file-pane"];
        for (const pane of panes) {
            expect(isPageView(pane)).toBe(false);
        }
    });
});

describe("viewHelp", () => {
    test("gives a page's name and the Help page's text for it, with empty lists of keys and clicks", () => {
        expect(viewHelp("welcome-page")).toEqual({
            name: "Welcome",
            description: "The page Graft starts on. Its Open repo button opens a local Git repo.",
            keys: [],
            clicks: [],
        });
        expect(viewHelp("repo-explorer-page")?.description).toBe(PAGE_HELP["repo-explorer-page"].description);
        expect(viewHelp("help-page")?.name).toBe("Help");
        expect(viewHelp("about-page")?.description).toBe("What Graft is, its version and where to find out more.");
    });

    test("gives each pane its own help", () => {
        expect(viewHelp("repo-details-pane")?.name).toBe("Repo details pane");
        expect(viewHelp("commit-pane")?.name).toBe("Commit pane");
        expect(viewHelp("commit-details-pane")?.name).toBe("Commit details pane");
        expect(viewHelp("file-pane")?.name).toBe("File pane");
        expect(viewHelp("changes-pane")?.name).toBe("Changes pane");
        expect(viewHelp("working-file-pane")?.name).toBe("File pane");
        expect(viewHelp("working-file-pane")?.description).toBe("The changed file's diff: its staged changes for a file in the Staged list and its unstaged changes for a file in the Unstaged list.");
    });

    test("lists only the keys each pane handles, as the keys spec describes", () => {
        expect(helpKeys(viewHelp("repo-details-pane"))).toEqual(["Up", "Down", "Right", "Enter", "Escape"]);
        expect(helpKeys(viewHelp("commit-pane"))).toEqual(["Up", "Down", "Left", "Right", "Enter", "Escape"]);
        expect(helpKeys(viewHelp("commit-details-pane"))).toEqual(["Up", "Down", "Left", "Right", "Enter", "Escape"]);
        expect(helpKeys(viewHelp("file-pane"))).toEqual(["Left", "Escape"]);
        expect(helpKeys(viewHelp("changes-pane"))).toEqual(["Up", "Down", "Left", "Right", "Enter", "Escape"]);
        expect(helpKeys(viewHelp("working-file-pane"))).toEqual(["Left", "Escape"]);
    });

    test("gives what a click does in each pane, ending with a click making the pane active", () => {
        for (const help of Object.values(PANE_HELP)) {
            expect(help.clicks.length).toBeGreaterThan(1);
            expect(help.clicks[help.clicks.length - 1]).toBe("Click anywhere in the pane to make it the active pane.");
        }
        expect(viewHelp("commit-pane")?.clicks[0]).toBe("Click a commit to open its details.");
    });

    test("gives undefined for a path with no page of its own", () => {
        expect(viewHelp(undefined)).toBeUndefined();
    });
});
