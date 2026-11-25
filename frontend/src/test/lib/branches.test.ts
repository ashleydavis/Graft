//
// Tests reading a repo's local branches in the frontend: the branches task queued through a fake
// window.ziggy made of Jest mocks and how the task's result is checked and turned into the
// branches, including every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { branchesFromTaskResult, isBranch, isBranchList, readBranches } from "../../lib/branches";
import { installFakeTaskZiggy } from "../fake-ziggy";

//
// Makes the result of a branches task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "branches",
        inputs: null,
    };
}

describe("readBranches", () => {
    test("queues the branches task as interactive and gives the branches when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onRead = jest.fn();
        readBranches({
            taskId: "t1",
            repoPath: "/repo",
        }, onRead);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "branches",
            source: "repo-details-pane",
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
        expect(ziggy.removeTaskCompletedListener).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                branches: [{
                    name: "main",
                    isCheckedOut: true,
                }],
            }),
        });
        expect(ziggy.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: [{
                name: "main",
                isCheckedOut: true,
            }],
        });
    });
});

describe("branchesFromTaskResult", () => {
    test("gives the task's error message when it failed", () => {
        expect(branchesFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git for-each-ref failed.",
            type: "branches",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git for-each-ref failed.",
            },
        });
    });

    test("describes a failed task that gave no error message", () => {
        const result = branchesFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "branches",
            inputs: null,
        });
        expect(result).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The branches task failed with no description of the error. Graft's log has the details.",
            },
        });
    });

    test("gives no branches for a repo with no commits", () => {
        expect(branchesFromTaskResult(succeededResult({
            branches: [],
        }))).toEqual({
            ok: true,
            value: [],
        });
    });

    test("refuses outputs that are not an object, are null or hold no list of branches", () => {
        const unexpected = {
            ok: false,
            error: {
                name: "UnexpectedOutput",
                message: "The branches task gave a result that is not the repo's branches. Graft's backend and frontend may be from different builds, so build Graft again.",
            },
        };
        expect(branchesFromTaskResult(succeededResult("branches"))).toEqual(unexpected);
        expect(branchesFromTaskResult(succeededResult(null))).toEqual(unexpected);
        expect(branchesFromTaskResult(succeededResult({
            branches: "main",
        }))).toEqual(unexpected);
        expect(branchesFromTaskResult(succeededResult({
            branches: [{
                name: "main",
            }],
        }))).toEqual(unexpected);
    });
});

describe("isBranchList", () => {
    test("accepts a list of branches and refuses anything else", () => {
        expect(isBranchList([])).toBe(true);
        expect(isBranchList([{
            name: "main",
            isCheckedOut: false,
        }])).toBe(true);
        expect(isBranchList("main")).toBe(false);
        expect(isBranchList([1])).toBe(false);
    });
});

describe("isBranch", () => {
    test("accepts a name with whether it is checked out and refuses any other value", () => {
        expect(isBranch({
            name: "feature/x",
            isCheckedOut: false,
        })).toBe(true);
        expect(isBranch(null)).toBe(false);
        expect(isBranch("main")).toBe(false);
        expect(isBranch({
            name: 1,
            isCheckedOut: false,
        })).toBe(false);
        expect(isBranch({
            name: "main",
            isCheckedOut: "yes",
        })).toBe(false);
    });
});
