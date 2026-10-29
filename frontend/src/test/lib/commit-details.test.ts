//
// Tests reading a commit's details in the frontend: the commit details task queued through a fake
// bridge made of Jest mocks and how the task's result is checked and turned into the commit and
// its changed files, including every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { commitDetailsFromTaskResult, isChangedFile, readCommitDetails } from "../../lib/commit-details";
import { CommitsBridge, ICommitJson } from "../../lib/commits";

//
// A commit as the commit details task gives it.
//
const commitJson: ICommitJson = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: ["2222222222222222222222222222222222222222"],
    refs: ["HEAD -> main"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: "2026-01-02T03:04:05+10:00",
    committerName: "Cy Committer",
    committerEmail: "cy@example.com",
    committerDate: "2026-01-02T03:04:06+10:00",
    title: "The second commit",
    description: "The description.",
};

//
// Makes the result of a commit details task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "commit-details",
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

//
// The callback readCommitDetails registered with the bridge.
//
function registeredCallback(bridge: CommitsBridge): (event: ITaskCompletedEvent) => void {
    const onTaskCompleted = bridge.onTaskCompleted as jest.Mock;
    expect(onTaskCompleted).toHaveBeenCalledTimes(1);
    return onTaskCompleted.mock.calls[0][0];
}

describe("readCommitDetails", () => {
    test("queues the commit details task as interactive and gives the details when it ends", () => {
        const bridge = makeBridge();
        const onRead = jest.fn();
        readCommitDetails(bridge, {
            taskId: "t1",
            repoPath: "/repo",
            hash: commitJson.hash,
        }, onRead);
        expect(bridge.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "commit-details",
            source: "commits-page",
            data: {
                repoPath: "/repo",
                hash: commitJson.hash,
            },
            priority: "interactive",
        });

        const callback = registeredCallback(bridge);
        callback({
            taskId: "other",
            result: succeededResult(null),
        });
        expect(onRead).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                commit: { ...commitJson },
                changedFiles: [{
                    status: "M",
                    path: "notes.txt",
                }],
            }),
        });
        expect(bridge.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onRead).toHaveBeenCalledTimes(1);
        const result = onRead.mock.calls[0][0];
        expect(result.ok).toBe(true);
        expect(result.value.commit.hash).toBe(commitJson.hash);
        expect(result.value.commit.authorDate).toEqual(new Date("2026-01-02T03:04:05+10:00"));
        expect(result.value.changedFiles).toEqual([{
            status: "M",
            path: "notes.txt",
        }]);
    });
});

describe("commitDetailsFromTaskResult", () => {
    test("gives the task's error message when it failed", () => {
        expect(commitDetailsFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git log failed.",
            type: "commit-details",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git log failed.",
            },
        });
    });

    test("says the task gave no reason when it failed without a message", () => {
        const result = commitDetailsFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "commit-details",
            inputs: null,
        });
        expect(result).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The commit details task failed without saying why. Graft's log may say more.",
            },
        });
    });

    test("refuses a result that is not a commit with its changed files", () => {
        const notDetails: ITaskResult["outputs"][] = [
            null,
            "text",
            {
                changedFiles: [],
            },
            {
                commit: { ...commitJson },
                changedFiles: "notes.txt",
            },
            {
                commit: { ...commitJson },
                changedFiles: [{
                    status: "M",
                }],
            },
        ];
        for (const outputs of notDetails) {
            const result = commitDetailsFromTaskResult(succeededResult(outputs));
            expect(result.ok).toBe(false);
            if (!result.ok) {
                expect(result.error.name).toBe("UnexpectedOutput");
            }
        }
    });
});

describe("isChangedFile", () => {
    test("accepts a status and a path and refuses anything else", () => {
        expect(isChangedFile({
            status: "A",
            path: "README.md",
        })).toBe(true);
        expect(isChangedFile(null)).toBe(false);
        expect(isChangedFile("README.md")).toBe(false);
        expect(isChangedFile({
            path: "README.md",
        })).toBe(false);
        expect(isChangedFile({
            status: "A",
            path: 1,
        })).toBe(false);
    });
});
