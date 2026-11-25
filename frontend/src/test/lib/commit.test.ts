//
// Tests committing the staged files in the frontend: the commit task queued through a fake
// window.ziggy made of Jest mocks, how the task's result is checked and turned into the commit's
// message or into why no commit was made, including git's own error text, and what the Commit
// button shows and whether it can commit for each message and count of staged files.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { canCommit, commitButtonText, commitMessageFromTaskResult, commitStagedFiles, commitTip } from "../../lib/commit";
import { installFakeTaskZiggy } from "../fake-ziggy";

//
// Makes the result of a commit task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "commit",
        inputs: null,
    };
}

describe("commitStagedFiles", () => {
    test("queues the commit task with the repo and the message and gives the message when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onDone = jest.fn();
        commitStagedFiles({
            taskId: "t1",
            repoPath: "/repo",
            message: "Add the notes\n\nThe notes say what is next.",
        }, onDone);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "commit",
            source: "changes-pane",
            data: {
                repoPath: "/repo",
                message: "Add the notes\n\nThe notes say what is next.",
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
                message: "Add the notes\n\nThe notes say what is next.",
            }),
        });
        expect(ziggy.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
        expect(onDone).toHaveBeenCalledWith({
            ok: true,
            value: "Add the notes\n\nThe notes say what is next.",
        });
    });
});

describe("commitMessageFromTaskResult", () => {
    test("gives git's error text when the task failed", () => {
        expect(commitMessageFromTaskResult({
            taskId: "t1",
            status: "failed",
            errorMessage: "Git did not make the commit:\nThe pre-commit hook found a problem.",
            type: "commit",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Git did not make the commit:\nThe pre-commit hook found a problem.",
            },
        });
    });

    test("returns a text that the error has no description when the failed task gave none", () => {
        expect(commitMessageFromTaskResult({
            taskId: "t1",
            status: "failed",
            type: "commit",
            inputs: null,
        })).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The commit failed with no description of the error. Graft's log has the details.",
            },
        });
    });

    test("refuses a result that is not a commit's message", () => {
        const unexpected = {
            ok: false,
            error: {
                name: "UnexpectedOutput",
                message: "The commit task gave a result that is not a commit's message. Graft's backend and frontend may be from different builds, so build Graft again.",
            },
        };
        expect(commitMessageFromTaskResult(succeededResult(null))).toEqual(unexpected);
        expect(commitMessageFromTaskResult(succeededResult("Add the notes"))).toEqual(unexpected);
        expect(commitMessageFromTaskResult(succeededResult({
            message: 3,
        }))).toEqual(unexpected);
    });
});

describe("canCommit", () => {
    test("commits only with a message of more than white space and at least one staged file", () => {
        expect(canCommit("Add the notes", 1)).toBe(true);
        expect(canCommit("Add the notes", 0)).toBe(false);
        expect(canCommit("", 2)).toBe(false);
        expect(canCommit(" \n\t", 2)).toBe(false);
    });
});

describe("commitButtonText", () => {
    test("counts the staged files, naming one file in the singular, and returns 'Nothing to commit' while no file is staged", () => {
        expect(commitButtonText(0)).toBe("Nothing to commit");
        expect(commitButtonText(1)).toBe("Commit 1 file");
        expect(commitButtonText(3)).toBe("Commit 3 files");
    });
});

describe("commitTip", () => {
    test("names what is missing while the button cannot commit and what it does once it can", () => {
        expect(commitTip("Add the notes", 0)).toEqual({
            title: "Nothing to commit yet",
            detail: "Stage a file to commit it.",
        });
        expect(commitTip(" ", 2)).toEqual({
            title: "Nothing to commit yet",
            detail: "Write a commit message.",
        });
        expect(commitTip("Add the notes", 2)).toEqual({
            title: "Commit the staged changes",
            detail: "Makes a commit of the staged files with this message.",
        });
    });
});
