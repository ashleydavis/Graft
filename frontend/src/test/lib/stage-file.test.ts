//
// Tests staging and unstaging a file in the frontend: the stage file and unstage file tasks queued
// through a fake window.ziggy made of Jest mocks and how the task's result is checked and turned
// into the moved file's path, including every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { stagedPathFromTaskResult, stageTaskType, toggleFileStaged } from "../../lib/stage-file";
import { installFakeTaskZiggy } from "../fake-ziggy";

//
// Makes the result of a stage file task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "stage-file",
        inputs: null,
    };
}

describe("toggleFileStaged", () => {
    test("queues the stage file task for an unstaged file and gives its path when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onDone = jest.fn();
        toggleFileStaged({
            taskId: "t1",
            repoPath: "/repo",
            path: "notes.txt",
            isStaged: false,
        }, onDone);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "stage-file",
            source: "changes-pane",
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

    test("queues the unstage file task for a staged file", () => {
        const ziggy = installFakeTaskZiggy();
        toggleFileStaged({
            taskId: "t1",
            repoPath: "/repo",
            path: "notes.txt",
            isStaged: true,
        }, jest.fn());
        expect((ziggy.addTask as jest.Mock).mock.calls[0][0].taskType).toBe("unstage-file");
    });
});

describe("stageTaskType", () => {
    test("unstages a staged file and stages an unstaged one", () => {
        expect(stageTaskType(true)).toBe("unstage-file");
        expect(stageTaskType(false)).toBe("stage-file");
    });
});

describe("stagedPathFromTaskResult", () => {
    test("gives the task's error message when it failed", () => {
        expect(stagedPathFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git add failed.",
            type: "stage-file",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git add failed.",
            },
        });
    });

    test("says the task gave no reason when it failed without a message", () => {
        expect(stagedPathFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "stage-file",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Staging or unstaging the file failed with no description of the error. Graft's log has the details.",
            },
        });
    });

    test("refuses a result that is not a file's path", () => {
        const notPaths: ITaskResult["outputs"][] = [
            null,
            "notes.txt",
            {
                path: 1,
            },
        ];
        for (const outputs of notPaths) {
            const result = stagedPathFromTaskResult(succeededResult(outputs));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.name).toBe("UnexpectedOutput");
            }
        }
    });
});
