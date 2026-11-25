//
// Tests what the file path menu offers: the file manager item's name on each platform, the text
// each copy item copies, the open file tasks queued through a fake window.ziggy made of Jest mocks
// and how a task's result is turned into the opened file's path or why it was not opened.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { copyItems, fileManagerLabel, fileName, fullFilePath, openedPathFromTaskResult, openFile } from "../../lib/file-path-menu";
import { installFakeTaskZiggy } from "../fake-ziggy";

//
// Makes the result of an open file task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "open-file-in-editor",
        inputs: null,
    };
}

describe("fileManagerLabel", () => {
    test("names the file manager item as the style guide does on each platform", () => {
        expect(fileManagerLabel("macos")).toBe("Reveal in Finder");
        expect(fileManagerLabel("windows")).toBe("Show in Explorer");
        expect(fileManagerLabel("linux")).toBe("Open in file manager");
    });
});

describe("fullFilePath", () => {
    test("joins the repo's path and the file's path with / off Windows", () => {
        expect(fullFilePath({
            repoPath: "/repos/graft",
            path: "docs/a.md",
            os: "linux",
        })).toBe("/repos/graft/docs/a.md");
        expect(fullFilePath({
            repoPath: "/repos/graft/",
            path: "a.md",
            os: "macos",
        })).toBe("/repos/graft/a.md");
    });

    test("joins them with \\ on Windows", () => {
        expect(fullFilePath({
            repoPath: "C:\\repos\\graft\\",
            path: "docs/a.md",
            os: "windows",
        })).toBe("C:\\repos\\graft\\docs\\a.md");
    });
});

describe("fileName", () => {
    test("is the part of the path after the last slash", () => {
        expect(fileName("docs/guide/a.md")).toBe("a.md");
        expect(fileName("a.md")).toBe("a.md");
    });
});

describe("copyItems", () => {
    test("copies the full path, the relative path and the name, in that order", () => {
        expect(copyItems({
            repoPath: "/repo",
            path: "docs/a.md",
            os: "linux",
        })).toEqual([
            {
                label: "Copy full file path",
                dataId: "file-path-menu-copy-full",
                text: "/repo/docs/a.md",
            },
            {
                label: "Copy relative file path",
                dataId: "file-path-menu-copy-relative",
                text: "docs/a.md",
            },
            {
                label: "Copy file name",
                dataId: "file-path-menu-copy-name",
                text: "a.md",
            },
        ]);
    });
});

describe("openFile", () => {
    test("queues the editor task and gives the file's path when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onDone = jest.fn();
        openFile({
            taskId: "t1",
            repoPath: "/repo",
            path: "notes.txt",
            target: "editor",
        }, onDone);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "open-file-in-editor",
            source: "repo-explorer-page",
            data: {
                repoPath: "/repo",
                path: "notes.txt",
            },
            priority: "interactive",
        });

        const callback: (event: ITaskCompletedEvent) => void = (ziggy.onTaskCompleted as jest.Mock).mock.calls[0][0];
        callback({
            taskId: "other",
            result: succeededResult(null),
        });
        expect(onDone).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                path: "notes.txt",
            }),
        });
        expect(ziggy.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onDone).toHaveBeenCalledWith({
            ok: true,
            value: "notes.txt",
        });
    });

    test("queues the file manager task for the file manager item", () => {
        const ziggy = installFakeTaskZiggy();
        openFile({
            taskId: "t1",
            repoPath: "/repo",
            path: "notes.txt",
            target: "file-manager",
        }, jest.fn());
        expect((ziggy.addTask as jest.Mock).mock.calls[0][0].taskType).toBe("show-file-in-file-manager");
    });
});

describe("openedPathFromTaskResult", () => {
    test("gives the backend's text when the task failed", () => {
        expect(openedPathFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "`xdg-open /repo/a.md` exited with code 4.",
            type: "open-file-in-editor",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "`xdg-open /repo/a.md` exited with code 4.",
            },
        });
    });

    test("points to the log for the details when a failed task gave no text", () => {
        const result = openedPathFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "open-file-in-editor",
            inputs: null,
        });
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.message).toContain("Graft's log has the details.");
        }
    });

    test("refuses a result that is not a file's path", () => {
        for (const outputs of [null, "notes.txt", { path: 5 }]) {
            const result = openedPathFromTaskResult(succeededResult(outputs));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.name).toBe("UnexpectedOutput");
            }
        }
    });
});
