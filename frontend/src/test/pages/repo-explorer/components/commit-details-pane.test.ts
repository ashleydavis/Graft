//
// Tests the commit details pane: renders it with a fake window.ziggy made of Jest mocks and checks
// that it queues the commit details task for the commit, shows that it is loading, then shows the
// "Commit details" row above the changed files, with each file's change type and line counts in
// its tooltip, and leaves the commit's message and facts to the "Commit details" pane, or shows why
// they could not be read, and that clicking the row, a file or the close button reports it. It
// checks the row and each changed file are MaterialUI ListItemButtons with the selected one set as
// selected and the open one marked open, that the pane reports the commit it read and that its
// border is in the style guide's active pane colour while it is active, and that the pane's
// scrolling area scrolls to show the selected row each time the selection changes. It checks a
// changed file's pinnable file tooltip pins with P and closes with Escape. It also checks the
// colour, name and meaning of each change type and the text of the line counts.
// It checks the maximise button reports a click, sits before the close button and the card fills
// the repo explorer while maximised.
// It checks the collapse button and the strip drawn while the pane is collapsed, which still reads
// the commit.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { IChangedFile } from "../../../../lib/commit-details";
import { createElement, ReactElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { ICommitJson } from "../../../../lib/commits";
import { maximisedPaneClasses } from "../../../../pages/repo-explorer/components/pane-width";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { COMMIT_DETAILS_PATH } from "../../../../lib/repo-explorer";
import { CommitDetailsPane, FileTip, lineCountsText, IVerticalEdges, scrollRowIntoView, scrollTopShowingRow, statusColorClass, statusTip } from "../../../../pages/repo-explorer/components/commit-details-pane";
import { openRowClasses } from "../../../../pages/repo-explorer/components/commit-list";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../../fake-ziggy";

//
// Where the tests place the pane's scrolling area and each changed file's row, by data-id, in
// pixels from the top of the window: the area runs from 100 to 400, notes.txt sits below it and
// logo.png above it. jsdom lays out no page, so getBoundingClientRect is mocked to return these.
//
const placedEdges: Record<string, IVerticalEdges> = {
    "commit-details-scroll": {
        top: 100,
        bottom: 400,
    },
    "changed-file-notes.txt": {
        top: 380,
        bottom: 420,
    },
    "changed-file-docs/new.md": {
        top: 200,
        bottom: 240,
    },
    "changed-file-logo.png": {
        top: 50,
        bottom: 90,
    },
    "commit-details-row": {
        top: 20,
        bottom: 60,
    },
};

//
// Makes the bounds the mock reports for an element with the edges, zero wide. jsdom has no
// DOMRect class to make one with, so it is built field by field.
//
function rectWithEdges(edges: IVerticalEdges): DOMRect {
    return {
        x: 0,
        y: edges.top,
        width: 0,
        height: edges.bottom - edges.top,
        top: edges.top,
        bottom: edges.bottom,
        left: 0,
        right: 0,
        toJSON(): string {
            return JSON.stringify(edges);
        },
    };
}

beforeEach(() => {
    jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function placedRect(this: Element): DOMRect {
        const edges = placedEdges[this.getAttribute("data-id") ?? ""];
        if (edges) {
            return rectWithEdges(edges);
        }
        return rectWithEdges({
            top: 0,
            bottom: 0,
        });
    });
});

afterEach(() => {
    jest.restoreAllMocks();
});

//
// Gives the pane's scrolling area a scrollTop the tests can set and read, starting at the value,
// because jsdom keeps every element's scrollTop at 0, and returns the area.
//
function scrollAreaAt(scrollTop: number): HTMLElement {
    const area = document.querySelector<HTMLElement>("[data-id=\"commit-details-scroll\"]");
    expect(area).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    const found = area as HTMLElement;
    Object.defineProperty(found, "scrollTop", {
        value: scrollTop,
        writable: true,
        configurable: true,
    });
    return found;
}

//
// The hash of the commit the pane shows.
//
const commitHash = "1111111111111111111111111111111111111111";

//
// Ends the task the pane queued, as the backend does, with the result.
//
function completeTask(ziggy: FakeTaskZiggy, result: ITaskCompletedEvent["result"]): void {
    const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
    const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[0][0];
    act(() => {
        onTaskCompleted({
            taskId: task.taskId,
            result: {
                ...result,
                taskId: task.taskId,
            },
        });
    });
}

