//
// Tests the repo explorer's state: what each key and each click does to the open panes, the
// active pane and the selection in each pane, and which key presses are the explorer's to handle.
//

import {
    closeCommitDetailsPane,
    closeCommitPane,
    closeFilePane,
    closeRightmostPane,
    COMMITS_LINK,
    explorerStateAfterKey,
    initialRepoExplorerState,
    IRepoExplorerItems,
    IRepoExplorerState,
    isExplorerKey,
    isExplorerKeyTarget,
    itemAfterMove,
    moveSelection,
    openPaneCount,
    openSelection,
    selectCommit,
    selectFile,
    selectLink,
} from "../../lib/repo-explorer";

//
// The items the panes list: the Commits link, three commits and two changed files.
//
const items: IRepoExplorerItems = {
    links: [COMMITS_LINK],
    commitHashes: ["aaa", "bbb", "ccc"],
    filePaths: ["README.md", "notes.txt"],
};

//
// The explorer with the commit pane open and active and no commit selected.
//
const commitsOpen: IRepoExplorerState = {
    activePaneIndex: 1,
    selectedLink: COMMITS_LINK,
    openLink: COMMITS_LINK,
    selectedHash: undefined,
    openHash: undefined,
    selectedPath: undefined,
    openPath: undefined,
};

//
// The explorer with commit bbb open and selected, no file open and the commit details pane active.
//
const detailsOpen: IRepoExplorerState = {
    ...commitsOpen,
    activePaneIndex: 2,
    selectedHash: "bbb",
    openHash: "bbb",
};

//
// The explorer with commit bbb open and selected, its file notes.txt open and selected, and the
// file pane active.
//
const allOpen: IRepoExplorerState = {
    ...detailsOpen,
    activePaneIndex: 3,
    selectedPath: "notes.txt",
    openPath: "notes.txt",
};

describe("initialRepoExplorerState", () => {
    test("is the repo details pane alone, active, with nothing selected", () => {
        expect(initialRepoExplorerState).toEqual({
            activePaneIndex: 0,
            selectedLink: undefined,
            openLink: undefined,
            selectedHash: undefined,
            openHash: undefined,
            selectedPath: undefined,
            openPath: undefined,
        });
    });
});

describe("isExplorerKey", () => {
    test("is true for the arrow keys, Enter and Escape", () => {
        for (const key of ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"]) {
            expect(isExplorerKey(key)).toBe(true);
        }
    });

    test("is false for any other key", () => {
        expect(isExplorerKey("a")).toBe(false);
        expect(isExplorerKey("?")).toBe(false);
        expect(isExplorerKey("Tab")).toBe(false);
    });
});

describe("openPaneCount", () => {
    test("counts the repo details pane, the commit pane, the commit details pane and the file pane that are open", () => {
        expect(openPaneCount(initialRepoExplorerState)).toBe(1);
        expect(openPaneCount(commitsOpen)).toBe(2);
        expect(openPaneCount(detailsOpen)).toBe(3);
        expect(openPaneCount(allOpen)).toBe(4);
    });
});

describe("itemAfterMove", () => {
    test("picks the item below or above the selected one", () => {
        expect(itemAfterMove(items.commitHashes, "aaa", 1)).toBe("bbb");
        expect(itemAfterMove(items.commitHashes, "ccc", -1)).toBe("bbb");
    });

    test("stays on the first or last item at the ends", () => {
        expect(itemAfterMove(items.commitHashes, "aaa", -1)).toBe("aaa");
        expect(itemAfterMove(items.commitHashes, "ccc", 1)).toBe("ccc");
    });

    test("picks the first item with nothing selected or a selection no longer listed", () => {
        expect(itemAfterMove(items.commitHashes, undefined, 1)).toBe("aaa");
        expect(itemAfterMove(items.commitHashes, undefined, -1)).toBe("aaa");
        expect(itemAfterMove(items.commitHashes, "zzz", 1)).toBe("aaa");
    });

    test("picks nothing from no items", () => {
        expect(itemAfterMove([], undefined, 1)).toBeUndefined();
        expect(itemAfterMove([], "aaa", 1)).toBeUndefined();
    });
});

describe("selectLink", () => {
    test("selects and opens the link with no commit or file, with the repo details pane active", () => {
        expect(selectLink(COMMITS_LINK)).toEqual({
            activePaneIndex: 0,
            selectedLink: COMMITS_LINK,
            openLink: COMMITS_LINK,
            selectedHash: undefined,
            openHash: undefined,
            selectedPath: undefined,
            openPath: undefined,
        });
    });
});

