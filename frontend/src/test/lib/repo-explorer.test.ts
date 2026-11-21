//
// Tests the repo explorer's state: what each key and each click does to the open panes, the
// active pane and the selection in each pane, and which key presses are the explorer's to handle.
//

import {
    activatePane,
    changeKey,
    changeKeysOf,
    closeChangeFilePane,
    closeCommitDetailsPane,
    closeFilePane,
    closeLinkPane,
    closeRightmostPane,
    COMMIT_LINK,
    COMMITS_LINK,
    explorerStateAfterKey,
    findChange,
    followMovedChange,
    initialRepoExplorerState,
    IRepoExplorerItems,
    IRepoExplorerState,
    isExplorerKey,
    isExplorerKeyTarget,
    itemAfterMove,
    moveCommitSelection,
    moveSelection,
    openPaneCount,
    keepListedChanges,
    openSelection,
    targetPaneIndex,
    selectChange,
    selectCommit,
    selectFile,
    selectFirstFile,
    selectLink,
} from "../../lib/repo-explorer";

//
// The items the panes list: the Commits and Commit links, three commits, two changed files in the
// commit and three rows in the changes pane, notes.txt in both lists.
//
const items: IRepoExplorerItems = {
    links: [COMMITS_LINK, COMMIT_LINK],
    commitHashes: ["aaa", "bbb", "ccc"],
    filePaths: ["README.md", "notes.txt"],
    changeKeys: [changeKey(false, "notes.txt"), changeKey(false, "new.txt"), changeKey(true, "notes.txt")],
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
    selectedChange: undefined,
    openChange: undefined,
};

//
// The explorer with the changes pane open and active and no changed file selected.
//
const changesOpen: IRepoExplorerState = {
    ...initialRepoExplorerState,
    activePaneIndex: 1,
    selectedLink: COMMIT_LINK,
    openLink: COMMIT_LINK,
};

