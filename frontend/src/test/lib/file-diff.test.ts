//
// Tests reading a file's diff in the frontend: the file diff task queued through a fake bridge
// made of Jest mocks and how the task's result is checked and turned into the diff, including
// every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { CommitsBridge } from "../../lib/commits";
import { fileDiffFromTaskResult, readFileDiff } from "../../lib/file-diff";

//
// Makes the result of a file diff task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "file-diff",
        inputs: null,
    };
}

//
// Makes a fake bridge whose functions are Jest mocks.
//
function makeBridge(): CommitsBridge {
    return {
        addTask: jest.fn(),
        onTaskCompleted: jest.fn(),
        removeTaskCompletedListener: jest.fn(),
    };
}

describe("readFileDiff", () => {
    test("queues the file diff task as interactive and gives the diff when it ends", () => {
        const bridge = makeBridge();
        const onRead = jest.fn();
        readFileDiff(bridge, {
            taskId: "t1",
            repoPath: "/repo",
            hash: "abc123",
            path: "notes.txt",
        }, onRead);
        expect(bridge.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "file-diff",
            source: "commits-page",
            data: {
                repoPath: "/repo",
                hash: "abc123",
                path: "notes.txt",
            },
            priority: "interactive",
        });

        const onTaskCompleted = bridge.onTaskCompleted as jest.Mock;
        expect(onTaskCompleted).toHaveBeenCalledTimes(1);
        const callback: (event: ITaskCompletedEvent) => void = onTaskCompleted.mock.calls[0][0];
        callback({
            taskId: "other",
            result: succeededResult(null),
        });
        expect(onRead).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                diff: "+The second note.\n",
            }),
        });
        expect(bridge.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: "+The second note.\n",
        });
    });
});

describe("fileDiffFromTaskResult", () => {
    test("gives the task's error message when it failed", () => {
        expect(fileDiffFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git diff-tree failed.",
            type: "file-diff",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git diff-tree failed.",
            },
        });
    });

    test("says the task gave no reason when it failed without a message", () => {
        expect(fileDiffFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "file-diff",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The file diff task failed without saying why. Graft's log may say more.",
            },
        });
    });

    test("refuses a result that is not a diff", () => {
        const notDiffs: ITaskResult["outputs"][] = [
            null,
            "text",
            {
                diff: 1,
            },
        ];
        for (const outputs of notDiffs) {
            const result = fileDiffFromTaskResult(succeededResult(outputs));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.name).toBe("UnexpectedOutput");
            }
        }
    });
});