describe("selectCommit", () => {
    test("selects and opens the commit with no file, with the commit pane active", () => {
        expect(selectCommit(allOpen, "ccc")).toEqual({
            ...commitsOpen,
            activePaneIndex: 1,
            selectedHash: "ccc",
            openHash: "ccc",
        });
    });
});

describe("selectFile", () => {
    test("selects and opens the file, with the commit details pane active", () => {
        expect(selectFile(detailsOpen, "README.md")).toEqual({
            ...detailsOpen,
            activePaneIndex: 2,
            selectedPath: "README.md",
            openPath: "README.md",
        });
    });
});

describe("closeFilePane", () => {
    test("closes the file pane and makes the commit details pane active when the file pane was", () => {
        expect(closeFilePane(allOpen)).toEqual({
            ...allOpen,
            activePaneIndex: 2,
            openPath: undefined,
        });
    });

    test("leaves the commit pane active when it was", () => {
        expect(closeFilePane({
            ...allOpen,
            activePaneIndex: 1,
        }).activePaneIndex).toBe(1);
    });
});

describe("closeCommitDetailsPane", () => {
    test("closes the commit details pane and the file pane, keeping the commit selected", () => {
        expect(closeCommitDetailsPane(allOpen)).toEqual({
            ...commitsOpen,
            activePaneIndex: 1,
            selectedHash: "bbb",
        });
    });

    test("leaves the repo details pane active when it was", () => {
        expect(closeCommitDetailsPane({
            ...allOpen,
            activePaneIndex: 0,
        }).activePaneIndex).toBe(0);
    });
});

describe("closeCommitPane", () => {
    test("closes the commit pane and every pane to its right, keeping the Commits link selected", () => {
        expect(closeCommitPane(allOpen)).toEqual({
            ...initialRepoExplorerState,
            selectedLink: COMMITS_LINK,
        });
    });
});

describe("moveSelection", () => {
    test("moves the selected link in the repo details pane", () => {
        expect(moveSelection(initialRepoExplorerState, items, 1).selectedLink).toBe(COMMITS_LINK);
    });

    test("moves the selected commit in the commit pane", () => {
        expect(moveSelection(commitsOpen, items, 1).selectedHash).toBe("aaa");
    });

    test("moves the selected file in the commit details pane", () => {
        expect(moveSelection(detailsOpen, items, 1).selectedPath).toBe("README.md");
        expect(moveSelection(detailsOpen, items, 1).selectedHash).toBe("bbb");
    });

    test("changes nothing in the file pane, which lists no items", () => {
        expect(moveSelection(allOpen, items, 1)).toBe(allOpen);
    });
});

describe("openSelection", () => {
    test("opens the selected link and makes the commit pane active", () => {
        expect(openSelection({
            ...initialRepoExplorerState,
            selectedLink: COMMITS_LINK,
        })).toEqual(commitsOpen);
    });

    test("opens the selected commit and makes the commit details pane active", () => {
        expect(openSelection({
            ...commitsOpen,
            selectedHash: "aaa",
        })).toEqual({
            ...commitsOpen,
            activePaneIndex: 2,
            selectedHash: "aaa",
            openHash: "aaa",
        });
    });

    test("opens the selected file and makes the file pane active", () => {
        expect(openSelection({
            ...detailsOpen,
            selectedPath: "README.md",
        })).toEqual({
            ...detailsOpen,
            activePaneIndex: 3,
            selectedPath: "README.md",
            openPath: "README.md",
        });
    });

    test("changes nothing with nothing selected or in the file pane", () => {
        expect(openSelection(initialRepoExplorerState)).toBe(initialRepoExplorerState);
        expect(openSelection(commitsOpen)).toBe(commitsOpen);
        expect(openSelection(detailsOpen)).toBe(detailsOpen);
        expect(openSelection(allOpen)).toBe(allOpen);
    });
});

describe("closeRightmostPane", () => {
    test("closes the file pane and makes the commit details pane active", () => {
        expect(closeRightmostPane({
            ...allOpen,
            activePaneIndex: 0,
        })).toEqual({
            ...allOpen,
            activePaneIndex: 2,
            openPath: undefined,
        });
    });

    test("closes the commit details pane and makes the commit pane active", () => {
        expect(closeRightmostPane({
            ...detailsOpen,
            activePaneIndex: 0,
        })).toEqual({
            ...commitsOpen,
            activePaneIndex: 1,
            selectedHash: "bbb",
        });
    });

    test("closes the commit pane and makes the repo details pane active", () => {
        expect(closeRightmostPane(commitsOpen)).toEqual(closeCommitPane(commitsOpen));
    });

    test("changes nothing with only the repo details pane open", () => {
        expect(closeRightmostPane(initialRepoExplorerState)).toBe(initialRepoExplorerState);
    });
});

