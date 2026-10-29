//
// Tests reading a page of commits in the frontend: the repo path read from the address, the
// commits task queued through a fake bridge made of Jest mocks, and how the task's result is
// checked and turned into commits, including every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { CommitsBridge, commitFromJson, commitsFromTaskResult, ICommitJson, isCommitJson, isLogPageJson, isStringList, readCommitPage, repoPathFromSearch } from "../../lib/commits";

//
// A commit as the commits task gives it.
//
const commitJson: ICommitJson = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: ["2222222222222222222222222222222222222222"],
    refs: ["HEAD -> main", "tag: v1"],
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
// Makes the result of a commits task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "commits",
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
// The callback readCommitPage registered with the bridge.
//
function registeredCallback(bridge: CommitsBridge): (event: ITaskCompletedEvent) => void {
    const onTaskCompleted = bridge.onTaskCompleted as jest.Mock;
    expect(onTaskCompleted).toHaveBeenCalledTimes(1);
    return onTaskCompleted.mock.calls[0][0];
}

describe("repoPathFromSearch", () => {
    test("reads the repo a smoke test gave in the query", () => {
        expect(repoPathFromSearch("?testMode=1&repo=%2Ftmp%2Fa%20repo")).toBe("/tmp/a repo");
    });

    test("defaults to the test repo at /tmp/graft/test-repo", () => {
        expect(repoPathFromSearch("")).toBe("/tmp/graft/test-repo");
        expect(repoPathFromSearch("?testMode=1&repo=")).toBe("/tmp/graft/test-repo");
    });
});

describe("readCommitPage", () => {
    test("queues the commits task as interactive and gives the commits when it ends", () => {
        const bridge = makeBridge();
        const onRead = jest.fn();
        readCommitPage(bridge, {
            taskId: "t1",
            repoPath: "/repo",
            pageSize: 50,
        }, onRead);
        expect(bridge.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "commits",
            source: "commits-page",
            data: {
                repoPath: "/repo",
                pageSize: 50,
            },
            priority: "interactive",
        });

        const callback = registeredCallback(bridge);
        callback({
            taskId: "another task",
            result: succeededResult(null),
        });
        expect(onRead).not.toHaveBeenCalled();
        expect(bridge.removeTaskCompletedListener).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                commits: [{
                    ...commitJson,
                }],
            }),
        });
        expect(bridge.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: [commitFromJson(commitJson)],
        });
    });
});

describe("commitsFromTaskResult", () => {
    test("gives the commits of a page, newest first", () => {
        const result = commitsFromTaskResult(succeededResult({
            commits: [{
                ...commitJson,
            }, {
                ...commitJson,
                hash: "2222222222222222222222222222222222222222",
                parentHashes: [],
                refs: [],
            }],
        }));
        expect(result.ok).toBe(true);
        if (result.ok) {
            expect(result.value.map(commit => commit.hash)).toEqual([
                "1111111111111111111111111111111111111111",
                "2222222222222222222222222222222222222222",
            ]);
        }
    });

    test("gives the task's error message when the task failed", () => {
        expect(commitsFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Running git log failed.",
            type: "commits",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git log failed.",
            },
        });
    });

    test("says the task failed without a reason when it gave none", () => {
        expect(commitsFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "commits",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The commits task failed without saying why. Graft's log may say more.",
            },
        });
    });

    test("refuses a result that is not a page of commits", () => {
        const result = commitsFromTaskResult(succeededResult("not a page"));
        expect(result.ok).toBe(false);
        if (!result.ok) {
            expect(result.error.name).toBe("UnexpectedOutput");
        }
    });
});

describe("commitFromJson", () => {
    test("keeps every field and turns the dates into Dates", () => {
        const commit = commitFromJson(commitJson);
        expect(commit).toEqual({
            hash: commitJson.hash,
            parentHashes: commitJson.parentHashes,
            refs: commitJson.refs,
            authorName: "Ada Author",
            authorEmail: "ada@example.com",
            authorDate: new Date("2026-01-01T17:04:05Z"),
            committerName: "Cy Committer",
            committerEmail: "cy@example.com",
            committerDate: new Date("2026-01-01T17:04:06Z"),
            title: "The second commit",
            description: "The description.",
        });
    });
});

describe("isLogPageJson", () => {
    test("accepts a page of commits, including an empty one", () => {
        expect(isLogPageJson({
            commits: [commitJson],
        })).toBe(true);
        expect(isLogPageJson({
            commits: [],
        })).toBe(true);
    });

    test("refuses a value that is not a page", () => {
        expect(isLogPageJson("text")).toBe(false);
        expect(isLogPageJson(null)).toBe(false);
        expect(isLogPageJson({})).toBe(false);
        expect(isLogPageJson({
            commits: [{}],
        })).toBe(false);
    });
});

describe("isCommitJson", () => {
    test("accepts a commit with every field", () => {
        expect(isCommitJson(commitJson)).toBe(true);
    });

    test("refuses a value that is not an object", () => {
        expect(isCommitJson(5)).toBe(false);
        expect(isCommitJson(null)).toBe(false);
    });

    test("refuses a commit with a text field missing or not text", () => {
        expect(isCommitJson({
            ...commitJson,
            title: 7,
        })).toBe(false);
    });

    test("refuses a commit whose parent hashes or refs are not lists of text", () => {
        expect(isCommitJson({
            ...commitJson,
            parentHashes: "abc",
        })).toBe(false);
        expect(isCommitJson({
            ...commitJson,
            refs: [1],
        })).toBe(false);
    });
});

describe("isStringList", () => {
    test("accepts a list of text and refuses anything else", () => {
        expect(isStringList(["a", "b"])).toBe(true);
        expect(isStringList([])).toBe(true);
        expect(isStringList(["a", 1])).toBe(false);
        expect(isStringList("a")).toBe(false);
    });
});