//
// The explorer with unstaged notes.txt open and selected in the changes pane and its file pane
// active.
//
const changeFileOpen: IRepoExplorerState = {
    ...changesOpen,
    activePaneIndex: 2,
    selectedChange: changeKey(false, "notes.txt"),
    openChange: changeKey(false, "notes.txt"),
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
            selectedChange: undefined,
            openChange: undefined,
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

    test("counts the repo details pane, the changes pane and a changed file's pane that are open", () => {
        expect(openPaneCount(changesOpen)).toBe(2);
        expect(openPaneCount(changeFileOpen)).toBe(3);
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
            selectedChange: undefined,
            openChange: undefined,
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

describe("selectFirstFile", () => {
    test("selects the first file once the files are read", () => {
        expect(selectFirstFile(detailsOpen, ["README.md", "notes.txt"])).toEqual({
            ...detailsOpen,
            selectedPath: "README.md",
        });
    });

    test("keeps a file already selected", () => {
        const notesSelected = {
            ...detailsOpen,
            selectedPath: "notes.txt",
        };
        expect(selectFirstFile(notesSelected, ["README.md", "notes.txt"])).toBe(notesSelected);
    });

    test("selects nothing when the commit changed no files", () => {
        expect(selectFirstFile(detailsOpen, []).selectedPath).toBeUndefined();
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

describe("closeLinkPane", () => {
    test("closes the commit pane and every pane to its right, keeping the Commits link selected", () => {
        expect(closeLinkPane(allOpen)).toEqual({
            ...initialRepoExplorerState,
            selectedLink: COMMITS_LINK,
        });
    });

    test("closes the changes pane and its file pane, keeping the Commit link selected", () => {
        expect(closeLinkPane(changeFileOpen)).toEqual({
            ...initialRepoExplorerState,
            selectedLink: COMMIT_LINK,
        });
    });
});

describe("activatePane", () => {
    test("makes the pane at the index active and leaves the rest of the state as it is", () => {
        expect(activatePane(allOpen, 0)).toEqual({
            ...allOpen,
            activePaneIndex: 0,
        });
        expect(activatePane(allOpen, 2)).toEqual({
            ...allOpen,
            activePaneIndex: 2,
        });
        expect(activatePane(changeFileOpen, 1)).toEqual({
            ...changeFileOpen,
            activePaneIndex: 1,
        });
    });

    test("makes the rightmost open pane active for an index beyond the open panes", () => {
        expect(activatePane(commitsOpen, 3)).toEqual({
            ...commitsOpen,
            activePaneIndex: 1,
        });
        expect(activatePane(initialRepoExplorerState, 1)).toEqual(initialRepoExplorerState);
    });
});

describe("targetPaneIndex", () => {
    test("finds the position of the pane that holds the target, at any depth in the pane", () => {
        const columns = document.createElement("div");
        const firstPane = document.createElement("section");
        const secondPane = document.createElement("section");
        const titleBar = document.createElement("div");
        const title = document.createTextNode("Commits");
        titleBar.append(title);
        secondPane.append(titleBar);
        columns.append(firstPane, secondPane);
        expect(targetPaneIndex(columns, firstPane)).toBe(0);
        expect(targetPaneIndex(columns, secondPane)).toBe(1);
        expect(targetPaneIndex(columns, titleBar)).toBe(1);
        expect(targetPaneIndex(columns, title)).toBe(1);
    });

    test("finds no pane for the columns themselves, a node outside them or the window", () => {
        const columns = document.createElement("div");
        columns.append(document.createElement("section"));
        expect(targetPaneIndex(columns, columns)).toBeUndefined();
        expect(targetPaneIndex(columns, document.createElement("section"))).toBeUndefined();
        expect(targetPaneIndex(columns, window)).toBeUndefined();
    });
});

describe("changeKey", () => {
    test("names a row by its list and path, so a file in both lists has two keys", () => {
        expect(changeKey(false, "notes.txt")).toBe("unstaged:notes.txt");
        expect(changeKey(true, "notes.txt")).toBe("staged:notes.txt");
    });
});

describe("selectChange", () => {
    test("selects the changed file and opens its file pane with the changes pane active", () => {
        expect(selectChange({
            ...changeFileOpen,
            activePaneIndex: 0,
        }, changeKey(true, "notes.txt"))).toEqual({
            ...changesOpen,
            selectedChange: changeKey(true, "notes.txt"),
            openChange: changeKey(true, "notes.txt"),
        });
    });
});

describe("closeChangeFilePane", () => {
    test("closes the changed file's pane and makes the changes pane active, keeping it selected", () => {
        expect(closeChangeFilePane(changeFileOpen)).toEqual({
            ...changeFileOpen,
            activePaneIndex: 1,
            openChange: undefined,
        });
    });

    test("leaves the repo details pane active when it was", () => {
        expect(closeChangeFilePane({
            ...changeFileOpen,
            activePaneIndex: 0,
        }).activePaneIndex).toBe(0);
    });
});

describe("followMovedChange", () => {
    test("moves the selection and the open file to the file's row in the other list", () => {
        expect(followMovedChange(changeFileOpen, changeKey(false, "notes.txt"), changeKey(true, "notes.txt"))).toEqual({
            ...changeFileOpen,
            selectedChange: changeKey(true, "notes.txt"),
            openChange: changeKey(true, "notes.txt"),
        });
    });

    test("leaves the selection and the open file alone when another file moved", () => {
        expect(followMovedChange(changeFileOpen, changeKey(false, "new.txt"), changeKey(true, "new.txt"))).toEqual(changeFileOpen);
    });
});

describe("keepListedChanges", () => {
    test("keeps a selection and an open file that are still listed", () => {
        expect(keepListedChanges(changeFileOpen, items.changeKeys)).toBe(changeFileOpen);
    });

    test("drops a selection and an open file whose rows have gone, closing the file pane", () => {
        expect(keepListedChanges(changeFileOpen, [changeKey(true, "notes.txt")])).toEqual({
            ...changesOpen,
            activePaneIndex: 1,
        });
    });

    test("changes nothing with nothing selected or open", () => {
        expect(keepListedChanges(changesOpen, [])).toBe(changesOpen);
    });
});

describe("moveCommitSelection", () => {
    test("moves only the selection while no commit's details are open", () => {
        expect(moveCommitSelection(commitsOpen, items.commitHashes, 1)).toEqual({
            ...commitsOpen,
            selectedHash: "aaa",
        });
    });

    test("opens the newly selected commit's details at once, keeping the commit pane active", () => {
        const state: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 1,
        };
        expect(moveCommitSelection(state, items.commitHashes, 1)).toEqual({
            ...commitsOpen,
            selectedHash: "ccc",
            openHash: "ccc",
        });
        expect(moveCommitSelection(state, items.commitHashes, -1)).toEqual({
            ...commitsOpen,
            selectedHash: "aaa",
            openHash: "aaa",
        });
    });

    test("keeps the open details and their file pane at the first or last commit", () => {
        const first: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 1,
            selectedHash: "aaa",
            openHash: "aaa",
        };
        expect(moveCommitSelection(first, items.commitHashes, -1)).toBe(first);
        const last: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 1,
            selectedHash: "ccc",
            openHash: "ccc",
        };
        expect(moveCommitSelection(last, items.commitHashes, 1)).toBe(last);
    });

    test("keeps the open details when there are no commits to move through", () => {
        const state: IRepoExplorerState = {
            ...detailsOpen,
            activePaneIndex: 1,
        };
        expect(moveCommitSelection(state, [], 1)).toBe(state);
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

    test("leaves the file pane closed when it moves the selected file with no file open", () => {
        expect(moveSelection(detailsOpen, items, 1).openPath).toBeUndefined();
    });

    test("opens the newly selected file in the file pane when a file is open, keeping the commit details pane active", () => {
        const fileOpen: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 2,
            selectedPath: "README.md",
            openPath: "README.md",
        };
        const down = moveSelection(fileOpen, items, 1);
        expect(down.selectedPath).toBe("notes.txt");
        expect(down.openPath).toBe("notes.txt");
        expect(down.activePaneIndex).toBe(2);
        const up = moveSelection(down, items, -1);
        expect(up.selectedPath).toBe("README.md");
        expect(up.openPath).toBe("README.md");
        expect(up.activePaneIndex).toBe(2);
    });

    test("keeps the open file when the commit's files are not listed yet", () => {
        const fileOpen: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 2,
        };
        expect(moveSelection(fileOpen, {
            ...items,
            filePaths: [],
        }, 1)).toBe(fileOpen);
    });

    test("changes nothing in the file pane, which lists no items", () => {
        expect(moveSelection(allOpen, items, 1)).toBe(allOpen);
        expect(moveSelection(changeFileOpen, items, 1)).toBe(changeFileOpen);
    });

    test("moves through the unstaged rows then the staged rows in the changes pane", () => {
        expect(moveSelection(changesOpen, items, 1).selectedChange).toBe(changeKey(false, "notes.txt"));
        expect(moveSelection({
            ...changesOpen,
            selectedChange: changeKey(false, "new.txt"),
        }, items, 1).selectedChange).toBe(changeKey(true, "notes.txt"));
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
        expect(openSelection(changesOpen)).toBe(changesOpen);
        expect(openSelection(changeFileOpen)).toBe(changeFileOpen);
    });

    test("opens the selected Commit link and makes the changes pane active", () => {
        expect(openSelection({
            ...initialRepoExplorerState,
            selectedLink: COMMIT_LINK,
        })).toEqual(changesOpen);
    });

    test("opens the selected changed file and makes its file pane active", () => {
        expect(openSelection({
            ...changesOpen,
            selectedChange: changeKey(true, "notes.txt"),
        })).toEqual({
            ...changesOpen,
            activePaneIndex: 2,
            selectedChange: changeKey(true, "notes.txt"),
            openChange: changeKey(true, "notes.txt"),
        });
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
        expect(closeRightmostPane(commitsOpen)).toEqual(closeLinkPane(commitsOpen));
    });

    test("closes a changed file's pane and makes the changes pane active", () => {
        expect(closeRightmostPane({
            ...changeFileOpen,
            activePaneIndex: 0,
        })).toEqual({
            ...changeFileOpen,
            activePaneIndex: 1,
            openChange: undefined,
        });
    });

    test("closes the changes pane and makes the repo details pane active", () => {
        expect(closeRightmostPane(changesOpen)).toEqual(closeLinkPane(changesOpen));
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

    test("Down in the commit's file list shows the next file's diff at once, and Enter then makes the file pane active", () => {
        const fileOpen: IRepoExplorerState = {
            ...allOpen,
            activePaneIndex: 2,
            selectedPath: "README.md",
            openPath: "README.md",
        };
        const down = explorerStateAfterKey(fileOpen, "ArrowDown", items);
        expect(down.openPath).toBe("notes.txt");
        expect(down.activePaneIndex).toBe(2);
        const enter = explorerStateAfterKey(down, "Enter", items);
        expect(enter.openPath).toBe("notes.txt");
        expect(enter.activePaneIndex).toBe(3);
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

    test("Down and Up in the commit pane open the newly selected commit while its details are open", () => {
        const state: IRepoExplorerState = {
            ...detailsOpen,
            activePaneIndex: 1,
        };
        const afterDown = explorerStateAfterKey(state, "ArrowDown", items);
        expect(afterDown.selectedHash).toBe("ccc");
        expect(afterDown.openHash).toBe("ccc");
        expect(afterDown.activePaneIndex).toBe(1);
        const afterUp = explorerStateAfterKey(state, "ArrowUp", items);
        expect(afterUp.selectedHash).toBe("aaa");
        expect(afterUp.openHash).toBe("aaa");
    });

    test("Enter on the commit whose details are open makes the commit details pane active", () => {
        const afterDown = explorerStateAfterKey({
            ...detailsOpen,
            activePaneIndex: 1,
        }, "ArrowDown", items);
        expect(explorerStateAfterKey(afterDown, "Enter", items)).toEqual({
            ...detailsOpen,
            selectedHash: "ccc",
            openHash: "ccc",
        });
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

//
// The working tree's changes as the working changes task gives them: notes.txt modified and
// unstaged and old.txt deleted and staged.
//
const changesJson = {
    unstaged: [{
        status: "M",
        path: "notes.txt",
    }],
    staged: [{
        status: "D",
        path: "old.txt",
    }],
};

describe("changeKeysOf", () => {
    test("lists the unstaged rows then the staged rows, or none before the changes are read", () => {
        expect(changeKeysOf(changesJson)).toEqual(["unstaged:notes.txt", "staged:old.txt"]);
        expect(changeKeysOf(undefined)).toEqual([]);
    });
});

describe("findChange", () => {
    test("finds the row with the key in either list and nothing for no key or a row that has gone", () => {
        expect(findChange(changesJson, "unstaged:notes.txt")).toEqual({
            file: changesJson.unstaged[0],
            isStaged: false,
        });
        expect(findChange(changesJson, "staged:old.txt")).toEqual({
            file: changesJson.staged[0],
            isStaged: true,
        });
        expect(findChange(changesJson, "staged:notes.txt")).toBeUndefined();
        expect(findChange(changesJson, undefined)).toBeUndefined();
        expect(findChange(undefined, "staged:old.txt")).toBeUndefined();
    });
});
