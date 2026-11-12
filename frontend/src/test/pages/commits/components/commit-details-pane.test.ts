//
// Tests the commit details pane: renders it with a fake window.ziggy made of Jest mocks and checks that
// it queues the commit details task for the commit, shows that it is loading, then shows the
// commit's details and changed files or says why they could not be read and that clicking a file
// or the close button reports it.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { CommitDetailsPane } from "../../../../pages/commits/components/commit-details-pane";
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
// The result of a commit details task that read a commit with the parents and one changed file.
//
function succeededResult(parentHashes: string[]): ITaskCompletedEvent["result"] {
    return {
        taskId: "",
        status: "succeeded",
        outputs: {
            commit: {
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
                description: "The note now says what the second note is.",
            },
            changedFiles: [{
                status: "M",
                path: "notes.txt",
            }],
        },
        type: "commit-details",
        inputs: null,
    };
}

//
// Renders the pane for the commit with the callbacks.
//
function renderPane(onSelectFile: jest.Mock, onClose: jest.Mock): void {
    render(createElement(CommitDetailsPane, {
        repoPath: "/repo",
        hash: commitHash,
        onSelectFile,
        onClose,
    }));
}

describe("CommitDetailsPane", () => {
    test("queues the commit details task for the commit and shows that it is loading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), jest.fn());
        expect(screen.getByText("Loading the commit.").getAttribute("data-id")).toBe("commit-details-loading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commit-details");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitHash,
        });
    });

    test("shows the commit's details and changed files once the task has read them", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), jest.fn());
        completeTask(ziggy, succeededResult(["2222222222222222222222222222222222222222"]));
        expect(screen.getByText("Change the note").getAttribute("data-id")).toBe("commit-details-title");
        expect(screen.getByText("The note now says what the second note is.").getAttribute("data-id")).toBe("commit-details-description");
        expect(screen.getByText(`Hash: ${commitHash}`).getAttribute("data-id")).toBe("commit-details-hash");
        expect(screen.getByText("Parents: 2222222222222222222222222222222222222222").getAttribute("data-id")).toBe("commit-details-parents");
        expect(screen.getByText("Author: Ada Author (ada@example.com) on 2026-01-03T09:00:00.000Z").getAttribute("data-id")).toBe("commit-details-author");
        expect(screen.getByText("Committer: Cy Committer (cy@example.com) on 2026-01-03T09:00:01.000Z").getAttribute("data-id")).toBe("commit-details-committer");
        expect(screen.getByText("M notes.txt").getAttribute("data-id")).toBe("changed-file-notes.txt");
    });

    test("says a commit with no parents has none", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), jest.fn());
        completeTask(ziggy, succeededResult([]));
        expect(screen.getByText("Parents: none").getAttribute("data-id")).toBe("commit-details-parents");
    });

    test("reports the path of the changed file the user clicks", () => {
        const ziggy = installFakeTaskZiggy();
        const onSelectFile = jest.fn();
        renderPane(onSelectFile, jest.fn());
        completeTask(ziggy, succeededResult(["2222222222222222222222222222222222222222"]));
        fireEvent.click(screen.getByText("M notes.txt"));
        expect(onSelectFile).toHaveBeenCalledWith("notes.txt");
    });

    test("reports that the user closed it", () => {
        const onClose = jest.fn();
        installFakeTaskZiggy();
        renderPane(jest.fn(), onClose);
        fireEvent.click(screen.getByText("Close"));
        expect(onClose).toHaveBeenCalledTimes(1);
        expect(screen.getByText("Close").getAttribute("data-id")).toBe("commit-details-close");
    });

    test("says why the commit could not be read when the task failed", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), jest.fn());
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
