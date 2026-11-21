//
// Tests reading the working tree's changes in the frontend: the working changes task queued
// through a fake window.ziggy made of Jest mocks and how the task's result is checked and turned
// into the unstaged and staged files, including every way it can fail, and the count of changed
// files the changes pane's header shows.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { changedFileCount, isWorkingFile, readWorkingChanges, workingChangesFromTaskResult } from "../../lib/working-changes";
import { installFakeTaskZiggy } from "../fake-ziggy";

//
// Makes the result of a working changes task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "working-changes",
        inputs: null,
    };
}

describe("readWorkingChanges", () => {
    test("queues the working changes task as interactive and gives the lists when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onRead = jest.fn();
        readWorkingChanges({
            taskId: "t1",
            repoPath: "/repo",
        }, onRead);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "working-changes",
            source: "repo-explorer-page",
            data: {
                repoPath: "/repo",
            },
            priority: "interactive",
        });

        const callback: (event: ITaskCompletedEvent) => void = (ziggy.onTaskCompleted as jest.Mock).mock.calls[0][0];
        callback({
            taskId: "other",
            result: succeededResult(null),
        });
        expect(onRead).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                unstaged: [{
                    status: "M",
                    path: "notes.txt",
                }],
                staged: [],
            }),
        });
        expect(ziggy.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: {
                unstaged: [{
                    status: "M",
                    path: "notes.txt",
                }],
                staged: [],
            },
        });
    });
});

describe("workingChangesFromTaskResult", () => {
    test("gives the task's error message when it failed", () => {
        expect(workingChangesFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git status failed.",
            type: "working-changes",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git status failed.",
            },
        });
    });

    test("says the task gave no reason when it failed without a message", () => {
        expect(workingChangesFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "working-changes",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The working changes task failed with no description of the error. Graft's log has the details.",
            },
        });
    });

    test("refuses a result that is not the two lists of files", () => {
        const notChanges: ITaskResult["outputs"][] = [
            null,
            "text",
            {
                unstaged: "notes.txt",
                staged: [],
            },
            {
                unstaged: [],
                staged: [{
                    path: "notes.txt",
                }],
            },
        ];
        for (const outputs of notChanges) {
            const result = workingChangesFromTaskResult(succeededResult(outputs));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.name).toBe("UnexpectedOutput");
            }
        }
    });
});

describe("isWorkingFile", () => {
    test("accepts a file with a status and a path and refuses anything else", () => {
        expect(isWorkingFile({
            status: "?",
            path: "new.txt",
        })).toBe(true);
        expect(isWorkingFile(null)).toBe(false);
        expect(isWorkingFile("new.txt")).toBe(false);
        expect(isWorkingFile({
            status: 1,
            path: "new.txt",
        })).toBe(false);
        expect(isWorkingFile({
            status: "A",
        })).toBe(false);
    });
});

describe("changedFileCount", () => {
    test("counts each changed file once, even when it is in both lists", () => {
        expect(changedFileCount({
            unstaged: [
                {
                    status: "M",
                    path: "notes.txt",
                },
                {
                    status: "?",
                    path: "new.txt",
                },
            ],
            staged: [{
                status: "M",
                path: "notes.txt",
            }],
        })).toBe(2);
        expect(changedFileCount({
            unstaged: [],
            staged: [],
        })).toBe(0);
    });
});