describe("explorerStateAfterKey", () => {
    test("Down and Up move the selection in the active pane", () => {
        expect(explorerStateAfterKey(initialRepoExplorerState, "ArrowDown", items).selectedLink).toBe(COMMITS_LINK);
        expect(explorerStateAfterKey(commitsOpen, "ArrowDown", items).selectedHash).toBe("aaa");
        expect(explorerStateAfterKey({
            ...commitsOpen,
            selectedHash: "bbb",
        }, "ArrowUp", items).selectedHash).toBe("aaa");
    });

    test("Left makes the pane to the left active and stops at the repo details pane", () => {
        expect(explorerStateAfterKey(allOpen, "ArrowLeft", items).activePaneIndex).toBe(2);
        expect(explorerStateAfterKey(initialRepoExplorerState, "ArrowLeft", items).activePaneIndex).toBe(0);
    });

    test("Right makes the pane to the right active only when there is one", () => {
        expect(explorerStateAfterKey({
            ...allOpen,
            activePaneIndex: 2,
        }, "ArrowRight", items).activePaneIndex).toBe(3);
        expect(explorerStateAfterKey(allOpen, "ArrowRight", items).activePaneIndex).toBe(3);
        expect(explorerStateAfterKey(initialRepoExplorerState, "ArrowRight", items).activePaneIndex).toBe(0);
    });

    test("Enter opens the selected item", () => {
        expect(explorerStateAfterKey({
            ...commitsOpen,
            selectedHash: "ccc",
        }, "Enter", items).openHash).toBe("ccc");
    });

    test("Escape closes the rightmost pane", () => {
        expect(explorerStateAfterKey(allOpen, "Escape", items).openPath).toBeUndefined();
    });

    test("any other key changes nothing", () => {
        expect(explorerStateAfterKey(allOpen, "a", items)).toBe(allOpen);
    });
});

describe("isExplorerKeyTarget", () => {
    //
    // Makes a repo explorer page with a row, a text box, a text area, a link, a button and an
    // editable element in it, and puts it on the document.
    //
    function makePage(): HTMLElement {
        const page = document.createElement("main");
        page.innerHTML = "<div data-id=\"row\" role=\"button\"><span data-id=\"title\">A</span></div><input data-id=\"input\"><textarea data-id=\"textarea\"></textarea><select data-id=\"select\"></select><a data-id=\"link\" href=\"#\">About</a><button data-id=\"button\"><span data-id=\"icon\">X</span></button><div data-id=\"editable\"></div>";
        document.body.appendChild(page);
        return page;
    }

    //
    // Finds the element with the data-id in the page, failing the test when it is not there.
    //
    function elementIn(page: HTMLElement, dataId: string): HTMLElement {
        const element = page.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
        expect(element).not.toBeNull();

        //
        // The cast is safe because the expect above fails the test on null, and a type guard
        // cannot narrow it because Jest's expect does not narrow the type.
        //
        return element as HTMLElement;
    }

    afterEach(() => {
        document.body.innerHTML = "";
    });

    test("is true for the page's body and for a row or its text in the page", () => {
        const page = makePage();
        expect(isExplorerKeyTarget(document.body, page, false)).toBe(true);
        expect(isExplorerKeyTarget(elementIn(page, "row"), page, false)).toBe(true);
        expect(isExplorerKeyTarget(elementIn(page, "title"), page, false)).toBe(true);
    });

    test("is false for a text box, text area, select, link or button, or inside one", () => {
        const page = makePage();
        for (const dataId of ["input", "textarea", "select", "link", "button", "icon"]) {
            expect(isExplorerKeyTarget(elementIn(page, dataId), page, false)).toBe(false);
        }
    });

    test("is false for an editable element", () => {
        const page = makePage();
        const editable = elementIn(page, "editable");

        //
        // jsdom does not work out isContentEditable from the contenteditable attribute, so the
        // test gives the element the value a browser would.
        //
        Object.defineProperty(editable, "isContentEditable", {
            value: true,
        });
        expect(isExplorerKeyTarget(editable, page, false)).toBe(false);
    });

    test("is false outside the page, such as in a menu or dialog, and before the page is drawn", () => {
        const page = makePage();
        const menu = document.createElement("ul");
        document.body.appendChild(menu);
        expect(isExplorerKeyTarget(menu, page, false)).toBe(false);
        expect(isExplorerKeyTarget(elementIn(page, "row"), null, false)).toBe(false);
    });

    test("is false with Ctrl, Alt or Cmd held, and for a target that is not an element", () => {
        const page = makePage();
        expect(isExplorerKeyTarget(document.body, page, true)).toBe(false);
        expect(isExplorerKeyTarget(null, page, false)).toBe(false);
        expect(isExplorerKeyTarget(document, page, false)).toBe(false);
    });
});