//
// Builds the commit as the commit details task gives it, with the parents and the description.
//
function commitJson(parentHashes: string[], description: string): ICommitJson {
    return {
        hash: commitHash,
        parentHashes,
        refs: [],
        authorName: "Ada Author",
        authorEmail: "ada@example.com",
        authorDate: "2026-01-03T09:00:00Z",
        committerName: "Cy Committer",
        committerEmail: "cy@example.com",
        committerDate: "2026-01-03T09:00:01Z",
        title: "Change the note",
        description,
    };
}

//
// Builds the result of a commit details task that read a commit with the parents, the description
// and three changed files: one modified, one added and one binary file deleted.
//
function succeededResult(parentHashes: string[], description: string): ITaskCompletedEvent["result"] {
    return {
        taskId: "",
        status: "succeeded",
        outputs: {
            commit: { ...commitJson(parentHashes, description) },
            changedFiles: [
                {
                    status: "M",
                    path: "notes.txt",
                    linesAdded: 1,
                    linesDeleted: 2,
                    isBinary: false,
                },
                {
                    status: "A",
                    path: "docs/new.md",
                    linesAdded: 12,
                    linesDeleted: 0,
                    isBinary: false,
                },
                {
                    status: "D",
                    path: "logo.png",
                    linesAdded: 0,
                    linesDeleted: 0,
                    isBinary: true,
                },
            ],
        },
        type: "commit-details",
        inputs: null,
    };
}

//
// Builds the result of a commit details task that read a merge commit, for which git lists no
// files.
//
function mergeResult(): ITaskCompletedEvent["result"] {
    return {
        taskId: "",
        status: "succeeded",
        outputs: {
            commit: { ...commitJson(["2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"], "") },
            changedFiles: [],
        },
        type: "commit-details",
        inputs: null,
    };
}

//
// Renders the pane for the commit with the selected file, the file whose diff is open the same one,
// active or not, with the callbacks.
//
function renderPane(selectedPath: string | undefined, onSelectFile: jest.Mock, onClose: jest.Mock, isActive: boolean, onReadCommit: jest.Mock): void {
    render(paneElement(selectedPath, onSelectFile, onClose, isActive, onReadCommit));
}

//
// Makes the pane renderPane renders, so a test can render it again with another selected file.
//
function paneElement(selectedPath: string | undefined, onSelectFile: jest.Mock, onClose: jest.Mock, isActive: boolean, onReadCommit: jest.Mock): ReactElement {
    return createElement(CommitDetailsPane, {
        repoPath: "/repo",
        hash: commitHash,
        selectedPath,
        openPath: selectedPath,
        isActive,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        isCollapsed: false,
        onToggleCollapse: jest.fn(),
        onSelectFile,
        onReadCommit,
        onClose,
        width: undefined,
    });
}

