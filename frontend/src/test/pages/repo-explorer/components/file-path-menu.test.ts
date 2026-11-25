//
// Tests the file path menu: renders it inside a row with a fake window.ziggy made of Jest mocks and
// a fake clipboard, then opens it with its button and checks its items and their order, the file
// manager item's name for the platform Ziggy reports, that a copy item copies its text and shows
// the tick, that the open items queue the backend's tasks and show why an open failed, that
// Escape, Tab, a click outside and a second click on the button close it and that no click on the
// button or the menu reaches the row.
//

import { act, fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import type { IAddTask, IPlatformInfo, ITaskCompletedEvent } from "ziggy";
import { COPIED_DURATION_MS } from "../../../../components/copy-button";
import { FilePathMenu } from "../../../../pages/repo-explorer/components/file-path-menu";
import { installFakeZiggy } from "../../../fake-ziggy";

//
// The calls of window.ziggy the menu makes, each a Jest mock.
//
interface IFakeMenuZiggy {
    // Returns the platform the menu names its file manager item for.
    getPlatform: jest.Mock;

    // Queues an open file task.
    addTask: jest.Mock;

    // Adds the listener that receives the open file task's end.
    onTaskCompleted: jest.Mock;

    // Removes that listener.
    removeTaskCompletedListener: jest.Mock;
}

//
// Makes the fake window.ziggy whose getPlatform returns the platform with the operating system.
//
function installMenuZiggy(os: string): IFakeMenuZiggy {
    const platform: IPlatformInfo = {
        platformKind: "desktop",
        os,
        arch: "x86_64",
    };
    return installFakeZiggy({
        getPlatform: jest.fn().mockResolvedValue(platform),
        addTask: jest.fn(),
        onTaskCompleted: jest.fn(),
        removeTaskCompletedListener: jest.fn(),
    });
}

//
// Puts a fake clipboard on the navigator whose writeText is the mock, because jsdom has none.
//
function installFakeClipboard(writeText: jest.Mock): void {
    Object.defineProperty(navigator, "clipboard", {
        value: {
            writeText,
        },
        configurable: true,
    });
}

//
// Renders the menu for docs/a.md in /repo inside a row whose click, mouse down and key down are
// the mocks, so a test sees whether an event reached the row.
//
function renderMenu(onRowClick: jest.Mock, onRowMouseDown: jest.Mock, onRowKeyDown: jest.Mock): void {
    render(createElement("div", {
        "data-id": "row",
        onClick: onRowClick,
        onMouseDown: onRowMouseDown,
        onKeyDown: onRowKeyDown,
    }, createElement(FilePathMenu, {
        repoPath: "/repo",
        path: "docs/a.md",
        dataId: "the-menu",
    })));
}

//
// Returns the element with the data-id, wherever it is in the document, as the menu shows in a
// popper outside the row.
//
function elementOf(dataId: string): HTMLElement | undefined {
    return document.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

//
// Clicks the menu's button and waits for the platform to be read, so the items show.
//
async function openMenu(): Promise<void> {
    await act(async () => {
        elementOf("the-menu")?.click();
    });
}

//
// Ends the open file task the menu queued, as the backend does, with the result.
//
function completeTask(ziggy: IFakeMenuZiggy, result: ITaskCompletedEvent["result"]): void {
    const task: IAddTask = ziggy.addTask.mock.calls[0][0];
    const onTaskCompleted = ziggy.onTaskCompleted.mock.calls[0][0];
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

describe("FilePathMenu", () => {
    afterEach(() => {
        jest.useRealTimers();
    });

    test("shows a closed button named for the file, with the copy icon and a chevron", () => {
        installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        const button = elementOf("the-menu");
        expect(button?.getAttribute("aria-label")).toBe("Path actions for a.md");
        expect(button?.getAttribute("aria-expanded")).toBe("false");
        expect(button?.querySelector("svg[data-icon=\"copy\"]")).not.toBeNull();
        expect(button?.querySelector("svg[data-icon=\"chevron-down\"]")).not.toBeNull();
        expect(elementOf("file-path-menu")).toBeUndefined();
    });

    test("lists the copy items, a divider, the file manager item and Open in editor, in that order", async () => {
        installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        expect(elementOf("the-menu")?.getAttribute("aria-expanded")).toBe("true");
        const children = Array.from(elementOf("file-path-menu")?.querySelector("ul")?.children ?? []);
        const items = children.map(child => child.getAttribute("data-id") ?? child.tagName);
        expect(items).toEqual([
            "file-path-menu-copy-full",
            "file-path-menu-copy-relative",
            "file-path-menu-copy-name",
            "HR",
            "file-path-menu-file-manager",
            "file-path-menu-editor",
        ]);
        expect(elementOf("file-path-menu-copy-full")?.textContent).toBe("Copy full file path");
        expect(elementOf("file-path-menu-copy-relative")?.textContent).toBe("Copy relative file path");
        expect(elementOf("file-path-menu-copy-name")?.textContent).toBe("Copy file name");
        expect(elementOf("file-path-menu-file-manager")?.textContent).toBe("Open in file manager");
        expect(elementOf("file-path-menu-editor")?.textContent).toBe("Open in editor");
    });

    test("names the file manager item for the platform Ziggy reports", async () => {
        installMenuZiggy("macos");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        expect(elementOf("file-path-menu-file-manager")?.textContent).toBe("Reveal in Finder");
    });

    test("reads the platform once, however often the menu opens", async () => {
        const ziggy = installMenuZiggy("windows");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        await openMenu();
        expect(elementOf("file-path-menu")).toBeUndefined();
        await openMenu();
        expect(elementOf("file-path-menu-file-manager")?.textContent).toBe("Show in Explorer");
        expect(ziggy.getPlatform).toHaveBeenCalledTimes(1);
    });

    test("shows why when the platform cannot be read", async () => {
        installFakeZiggy({
            getPlatform: jest.fn().mockRejectedValue(new Error("no bridge")),
        });
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        expect(elementOf("file-path-menu-error")?.textContent).toBe("Graft could not read which platform it runs on: Error: no bridge. Close the menu and open it again.");
        expect(elementOf("file-path-menu-editor")).toBeUndefined();
    });

    test("copies the full path, closes and shows the tick in the success colour for a moment", async () => {
        jest.useFakeTimers();
        installMenuZiggy("linux");
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        await act(async () => {
            elementOf("file-path-menu-copy-full")?.click();
        });
        expect(writeText).toHaveBeenCalledWith("/repo/docs/a.md");
        expect(elementOf("file-path-menu")).toBeUndefined();
        const button = elementOf("the-menu");
        expect(button?.getAttribute("aria-label")).toBe("Copied");
        expect(button?.querySelector("svg[data-icon=\"check\"]")).not.toBeNull();
        expect(button?.classList.contains("text-[var(--color-success)]")).toBe(true);
        act(() => {
            jest.advanceTimersByTime(COPIED_DURATION_MS);
        });
        expect(button?.getAttribute("aria-label")).toBe("Path actions for a.md");
        expect(button?.querySelector("svg[data-icon=\"copy\"]")).not.toBeNull();
    });

    test("copies the relative path and the file name", async () => {
        installMenuZiggy("linux");
        const writeText = jest.fn().mockResolvedValue(undefined);
        installFakeClipboard(writeText);
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        await act(async () => {
            elementOf("file-path-menu-copy-relative")?.click();
        });
        await openMenu();
        await act(async () => {
            elementOf("file-path-menu-copy-name")?.click();
        });
        expect(writeText.mock.calls).toEqual([
            ["docs/a.md"],
            ["a.md"],
        ]);
    });

    test("queues the file manager task and closes once the file is shown", async () => {
        const ziggy = installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        act(() => {
            elementOf("file-path-menu-file-manager")?.click();
        });
        const task: IAddTask = ziggy.addTask.mock.calls[0][0];
        expect(task.taskType).toBe("show-file-in-file-manager");
        expect(task.data).toEqual({
            repoPath: "/repo",
            path: "docs/a.md",
        });
        expect(elementOf("file-path-menu")).not.toBeUndefined();
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                path: "docs/a.md",
            },
            type: "show-file-in-file-manager",
            inputs: null,
        });
        expect(elementOf("file-path-menu")).toBeUndefined();
    });

    test("queues the editor task and shows the backend's reason when it fails", async () => {
        const ziggy = installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        act(() => {
            elementOf("file-path-menu-editor")?.click();
        });
        const task: IAddTask = ziggy.addTask.mock.calls[0][0];
        expect(task.taskType).toBe("open-file-in-editor");
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "`code /repo/docs/a.md` exited with code 1 and gave no reason.",
            outputs: null,
            type: "open-file-in-editor",
            inputs: null,
        });
        expect(elementOf("file-path-menu-error")?.textContent).toBe("`code /repo/docs/a.md` exited with code 1 and gave no reason.");
        expect(elementOf("file-path-menu-editor")).not.toBeUndefined();
    });

    test("closes with Escape or Tab and puts the keyboard back on the button", async () => {
        installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        fireEvent.keyDown(elementOf("file-path-menu-copy-full") ?? document.body, {
            key: "Escape",
        });
        expect(elementOf("file-path-menu")).toBeUndefined();
        expect(document.activeElement).toBe(elementOf("the-menu"));
        await openMenu();
        fireEvent.keyDown(elementOf("file-path-menu-copy-full") ?? document.body, {
            key: "Tab",
        });
        expect(elementOf("file-path-menu")).toBeUndefined();
    });

    test("stays open for other keys", async () => {
        installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        fireEvent.keyDown(elementOf("file-path-menu-copy-full") ?? document.body, {
            key: "ArrowDown",
        });
        expect(elementOf("file-path-menu")).not.toBeUndefined();
    });

    test("closes on a click outside and stays open on a touch of its own button", async () => {
        installMenuZiggy("linux");
        renderMenu(jest.fn(), jest.fn(), jest.fn());
        await openMenu();
        act(() => {
            fireEvent.touchEnd(elementOf("the-menu") ?? document.body);
        });
        expect(elementOf("file-path-menu")).not.toBeUndefined();
        act(() => {
            fireEvent.mouseDown(document.body);
        });
        expect(elementOf("file-path-menu")).toBeUndefined();
    });

    test("keeps every click, mouse down and key on the button and the menu from the row", async () => {
        installMenuZiggy("linux");
        installFakeClipboard(jest.fn().mockResolvedValue(undefined));
        const onRowClick = jest.fn();
        const onRowMouseDown = jest.fn();
        const onRowKeyDown = jest.fn();
        renderMenu(onRowClick, onRowMouseDown, onRowKeyDown);
        fireEvent.mouseDown(elementOf("the-menu") ?? document.body);
        await openMenu();
        fireEvent.mouseDown(elementOf("file-path-menu-copy-name") ?? document.body);
        fireEvent.keyDown(elementOf("file-path-menu-copy-name") ?? document.body, {
            key: "ArrowDown",
        });
        await act(async () => {
            elementOf("file-path-menu-copy-name")?.click();
        });
        expect(onRowClick).not.toHaveBeenCalled();
        expect(onRowMouseDown).not.toHaveBeenCalled();
        expect(onRowKeyDown).not.toHaveBeenCalled();
    });
});
