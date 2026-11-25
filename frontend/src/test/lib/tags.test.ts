//
// Tests reading a repo's tags in the frontend: the tags task and the tag details task queued
// through a fake window.ziggy made of Jest mocks, and how each task's result is checked and turned
// into the tag names or a lightweight or annotated tag, including every way it can fail.
//

import type { ITaskCompletedEvent, ITaskResult } from "ziggy";
import { isTagAnnotationJson, readTagDetails, readTags, tagDetailsFromTaskResult, tagNamesFromTaskResult } from "../../lib/tags";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../fake-ziggy";

//
// The hash of the commit the tags point at.
//
const COMMIT_HASH = "1111111111111111111111111111111111111111";

//
// An annotated tag's annotation as the tag details task gives it.
//
const annotationJson = {
    taggerName: "Tia Tagger",
    taggerEmail: "tia@example.com",
    taggerDate: "2026-01-02T03:04:05+10:00",
    title: "Release one",
    description: "The first line.",
};

//
// Makes the result of a task that succeeded with the outputs.
//
function succeededResult(outputs: ITaskResult["outputs"]): ITaskResult {
    return {
        taskId: "t1",
        status: "succeeded",
        outputs,
        type: "tags",
        inputs: null,
    };
}

//
// Makes the result of a task that failed with the message, or with none.
//
function failedResult(errorMessage: string | undefined): ITaskResult {
    return {
        taskId: "t1",
        status: "failed",
        outputs: null,
        type: "tags",
        inputs: null,
        errorMessage,
    };
}

//
// The callback the read registered with window.ziggy.
//
function registeredCallback(ziggy: FakeTaskZiggy): (event: ITaskCompletedEvent) => void {
    const onTaskCompleted = ziggy.onTaskCompleted as jest.Mock;
    expect(onTaskCompleted).toHaveBeenCalledTimes(1);
    return onTaskCompleted.mock.calls[0][0];
}

describe("readTags", () => {
    test("queues the tags task as interactive and gives the names when its own task ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onRead = jest.fn();
        readTags({
            taskId: "t1",
            repoPath: "/repo",
        }, onRead);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "tags",
            source: "repo-details-pane",
            data: {
                repoPath: "/repo",
            },
            priority: "interactive",
        });

        const callback = registeredCallback(ziggy);
        callback({
            taskId: "other",
            result: succeededResult(null),
        });
        expect(onRead).not.toHaveBeenCalled();
        expect(ziggy.removeTaskCompletedListener).not.toHaveBeenCalled();

        callback({
            taskId: "t1",
            result: succeededResult({
                names: ["v1.0", "v2.0"],
            }),
        });
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: ["v1.0", "v2.0"],
        });
        expect(ziggy.removeTaskCompletedListener).toHaveBeenCalledWith(callback);
    });
});

describe("readTagDetails", () => {
    test("queues the tag details task as interactive with the tag's name and gives the tag when it ends", () => {
        const ziggy = installFakeTaskZiggy();
        const onRead = jest.fn();
        readTagDetails({
            taskId: "t1",
            repoPath: "/repo",
            name: "v1.0",
        }, onRead);
        expect(ziggy.addTask).toHaveBeenCalledWith({
            taskId: "t1",
            taskType: "tag-details",
            source: "tag-pane",
            data: {
                repoPath: "/repo",
                name: "v1.0",
            },
            priority: "interactive",
        });

        registeredCallback(ziggy)({
            taskId: "t1",
            result: succeededResult({
                name: "v1.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Add the notes",
            }),
        });
        expect(onRead).toHaveBeenCalledWith({
            ok: true,
            value: {
                name: "v1.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Add the notes",
                annotation: undefined,
            },
        });
    });
});

describe("tagNamesFromTaskResult", () => {
    test("gives no names for a repo with no tags", () => {
        expect(tagNamesFromTaskResult(succeededResult({
            names: [],
        }))).toEqual({
            ok: true,
            value: [],
        });
    });

    test("gives the task's own message when it failed, or one naming the task when it gave none", () => {
        expect(tagNamesFromTaskResult(failedResult("Running git failed."))).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git failed.",
            },
        });
        expect(tagNamesFromTaskResult(failedResult(undefined))).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The tags task failed and gave no reason. Graft's log may hold more details.",
            },
        });
    });

    test("refuses a result that is not a list of names", () => {
        const results = [
            succeededResult("names"),
            succeededResult(null),
            succeededResult({}),
            succeededResult({
                names: ["v1.0", 2],
            }),
        ];
        for (const result of results) {
            expect(tagNamesFromTaskResult(result)).toEqual({
                ok: false,
                error: {
                    name: "UnexpectedOutput",
                    message: "The tags task gave a result that is not a list of tag names. Graft's backend and frontend may be from different builds, so build Graft again.",
                },
            });
        }
    });
});

describe("tagDetailsFromTaskResult", () => {
    test("gives an annotated tag with its annotation and its date as a Date", () => {
        expect(tagDetailsFromTaskResult(succeededResult({
            name: "v2.0",
            commitHash: COMMIT_HASH,
            commitTitle: "Change the note",
            annotation: annotationJson,
        }))).toEqual({
            ok: true,
            value: {
                name: "v2.0",
                commitHash: COMMIT_HASH,
                commitTitle: "Change the note",
                annotation: {
                    ...annotationJson,
                    taggerDate: new Date("2026-01-02T03:04:05+10:00"),
                },
            },
        });
    });

    test("gives the task's own message when it failed, or one naming the task when it gave none", () => {
        expect(tagDetailsFromTaskResult(failedResult("The tag is gone."))).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The tag is gone.",
            },
        });
        expect(tagDetailsFromTaskResult(failedResult(undefined))).toEqual({
            ok: false,
            error: {
                name: "TaskFailed",
                message: "The tag details task failed and gave no reason. Graft's log may hold more details.",
            },
        });
    });

    test("refuses a result that is not a tag", () => {
        const tag = {
            name: "v1.0",
            commitHash: COMMIT_HASH,
            commitTitle: "Add the notes",
        };
        const results = [
            succeededResult("v1.0"),
            succeededResult(null),
            succeededResult({
                ...tag,
                name: 1,
            }),
            succeededResult({
                ...tag,
                commitHash: 1,
            }),
            succeededResult({
                ...tag,
                commitTitle: 1,
            }),
            succeededResult({
                ...tag,
                annotation: {
                    ...annotationJson,
                    taggerDate: 1,
                },
            }),
        ];
        for (const result of results) {
            expect(tagDetailsFromTaskResult(result)).toEqual({
                ok: false,
                error: {
                    name: "UnexpectedOutput",
                    message: "The tag details task gave a result that is not a tag. Graft's backend and frontend may be from different builds, so build Graft again.",
                },
            });
        }
    });
});

describe("isTagAnnotationJson", () => {
    test("is true only for an object with every field as text", () => {
        expect(isTagAnnotationJson(annotationJson)).toBe(true);
        expect(isTagAnnotationJson(null)).toBe(false);
        expect(isTagAnnotationJson("annotation")).toBe(false);
        expect(isTagAnnotationJson({
            ...annotationJson,
            description: undefined,
        })).toBe(false);
    });
});