//
// Finds the element with the data-id, failing the test when the pane does not show it.
//
function elementWithDataId(dataId: string): Element {
    const element = document.querySelector(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as Element;
}

describe("CommitDetailsPane", () => {
    test("queues the commit details task for the commit and shows that it is loading under its heading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        expect(screen.getByText("Loading the commit.").getAttribute("data-id")).toBe("commit-details-loading");
        expect(elementWithDataId("commit-details-heading").textContent).toBe("Commit1111111");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commit-details");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitHash,
        });
    });

    test("shows the Commit details row with the message icon above the changed files, without the message or facts", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult(["2222222222222222222222222222222222222222"], "The note now says\nwhat the second note is."));
        const row = elementWithDataId("commit-details-row");
        expect(row.textContent).toBe("Commit details");
        expect(row.querySelector("svg")?.getAttribute("data-icon")).toBe("message");
        expect(row.compareDocumentPosition(elementWithDataId("changed-files-heading")) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
        expect(elementWithDataId("commit-details").firstElementChild?.contains(row)).toBe(true);
        expect(document.querySelector("[data-id=\"commit-details-title\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"commit-details-description\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"commit-details-author\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"commit-details-committer\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"commit-details-hash\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"commit-details-parents\"]")).toBeNull();
        expect(elementWithDataId("commit-details").textContent).not.toContain("Change the note");
    });

    test("draws the Commit details row as a MaterialUI ListItemButton in a list item, selected and open when its pane is", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(COMMIT_DETAILS_PATH, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        const row = elementWithDataId("commit-details-row");
        expect(row.tagName).toBe("LI");
        expect(row.className).toContain("MuiListItemButton-root");
        expect(row.className).toContain("Mui-selected");
        expect(row.className).toContain(openRowClasses);
        expect(row.getAttribute("aria-current")).toBe("true");
        expect(elementWithDataId("changed-file-notes.txt").className).not.toContain("Mui-selected");
    });

    test("draws the Commit details row unselected and closed while a file is", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane("notes.txt", jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        const row = elementWithDataId("commit-details-row");
        expect(row.className).not.toContain("Mui-selected");
        expect(row.className).not.toContain(openRowClasses);
        expect(row.getAttribute("aria-current")).toBeNull();
    });

    test("reports the Commit details row's path when the user clicks it", () => {
        const ziggy = installFakeTaskZiggy();
        const onSelectFile = jest.fn();
        renderPane(undefined, onSelectFile, jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        fireEvent.click(elementWithDataId("commit-details-row"));
        expect(onSelectFile).toHaveBeenCalledWith(COMMIT_DETAILS_PATH);
    });

    test("scrolls its area to show the Commit details row when it is selected", () => {
        const ziggy = installFakeTaskZiggy();
        const { rerender } = render(paneElement("notes.txt", jest.fn(), jest.fn(), true, jest.fn()));
        const area = scrollAreaAt(500);
        completeTask(ziggy, succeededResult([], ""));
        expect(area.scrollTop).toBe(520);
        rerender(paneElement(COMMIT_DETAILS_PATH, jest.fn(), jest.fn(), true, jest.fn()));
        expect(area.scrollTop).toBe(440);
    });

    test("lists the changed files by their icon and path", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(screen.getByText("Files changed (3)").getAttribute("data-id")).toBe("changed-files-heading");
        expect(elementWithDataId("changed-file-notes.txt").textContent).toBe("notes.txt");
        expect(elementWithDataId("changed-file-docs/new.md").textContent).toBe("docs/new.md");
        expect(elementWithDataId("changed-file-logo.png").textContent).toBe("logo.png");
        expect(elementWithDataId("changed-file-notes.txt").querySelector("svg")?.getAttribute("data-icon")).toBe("file-lines");
        expect(document.querySelector("[data-id=\"changed-files-none\"]")).toBeNull();
    });

    test("shows that no files changed for a merge commit, for which git lists none", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, mergeResult());
        expect(screen.getByText("Files changed (0)")).toBeTruthy();
        expect(elementWithDataId("changed-files-none").textContent).toBe("No files changed in this commit.");
        expect(elementWithDataId("commit-details-row").textContent).toBe("Commit details");
    });

    test("shows a changed file's pinnable file tooltip, which P pins and Escape closes", async () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        fireEvent.mouseOver(screen.getByText("new.md"));
        const tip = await screen.findByText("Added", {
            selector: "[data-id=\"changed-file-docs/new.md-tip\"] span",
        });
        expect(tip.closest("[data-id=\"changed-file-docs/new.md-tip\"]")?.textContent).toContain("Pathdocs/new.md");
        fireEvent.keyDown(document.body, {
            key: "p",
        });
        expect(elementWithDataId("changed-file-docs/new.md-tip-pin").getAttribute("aria-pressed")).toBe("true");
        fireEvent.mouseLeave(screen.getByText("new.md"));
        expect(document.querySelector("[data-id=\"changed-file-docs/new.md-tip\"]")).not.toBeNull();
        fireEvent.keyDown(document.body, {
            key: "Escape",
        });
        await waitFor(() => {
            expect(document.querySelector("[data-id=\"changed-file-docs/new.md-tip\"]")).toBeNull();
        });
    });

    test("shows the selected changed file as selected and the open one with the open bar", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane("notes.txt", jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(elementWithDataId("changed-file-notes.txt").className).toContain("Mui-selected");
        expect(elementWithDataId("changed-file-notes.txt").className).toContain(openRowClasses);
        expect(elementWithDataId("changed-file-notes.txt").getAttribute("aria-current")).toBe("true");
        expect(elementWithDataId("changed-file-logo.png").className).not.toContain("Mui-selected");
        expect(elementWithDataId("changed-file-logo.png").className).not.toContain(openRowClasses);
    });

    test("scrolls its area to show the selected file's row once the files are read, and each newly selected row after it", () => {
        const ziggy = installFakeTaskZiggy();
        const { rerender } = render(paneElement("notes.txt", jest.fn(), jest.fn(), true, jest.fn()));
        const area = scrollAreaAt(500);
        completeTask(ziggy, succeededResult([], ""));
        expect(area.scrollTop).toBe(520);
        rerender(paneElement("logo.png", jest.fn(), jest.fn(), true, jest.fn()));
        expect(area.scrollTop).toBe(470);
        rerender(paneElement("docs/new.md", jest.fn(), jest.fn(), true, jest.fn()));
        expect(area.scrollTop).toBe(470);
    });

    test("leaves its area where it is while no file is selected", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        const area = scrollAreaAt(500);
        completeTask(ziggy, succeededResult([], ""));
        expect(area.scrollTop).toBe(500);
    });

    test("draws each changed file as a MaterialUI ListItemButton in a list item", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(elementWithDataId("changed-file-notes.txt").tagName).toBe("LI");
        expect(elementWithDataId("changed-file-notes.txt").className).toContain("MuiListItemButton-root");
        expect(elementWithDataId("changed-files").className).toContain("MuiList-root");
    });

    test("reports the commit and its changed files once the task has read them", () => {
        const ziggy = installFakeTaskZiggy();
        const onReadCommit = jest.fn();
        renderPane(undefined, jest.fn(), jest.fn(), false, onReadCommit);
        expect(onReadCommit).not.toHaveBeenCalled();
        completeTask(ziggy, succeededResult([], ""));
        expect(onReadCommit).toHaveBeenCalledTimes(1);
        expect(onReadCommit.mock.calls[0][0].commit.title).toBe("Change the note");
        expect(onReadCommit.mock.calls[0][0].changedFiles.map((file: IChangedFile) => file.path)).toEqual(["notes.txt", "docs/new.md", "logo.png"]);
    });

    test("draws its border in the style guide's active pane colour while it is active", () => {
        installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), true, jest.fn());
        expect(document.querySelector<HTMLElement>("[data-id=\"commit-details-pane\"]")?.className).toContain(activePaneClasses);
    });

    test("keeps its grey border while it is not active", () => {
        installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        expect(document.querySelector<HTMLElement>("[data-id=\"commit-details-pane\"]")?.className).not.toContain(activePaneClasses);
    });

    test("reports the path of the changed file the user clicks", () => {
        const ziggy = installFakeTaskZiggy();
        const onSelectFile = jest.fn();
        renderPane(undefined, onSelectFile, jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        fireEvent.click(screen.getByText("notes.txt"));
        expect(onSelectFile).toHaveBeenCalledWith("notes.txt");
    });

    test("reports that the user closed it", () => {
        const onClose = jest.fn();
        installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), onClose, false, jest.fn());
        fireEvent.click(elementWithDataId("commit-details-close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("says why the commit could not be read when the task failed", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git log failed.",
            type: "commit-details",
            inputs: null,
        });
        expect(screen.getByText("Running git log failed.").getAttribute("data-id")).toBe("commit-details-error");
    });
});

