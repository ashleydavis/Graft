//
// Tests the commit details pane: renders it with a fake window.ziggy made of Jest mocks and checks that
// it queues the commit details task for the commit, shows that it is loading, then shows the
// commit's full message, author, committer, dates, parents and changed files with their change type
// and line counts, or shows why they could not be read, and that clicking a file or the close
// button reports it. It checks each changed file is a MaterialUI ListItemButton with the selected
// file's set as selected, that the pane reports the paths it read and that its border is in the
// style guide's active pane colour while it is active. It also checks the text of the parents and the colour
// of each change type.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { ICommitJson } from "../../../../lib/commits";
import { activePaneClasses } from "../../../../pages/commits/components/active-pane-style";
import { CommitDetailsPane, parentsText, statusColorClass } from "../../../../pages/commits/components/commit-details-pane";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../../fake-ziggy";

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
// Renders the pane for the commit with the selected file, active or not, with the callbacks, in
// en-US and UTC.
//
function renderPane(selectedPath: string | undefined, onSelectFile: jest.Mock, onClose: jest.Mock, isActive: boolean, onReadFiles: jest.Mock): void {
    render(createElement(CommitDetailsPane, {
        repoPath: "/repo",
        hash: commitHash,
        selectedPath,
        isActive,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectFile,
        onReadFiles,
        onClose,
    }));
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

//
// Turns every kind of space in the text into a plain space. Node's ICU puts a narrow no-break
// space before AM and PM where Bun's puts a plain one, so the tests compare times with this to get
// the same result whichever runs them.
//
function plainSpaces(text: string | null | undefined): string {
    return (text ?? "").replace(/\s/g, " ");
}

describe("CommitDetailsPane", () => {
    test("queues the commit details task for the commit and shows that it is loading under its heading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        expect(screen.getByText("Loading the commit.").getAttribute("data-id")).toBe("commit-details-loading");
        expect(screen.getByText("Commit").getAttribute("data-id")).toBe("commit-details-heading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commit-details");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitHash,
        });
    });

    test("shows the commit's full message, author, committer, dates, hash and parent once the task has read them", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult(["2222222222222222222222222222222222222222"], "The note now says\nwhat the second note is."));
        expect(elementWithDataId("commit-details-title").textContent).toBe("Change the note");
        expect(elementWithDataId("commit-details-description").textContent).toBe("The note now says\nwhat the second note is.");
        expect(plainSpaces(elementWithDataId("commit-details-author").textContent)).toBe("Authored by Ada Author <ada@example.com> on 1/3/2026, 9:00:00 AM");
        expect(plainSpaces(elementWithDataId("commit-details-committer").textContent)).toBe("Committed by Cy Committer <cy@example.com> on 1/3/2026, 9:00:01 AM");
        expect(elementWithDataId("commit-details-hash").textContent).toBe(commitHash);
        expect(elementWithDataId("commit-details-parents").textContent).toBe("Parent: 2222222");
    });

    test("shows no description when the message is only a title", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(document.querySelector("[data-id=\"commit-details-description\"]")).toBeNull();
        expect(elementWithDataId("commit-details-parents").textContent).toBe("Parents: none");
    });

    test("lists the changed files with their change type and line counts, or binary", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(screen.getByText("Files changed (3)").getAttribute("data-id")).toBe("changed-files-heading");
        expect(elementWithDataId("changed-file-notes.txt").textContent).toBe("Mnotes.txt+1 -2");
        expect(elementWithDataId("changed-file-docs/new.md").textContent).toBe("Adocs/new.md+12 -0");
        expect(elementWithDataId("changed-file-logo.png").textContent).toBe("Dlogo.pngbinary");
        expect(document.querySelector("[data-id=\"changed-files-none\"]")).toBeNull();
    });

    test("shows that no files changed for a merge commit, for which git lists none", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, mergeResult());
        expect(screen.getByText("Files changed (0)")).toBeTruthy();
        expect(elementWithDataId("changed-files-none").textContent).toBe("No files changed in this commit.");
        expect(elementWithDataId("commit-details-parents").textContent).toBe("Parents: 2222222, 3333333");
    });

    test("shows the selected changed file with MaterialUI's selection styling", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane("notes.txt", jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(elementWithDataId("changed-file-notes.txt").className).toContain("Mui-selected");
        expect(elementWithDataId("changed-file-logo.png").className).not.toContain("Mui-selected");
    });

    test("draws each changed file as a MaterialUI ListItemButton in a list item", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(undefined, jest.fn(), jest.fn(), false, jest.fn());
        completeTask(ziggy, succeededResult([], ""));
        expect(elementWithDataId("changed-file-notes.txt").tagName).toBe("LI");
        expect(elementWithDataId("changed-file-notes.txt").className).toContain("MuiListItemButton-root");
        expect(elementWithDataId("changed-files").className).toContain("MuiList-root");
    });

    test("reports the paths of the changed files once the task has read them", () => {
        const ziggy = installFakeTaskZiggy();
        const onReadFiles = jest.fn();
        renderPane(undefined, jest.fn(), jest.fn(), false, onReadFiles);
        expect(onReadFiles).not.toHaveBeenCalled();
        completeTask(ziggy, succeededResult([], ""));
        expect(onReadFiles).toHaveBeenCalledWith(["notes.txt", "docs/new.md", "logo.png"]);
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

describe("parentsText", () => {
    test("writes no parents as none, one as Parent and several as Parents, each as its short hash", () => {
        expect(parentsText([])).toBe("Parents: none");
        expect(parentsText(["2222222222222222222222222222222222222222"])).toBe("Parent: 2222222");
        expect(parentsText(["2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"])).toBe("Parents: 2222222, 3333333");
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
