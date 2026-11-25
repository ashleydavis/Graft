//
// Tests how a pane of the repo explorer animates: which pane is closing after a pane gives way,
// which animation class a pane's column takes as it opens and closes and under reduced motion, and
// the names of the open panes the columns animate from, worked out from the explorer's state.
//

import { closingPaneId, openPaneIds, paneAnimationClass } from "../../lib/pane-animation";
import { changeKey, CHANGES_LINK, COMMITS_LINK, initialRepoExplorerState, IRepoExplorerState } from "../../lib/repo-explorer";

describe("closingPaneId", () => {
    test("closes the pane that was open when no pane takes its place", () => {
        expect(closingPaneId("abc", undefined, false)).toBe("abc");
    });

    test("closes no pane when another pane takes its place or one opens", () => {
        expect(closingPaneId("abc", "def", false)).toBeUndefined();
        expect(closingPaneId(undefined, "def", false)).toBeUndefined();
    });

    test("closes no pane when none was open", () => {
        expect(closingPaneId(undefined, undefined, false)).toBeUndefined();
    });

    test("closes no pane under reduced motion, so the pane goes at once", () => {
        expect(closingPaneId("abc", undefined, true)).toBeUndefined();
    });
});

describe("paneAnimationClass", () => {
    test("fades an opening pane in and a closing pane out", () => {
        expect(paneAnimationClass(false, false)).toBe("graft-pane-in");
        expect(paneAnimationClass(true, false)).toBe("graft-pane-out");
    });

    test("gives no animation class under reduced motion", () => {
        expect(paneAnimationClass(false, true)).toBe("");
        expect(paneAnimationClass(true, true)).toBe("");
    });
});

describe("openPaneIds", () => {
    test("names no pane while the repo details pane is alone", () => {
        expect(openPaneIds(initialRepoExplorerState, false)).toEqual({
            commitPane: undefined,
            commitDetailsPane: undefined,
            filePane: undefined,
            changesPane: undefined,
            workingFilePane: undefined,
        });
    });

    test("names the commit pane, the open commit and the open file while the Commits link is open", () => {
        const explorer: IRepoExplorerState = {
            ...initialRepoExplorerState,
            openLink: COMMITS_LINK,
            openHash: "abc",
            openPath: "src/a.ts",
        };
        expect(openPaneIds(explorer, false)).toEqual({
            commitPane: COMMITS_LINK,
            commitDetailsPane: "abc",
            filePane: "abc src/a.ts",
            changesPane: undefined,
            workingFilePane: undefined,
        });
    });

    test("names no file pane while no commit is open", () => {
        const explorer: IRepoExplorerState = {
            ...initialRepoExplorerState,
            openLink: COMMITS_LINK,
            openPath: "src/a.ts",
        };
        expect(openPaneIds(explorer, false).filePane).toBeUndefined();
    });

    test("names the changes pane and the open changed file while the Changes link is open and lists it", () => {
        const explorer: IRepoExplorerState = {
            ...initialRepoExplorerState,
            openLink: CHANGES_LINK,
            openChange: changeKey(false, "notes.txt"),
        };
        expect(openPaneIds(explorer, true)).toEqual({
            commitPane: undefined,
            commitDetailsPane: undefined,
            filePane: undefined,
            changesPane: CHANGES_LINK,
            workingFilePane: changeKey(false, "notes.txt"),
        });
    });

    test("names no changed file's pane while the changes pane does not list the open file", () => {
        const explorer: IRepoExplorerState = {
            ...initialRepoExplorerState,
            openLink: CHANGES_LINK,
            openChange: changeKey(false, "notes.txt"),
        };
        expect(openPaneIds(explorer, false).workingFilePane).toBeUndefined();
    });

    test("names no changed file's pane while the Commits link is open", () => {
        const explorer: IRepoExplorerState = {
            ...initialRepoExplorerState,
            openLink: COMMITS_LINK,
            openChange: changeKey(false, "notes.txt"),
        };
        expect(openPaneIds(explorer, true).workingFilePane).toBeUndefined();
    });
});
