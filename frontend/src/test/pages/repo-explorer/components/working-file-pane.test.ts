//
// Tests the working file pane: renders it with a fake window.ziggy made of Jest mocks and checks
// that it queues the working file diff task for the file and its list, shows the file's name alone
// and that it is loading, then the diff or why it could not be read, and that the close button
// reports it.
// It checks the maximise button reports a click and the card fills the repo explorer while
// maximised.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { maximisedPaneClasses } from "../../../../pages/repo-explorer/components/pane-width";
import { WorkingFilePane } from "../../../../pages/repo-explorer/components/working-file-pane";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../../fake-ziggy";

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
// Renders the pane for the untracked file docs/new.txt in the unstaged list, with the close
// callback.
//
function renderPane(onClose: jest.Mock): void {
    render(createElement(WorkingFilePane, {
        repoPath: "/repo",
        file: {
            status: "?",
            path: "docs/new.txt",
        },
        isStaged: false,
        isActive: true,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        onClose,
    }));
}

describe("WorkingFilePane", () => {
    test("queues the working file diff task for the file and its list and shows the file's name alone and that it is loading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        expect(document.querySelector("[data-id=\"file-pane-path\"]")?.textContent).toBe("new.txt");
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("working-file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            path: "docs/new.txt",
            isStaged: false,
            status: "?",
        });
    });

    test("shows the diff once the task has read it", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                diff: "--- /dev/null\n+++ b/docs/new.txt\n@@ -0,0 +1 @@\n+A new file.\n",
            },
            type: "working-file-diff",
            inputs: null,
        });
        expect(document.querySelector("[data-id=\"file-diff\"]")?.textContent).toContain("A new file.");
        expect(document.querySelector("[data-line=\"added\"]")).not.toBeNull();
    });

    test("says why the diff could not be read when the task failed", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git diff failed.",
            type: "working-file-diff",
            inputs: null,
        });
        expect(document.querySelector("[data-id=\"file-diff-error\"]")?.textContent).toBe("Running git diff failed.");
    });

    test("reports a click on its close button", () => {
        installFakeTaskZiggy();
        const onClose = jest.fn();
        renderPane(onClose);
        fireEvent.click(screen.getByLabelText("Close file diff"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("WorkingFilePane maximise button", () => {
    test("reports a click and fills the repo explorer while the pane is maximised", () => {
        installFakeTaskZiggy();
        const onToggleMaximise = jest.fn();
        render(createElement(WorkingFilePane, {
            repoPath: "/repo",
            file: {
                status: "M",
                path: "notes.txt",
            },
            isStaged: true,
            isActive: true,
            isMaximised: true,
            onToggleMaximise,
            onClose: jest.fn(),
        }));
        expect(document.querySelector("[data-id=\"file-pane\"]")?.className).toContain(maximisedPaneClasses);
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("data-id")).toBe("file-pane-maximise");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });
});