describe("scrollRowIntoView", () => {
    test("scrolls nothing when the row is not drawn or sits outside a scrolling area", () => {
        const row = document.createElement("li");
        document.body.appendChild(row);
        const scrollTop = document.body.scrollTop;
        scrollRowIntoView(null, "commit-details-scroll");
        scrollRowIntoView(row, "commit-details-scroll");
        expect(document.body.scrollTop).toBe(scrollTop);
        row.remove();
    });
});

describe("scrollTopShowingRow", () => {
    test("scrolls up by as much as the row sits above the area", () => {
        expect(scrollTopShowingRow(300, {
            top: 80,
            bottom: 120,
        }, {
            top: 100,
            bottom: 400,
        })).toBe(280);
    });

    test("scrolls down by as much as the row sits below the area", () => {
        expect(scrollTopShowingRow(300, {
            top: 390,
            bottom: 430,
        }, {
            top: 100,
            bottom: 400,
        })).toBe(330);
    });

    test("leaves the scroll as it is when the row is in view, including on the area's edges", () => {
        expect(scrollTopShowingRow(300, {
            top: 100,
            bottom: 400,
        }, {
            top: 100,
            bottom: 400,
        })).toBe(300);
    });
});

describe("statusColorClass", () => {
    test("colours added in the success colour, deleted in the danger colour and every other change in the warning colour", () => {
        expect(statusColorClass("A")).toBe("text-[var(--color-success)]");
        expect(statusColorClass("D")).toBe("text-[var(--color-danger)]");
        expect(statusColorClass("M")).toBe("text-[var(--color-warning)]");
        expect(statusColorClass("T")).toBe("text-[var(--color-warning)]");
    });
});

describe("statusTip", () => {
    test("names each change type and says what it means, any other letter as modified", () => {
        expect(statusTip("A").title).toBe("Added");
        expect(statusTip("D").title).toBe("Deleted");
        expect(statusTip("T").title).toBe("Type changed");
        expect(statusTip("M")).toEqual({
            title: "Modified",
            detail: "The file's lines changed.",
        });
    });
});

