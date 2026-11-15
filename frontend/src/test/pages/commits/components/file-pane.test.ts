//
// Tests the file pane: renders it with a fake window.ziggy made of Jest mocks and checks that it queues
// the file diff task for the file, shows that it is loading, then shows the diff or says why it
// could not be read and that the close button reports it.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { FilePane } from "../../../../pages/commits/components/file-pane";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../../fake-ziggy";

//
// The hash of the commit that changed the file.
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
// Renders the pane for notes.txt in the commit with the close callback.
//
function renderPane(onClose: jest.Mock): void {
    render(createElement(FilePane, {
        repoPath: "/repo",
        hash: commitHash,
        path: "notes.txt",
        onClose,
    }));
}

describe("FilePane", () => {
    test("queues the file diff task for the file and shows its path and that it is loading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        expect(screen.getByText("notes.txt").getAttribute("data-id")).toBe("file-pane-path");
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitHash,
            path: "notes.txt",
        });
    });

    test("shows the diff as git wrote it once the task has read it", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                diff: "-The first note.\n+The second note.\n",
            },
            type: "file-diff",
            inputs: null,
        });
        expect(screen.getByText(/The second note/).textContent).toBe("-The first note.\n+The second note.\n");
        expect(screen.getByText(/The second note/).getAttribute("data-id")).toBe("file-diff");
    });

    test("says why the diff could not be read when the task failed", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git diff-tree failed.",
            type: "file-diff",
            inputs: null,
        });
        expect(screen.getByText("Running git diff-tree failed.").getAttribute("data-id")).toBe("file-diff-error");
    });

    test("reports that the user closed it", () => {
        const onClose = jest.fn();
        installFakeTaskZiggy();
        renderPane(onClose);
        const close = screen.getByLabelText("Close");
        expect(close.getAttribute("data-id")).toBe("file-pane-close");
        fireEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
