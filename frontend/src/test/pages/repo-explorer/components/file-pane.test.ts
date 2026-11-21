//
// Tests the file pane: renders it with a fake window.ziggy made of Jest mocks and checks that it
// queues the file diff task for the file, shows only the file's name in its title, shows that it
// is loading, then shows the diff's lines numbered and coloured by kind, each hunk's lines in a
// group of their own, or says why it could not be read. It checks that the close button reports
// it and that the pane's border is in the style guide's active pane colour while it is active,
// with the card kept to its border.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { activeFlatPaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { FilePane } from "../../../../pages/repo-explorer/components/file-pane";
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
// Renders the pane for notes.txt in the commit, active or not, with the close callback.
//
function renderPane(onClose: jest.Mock, isActive: boolean): void {
    render(createElement(FilePane, {
        repoPath: "/repo",
        hash: commitHash,
        path: "notes.txt",
        isActive,
        onClose,
    }));
}

//
// Reports whether the pane's card carries the active pane's border classes.
//
function isPaneMarkedActive(): boolean {
    return document.querySelector<HTMLElement>("[data-id=\"file-pane\"]")?.className.includes(activeFlatPaneClasses) ?? false;
}

describe("FilePane", () => {
    test("shows only the last part of a nested path in its title, with the full path in its tooltip", () => {
        installFakeTaskZiggy();
        render(createElement(FilePane, {
            repoPath: "/repo",
            hash: commitHash,
            path: "docs/guide/setup.md",
            isActive: false,
            onClose: jest.fn(),
        }));
        const title = document.querySelector("[data-id=\"file-pane-path\"]");
        expect(title?.textContent).toBe("setup.md");
        expect(title?.parentElement?.getAttribute("title")).toBe("docs/guide/setup.md");
    });

    test("queues the file diff task for the file and shows its name and that it is loading", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), false);
        expect(document.querySelector("[data-id=\"file-pane-path\"]")?.textContent).toBe("notes.txt");
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitHash,
            path: "notes.txt",
        });
    });

    test("shows each line of the diff as a row numbered and coloured by its kind once the task has read it", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), false);
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                diff: "--- a/notes.txt\n+++ b/notes.txt\n@@ -1,2 +1,2 @@\n-The first note.\n+The second note.\n Kept.\n",
            },
            type: "file-diff",
            inputs: null,
        });
        const rows = Array.from(document.querySelectorAll("[data-id=\"file-diff\"] [role=\"row\"]"));
        expect(rows.map(row => row.getAttribute("data-line"))).toEqual(["meta", "meta", "hunk", "deleted", "added", "context"]);
        expect(rows.map(row => row.textContent)).toEqual([
            "--- a/notes.txt",
            "+++ b/notes.txt",
            "@@ -1,2 +1,2 @@",
            "1−The first note.",
            "1+The second note.",
            "22Kept.",
        ]);
        expect(rows[3].className).toContain("bg-[image:linear-gradient(var(--color-diff-removed),var(--color-diff-removed))]");
        expect(rows[4].className).toContain("bg-[image:linear-gradient(var(--color-diff-added),var(--color-diff-added))]");
        expect(rows[4].className).toContain("bg-[position:var(--space-1)_0]");
        expect(rows[2].className).toContain("bg-[var(--color-raised)]");
        const hunkGroups = Array.from(document.querySelectorAll("[data-id=\"file-diff\"] [role=\"rowgroup\"]"));
        expect(hunkGroups.length).toBe(1);
        expect(hunkGroups[0].className).toContain("py-[var(--space-2)]");
        expect(Array.from(hunkGroups[0].children).map(row => row.getAttribute("data-line"))).toEqual(["deleted", "added", "context"]);
    });

    test("says why the diff could not be read when the task failed", () => {
        const ziggy = installFakeTaskZiggy();
        renderPane(jest.fn(), false);
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
        renderPane(onClose, false);
        const close = screen.getByLabelText("Close file diff");
        expect(close.getAttribute("data-id")).toBe("file-pane-close");
        fireEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("draws its border in the style guide's active pane colour while it is active", () => {
        installFakeTaskZiggy();
        renderPane(jest.fn(), true);
        expect(isPaneMarkedActive()).toBe(true);
    });

    test("has no shadow, active or not", () => {
        installFakeTaskZiggy();
        renderPane(jest.fn(), true);
        renderPane(jest.fn(), false);
        const panes = Array.from(document.querySelectorAll<HTMLElement>("[data-id=\"file-pane\"]"));
        expect(panes.length).toBe(2);
        expect(panes.map(pane => pane.className.includes("--shadow-raised"))).toEqual([false, false]);
    });

    test("keeps its grey border while it is not active", () => {
        installFakeTaskZiggy();
        renderPane(jest.fn(), false);
        expect(isPaneMarkedActive()).toBe(false);
    });
});