//
// A modified text file, for the line counts and the tooltip.
//
const modifiedFile: IChangedFile = {
    status: "M",
    path: "docs/notes.txt",
    linesAdded: 9,
    linesDeleted: 2,
    isBinary: false,
};

describe("lineCountsText", () => {
    test("writes the lines added and deleted, or that the file is binary", () => {
        expect(lineCountsText(modifiedFile)).toBe("+9 −2");
        expect(lineCountsText({
            ...modifiedFile,
            linesAdded: 0,
            linesDeleted: 0,
            isBinary: true,
        })).toBe("Binary file");
    });
});

describe("FileTip", () => {
    test("shows the change type in its colour, its name, the line counts and the pin button, what it means and the path with its copy button", () => {
        const { container } = render(createElement(FileTip, {
            file: modifiedFile,
            pinButton: createElement("button", {
                "data-id": "the-pin",
            }, "Pin"),
        }));
        expect(container.textContent).toBe("MModified+9 −2PinThe file's lines changed.Pathdocs/notes.txt");
        expect(screen.getByText("M").className).toContain("text-[var(--color-warning)]");
        expect(screen.getByText("Pin").parentElement?.textContent).toBe("MModified+9 −2Pin");
        expect(screen.getByLabelText("Copy path")).toBeTruthy();
    });
});

describe("CommitDetailsPane maximise button", () => {
    test("reports a click, sits before the close button and fills the repo explorer while the pane is maximised", () => {
        installFakeTaskZiggy();
        const onToggleMaximise = jest.fn();
        const { container } = render(createElement(CommitDetailsPane, {
            repoPath: "/repo",
            hash: commitHash,
            selectedPath: undefined,
            openPath: undefined,
            isActive: true,
            isMaximised: true,
            onToggleMaximise,
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            onSelectFile: jest.fn(),
            onReadCommit: jest.fn(),
            onClose: jest.fn(),
            width: undefined,
        }));
        expect(container.querySelector("[data-id=\"commit-details-pane\"]")?.className).toContain(maximisedPaneClasses);
        expect(container.querySelector("[data-id=\"commit-details-maximise\"] + [data-id=\"commit-details-close\"]")).not.toBeNull();
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("data-id")).toBe("commit-details-maximise");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });
});

describe("CommitDetailsPane collapse", () => {
    //
    // Makes the pane for the commit, collapsed or not, with the callbacks.
    //
    function collapsiblePane(isCollapsed: boolean, onToggleCollapse: jest.Mock, onReadCommit: jest.Mock): ReactElement {
        return createElement(CommitDetailsPane, {
            repoPath: "/repo",
            hash: commitHash,
            selectedPath: undefined,
            openPath: undefined,
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed,
            onToggleCollapse,
            onSelectFile: jest.fn(),
            onReadCommit,
            onClose: jest.fn(),
            width: undefined,
        });
    }

    test("shows its collapse button before its close button and reports a click on it", () => {
        installFakeTaskZiggy();
        const onToggleCollapse = jest.fn();
        render(collapsiblePane(false, onToggleCollapse, jest.fn()));
        expect(elementWithDataId("commit-details-pane-collapse").nextElementSibling?.getAttribute("data-id")).toBe("commit-details-maximise");
        fireEvent.click(elementWithDataId("commit-details-pane-collapse"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("draws the strip with Commit and the short hash down it while it is collapsed and still reads the commit's files", () => {
        const ziggy = installFakeTaskZiggy();
        const onToggleCollapse = jest.fn();
        const onReadCommit = jest.fn();
        render(collapsiblePane(true, onToggleCollapse, onReadCommit));
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
        expect(elementWithDataId("commit-details-pane-strip").getAttribute("aria-label")).toBe("Commit details");
        expect(elementWithDataId("commit-details-pane-strip-title").textContent).toBe("Commit 1111111");
        completeTask(ziggy, succeededResult([], ""));
        expect(onReadCommit).toHaveBeenCalledTimes(1);
        fireEvent.click(elementWithDataId("commit-details-pane-restore"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("shows the commit it read while collapsed as soon as it is restored", () => {
        const ziggy = installFakeTaskZiggy();
        const { rerender } = render(collapsiblePane(true, jest.fn(), jest.fn()));
        completeTask(ziggy, succeededResult([], ""));
        rerender(collapsiblePane(false, jest.fn(), jest.fn()));
        expect(elementWithDataId("commit-details-pane")).not.toBeNull();
        expect((ziggy.addTask as jest.Mock).mock.calls.length).toBe(1);
    });
});
