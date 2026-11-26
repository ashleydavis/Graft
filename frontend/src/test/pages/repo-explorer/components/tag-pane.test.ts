//
// Tests the tag pane: renders it for the tag v1.0 with a fake window.ziggy made of Jest mocks and
// checks that it queues the tag details task for the tag, shows that it is loading, then shows a
// lightweight tag's name and commit, an annotated tag's message, commit, tagger and date, or why
// the tag could not be read. It checks the card is titled with the tag's name, marks the pane
// active with a border in the style guide's active pane colour and that its close button reports
// the close.
//

import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { formatDateTime } from "../../../../lib/date-format";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { TagPane } from "../../../../pages/repo-explorer/components/tag-pane";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../../fake-ziggy";

//
// The hash of the commit the tag points at.
//
const COMMIT_HASH = "1111111111111111111111111111111111111111";

//
// The locale and time zone the tests show dates in, so the text is the same on every machine.
//
const DATE_FORMAT = {
    locale: "en-US",
    timeZone: "UTC",
};

//
// Renders the tag pane for the tag v1.0 of the repo at /repo, active or not, with the close
// callback, and returns the container.
//
function renderPane(isActive: boolean, onClose: jest.Mock): HTMLElement {
    const { container } = render(createElement(TagPane, {
        repoPath: "/repo",
        tagName: "v1.0",
        isActive,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        isCollapsed: false,
        onToggleCollapse: jest.fn(),
        dateFormat: DATE_FORMAT,
        onClose,
    }));
    return container;
}

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
// Reads the text of the element with the data-id in the container, or undefined when it is not
// there.
//
function textOf(container: HTMLElement, dataId: string): string | undefined {
    return container.querySelector(`[data-id="${dataId}"]`)?.textContent ?? undefined;
}

describe("TagPane", () => {
    test("queues the tag details task for the tag and shows that it is loading, titled with the tag's name", () => {
        const ziggy = installFakeTaskZiggy();
        const container = renderPane(false, jest.fn());
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("tag-details");
        expect(task.data).toEqual({
            repoPath: "/repo",
            name: "v1.0",
        });
        expect(textOf(container, "tag-heading")).toBe("Tagv1.0");
        expect(textOf(container, "tag-loading")).toBe("Loading the tag.");
    });

    test("shows a lightweight tag's name and the commit's short hash and title, with no tagger or message", () => {
        const ziggy = installFakeTaskZiggy();
        const container = renderPane(false, jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                name: "v1.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Add the notes",
            },
            type: "tag-details",
            inputs: null,
        });
        expect(textOf(container, "tag-name")).toBe("v1.0");
        expect(textOf(container, "tag-commit-hash")).toBe("1111111");
        expect(textOf(container, "tag-commit-title")).toBe("Add the notes");
        expect(textOf(container, "tag-tagger")).toBeUndefined();
        expect(textOf(container, "tag-message-title")).toBeUndefined();
        expect(textOf(container, "tag-loading")).toBeUndefined();
    });

    test("shows an annotated tag's message, commit, tagger and date", () => {
        const ziggy = installFakeTaskZiggy();
        const container = renderPane(false, jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                name: "v1.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Add the notes",
                annotation: {
                    taggerName: "Tia Tagger",
                    taggerEmail: "tia@example.com",
                    taggerDate: "2026-01-02T03:04:05+00:00",
                    title: "Release one",
                    description: "The first line.\nThe second line.",
                },
            },
            type: "tag-details",
            inputs: null,
        });
        expect(textOf(container, "tag-message-title")).toBe("Release one");
        expect(textOf(container, "tag-message-description")).toBe("The first line.\nThe second line.");
        expect(textOf(container, "tag-commit")).toBe("1111111 Add the notes");
        const date = formatDateTime(new Date("2026-01-02T03:04:05+00:00"), DATE_FORMAT);
        expect(textOf(container, "tag-tagger")).toBe(`Tia Tagger <tia@example.com>${date}`);
    });

    test("leaves out the description of an annotated tag whose message is only a title", () => {
        const ziggy = installFakeTaskZiggy();
        const container = renderPane(false, jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                name: "v1.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Add the notes",
                annotation: {
                    taggerName: "Tia Tagger",
                    taggerEmail: "tia@example.com",
                    taggerDate: "2026-01-02T03:04:05+00:00",
                    title: "Release one",
                    description: "",
                },
            },
            type: "tag-details",
            inputs: null,
        });
        expect(textOf(container, "tag-message-title")).toBe("Release one");
        expect(textOf(container, "tag-message-description")).toBeUndefined();
    });

    test("shows why the tag could not be read", () => {
        const ziggy = installFakeTaskZiggy();
        const container = renderPane(false, jest.fn());
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            outputs: null,
            type: "tag-details",
            inputs: null,
            errorMessage: "That tag is not one of the repo's tags.",
        });
        expect(textOf(container, "tag-error")).toBe("That tag is not one of the repo's tags.");
        expect(textOf(container, "tag-details")).toBeUndefined();
    });

    test("draws its border in the style guide's active pane colour only while it is active", () => {
        installFakeTaskZiggy();
        const active = renderPane(true, jest.fn());
        expect(active.querySelector("[data-id=\"tag-pane\"]")?.className).toContain(activePaneClasses);
        const inactive = renderPane(false, jest.fn());
        expect(inactive.querySelector("[data-id=\"tag-pane\"]")?.className).not.toContain(activePaneClasses);
    });

    test("reports the close when the user clicks its close button", () => {
        installFakeTaskZiggy();
        const onClose = jest.fn();
        const container = renderPane(false, onClose);
        const closeButton = container.querySelector("[data-id=\"tag-close\"]");
        expect(closeButton).not.toBeNull();

        //
        // The cast is safe because the expect above fails the test on null, and a type guard
        // cannot narrow it because Jest's expect does not narrow the type.
        //
        fireEvent.click(closeButton as Element);
        expect(onClose).toHaveBeenCalledTimes(1);
    });

    test("draws the strip with Tag and the tag's name down it while it is collapsed and reports a click on its restore button", () => {
        installFakeTaskZiggy();
        const onToggleCollapse = jest.fn();
        const { container } = render(createElement(TagPane, {
            repoPath: "/repo",
            tagName: "v1.0",
            isActive: true,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed: true,
            onToggleCollapse,
            dateFormat: DATE_FORMAT,
            onClose: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"tag-pane\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"tag-pane-strip-title\"]")?.textContent).toBe("Tag v1.0");
        fireEvent.click(container.querySelector("[data-id=\"tag-pane-restore\"]") as Element);
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("reports a click on its maximise button and has no collapse button while it is maximised", () => {
        installFakeTaskZiggy();
        const onToggleMaximise = jest.fn();
        const { container } = render(createElement(TagPane, {
            repoPath: "/repo",
            tagName: "v1.0",
            isActive: true,
            isMaximised: true,
            onToggleMaximise,
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            dateFormat: DATE_FORMAT,
            onClose: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"tag-pane-collapse\"]")).toBeNull();
        fireEvent.click(container.querySelector("[data-id=\"tag-maximise\"]") as Element);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });
});
