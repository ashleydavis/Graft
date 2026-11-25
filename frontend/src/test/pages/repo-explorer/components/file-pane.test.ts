//
// Tests the file pane: renders it with a fake window.ziggy made of Jest mocks and checks that it
// queues the file diff task for the file, shows only the file's name in its title, shows that it
// is loading, then shows the diff's lines numbered and coloured by kind, each hunk's lines in a
// group of their own, or says why it could not be read. It checks that the close button reports
// it and that the pane's border is in the style guide's active pane colour while it is active,
// with the card kept to its border.
// It checks the maximise button reports a click, sits before the close button and the card fills
// the repo explorer while maximised.
// It checks the collapse button and the strip drawn while the pane is collapsed.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { activeFlatPaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { maximisedPaneClasses } from "../../../../pages/repo-explorer/components/pane-width";
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
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        isCollapsed: false,
        onToggleCollapse: jest.fn(),
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
    test("shows only the last part of a nested path in its title, with the full path in its tooltip", async () => {
        installFakeTaskZiggy();
        render(createElement(FilePane, {
            repoPath: "/repo",
            hash: commitHash,
            path: "docs/guide/setup.md",
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            onClose: jest.fn(),
        }));
        const title = document.querySelector("[data-id=\"file-pane-path\"]");
        expect(title?.textContent).toBe("setup.md");
        expect(title?.parentElement?.hasAttribute("title")).toBe(false);
        fireEvent.mouseOver(screen.getByText("setup.md"));
        const tip = await screen.findByText("docs/guide/setup.md");
        expect(tip.getAttribute("data-id")).toBe("file-pane-path-tip");
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

    test("starts at 840 pixels wide, or the page's visible area less its margins, and grows to fill its column", () => {
        installFakeTaskZiggy();
        renderPane(jest.fn(), false);
        const classes = document.querySelector<HTMLElement>("[data-id=\"file-pane\"]")?.className.split(" ");
        expect(classes).toContain("w-[min(840px,calc(100cqw-var(--space-6)*2))]");
        expect(classes).toContain("flex-[1_0_auto]");
        expect(classes).not.toContain("flex-none");
    });

    test("keeps its grey border while it is not active", () => {
        installFakeTaskZiggy();
        renderPane(jest.fn(), false);
        expect(isPaneMarkedActive()).toBe(false);
    });
});

describe("FilePane maximise button", () => {
    test("reports a click, sits before the close button and fills the repo explorer while the pane is maximised", () => {
        installFakeTaskZiggy();
        const onToggleMaximise = jest.fn();
        render(createElement(FilePane, {
            repoPath: "/repo",
            hash: commitHash,
            path: "notes.txt",
            isActive: true,
            isMaximised: true,
            onToggleMaximise,
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            onClose: jest.fn(),
        }));
        expect(document.querySelector("[data-id=\"file-pane\"]")?.className).toContain(maximisedPaneClasses);
        expect(document.querySelector("[data-id=\"file-pane-maximise\"] + [data-id=\"file-pane-close\"]")).not.toBeNull();
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("data-id")).toBe("file-pane-maximise");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });
});

describe("FilePane collapse", () => {
    //
    // Renders the pane for docs/guide/setup.md in the commit, collapsed or not, with the collapse
    // callback.
    //
    function renderCollapsiblePane(isCollapsed: boolean, onToggleCollapse: jest.Mock): void {
        render(createElement(FilePane, {
            repoPath: "/repo",
            hash: commitHash,
            path: "docs/guide/setup.md",
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed,
            onToggleCollapse,
            onClose: jest.fn(),
        }));
    }

    test("shows its collapse button before its maximise button and reports a click on it", () => {
        installFakeTaskZiggy();
        const onToggleCollapse = jest.fn();
        renderCollapsiblePane(false, onToggleCollapse);
        const collapse = document.querySelector<HTMLElement>("[data-id=\"file-pane-collapse\"]");
        expect(collapse?.nextElementSibling?.getAttribute("data-id")).toBe("file-pane-maximise");

        //
        // The cast is safe because the expect above fails the test when the button is not drawn, and a
        // type guard cannot narrow it because Jest's expect does not narrow the type.
        //
        fireEvent.click(collapse as HTMLElement);
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("draws the strip with the file's name down it in its place while it is collapsed, and reports a click on its restore button", () => {
        installFakeTaskZiggy();
        const onToggleCollapse = jest.fn();
        renderCollapsiblePane(true, onToggleCollapse);
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"file-pane-strip\"]")?.getAttribute("aria-label")).toBe("File diff");
        expect(document.querySelector("[data-id=\"file-pane-strip-title\"]")?.textContent).toBe("setup.md");
        fireEvent.click(screen.getByLabelText("Restore file diff"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
});
