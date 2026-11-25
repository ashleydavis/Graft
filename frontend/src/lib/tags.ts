//
// Reads a repo's tags for the frontend: queues the backend's tags task, which lists the tag names
// with git for-each-ref, and its tag details task, which reads one tag, and turns each task's
// result into the names or the tag.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { err, ok, Result } from "./result";
import { REPO_DETAILS_PANE, TAG_PANE } from "./panes";

//
// Why the tags or a tag could not be read.
//
export interface IReadTagsError {
    // TaskFailed when the task failed, UnexpectedOutput when its result was not what it gives.
    name: "TaskFailed" | "UnexpectedOutput";

    // What went wrong and what to do, ready to show the user.
    message: string;
}

//
// What an annotated tag holds beyond the commit it points at.
//
export interface ITagAnnotation {
    // The name of who made the tag.
    taggerName: string;

    // The email of who made the tag.
    taggerEmail: string;

    // When the tag was made.
    taggerDate: Date;

    // The first line of the tag's message.
    title: string;

    // The rest of the tag's message after the title. Empty when the message is only a title.
    description: string;
}

//
// One tag and the commit it points at.
//
export interface ITagDetails {
    // The tag's name, as in "v1.0".
    name: string;

    // The full hash of the commit the tag points at.
    commitHash: string;

    // The first line of that commit's message.
    commitTitle: string;

    // The tagger, date and message of an annotated tag, or undefined for a lightweight tag.
    annotation: ITagAnnotation | undefined;
}

//
// Which repo's tags to read and the id to queue the tags task under.
//
export interface ITagsRequest {
    // The id of the tags task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;
}

//
// Which tag to read and the id to queue the tag details task under.
//
export interface ITagDetailsRequest {
    // The id of the tag details task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;

    // The name of the tag, as the tags task listed it.
    name: string;
}

//
// Queues the task as interactive, because the user is waiting on it, and calls onCompleted with
// its result once the task with the request's id ends, so readTags and readTagDetails each only
// turn the result into what they read.
//
export function runTagTask(task: IAddTask, onCompleted: (result: ITaskResult) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== task.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onCompleted(event.result);
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    window.ziggy.addTask(task);
}

//
// Reads the names of the repo's tags, sorted by name, for the repo details pane's Tags list, and
// calls onRead with them or with why they could not be read once the tags task ends.
//
export function readTags(request: ITagsRequest, onRead: (result: Result<string[], IReadTagsError>) => void): void {
    runTagTask({
        taskId: request.taskId,
        taskType: "tags",
        source: REPO_DETAILS_PANE,
        data: {
            repoPath: request.repoPath,
        },
        priority: "interactive",
    }, result => onRead(tagNamesFromTaskResult(result)));
}

//
// Reads one tag's details for the tag pane, and calls onRead with them or with why they could not
// be read once the tag details task ends.
//
export function readTagDetails(request: ITagDetailsRequest, onRead: (result: Result<ITagDetails, IReadTagsError>) => void): void {
    runTagTask({
        taskId: request.taskId,
        taskType: "tag-details",
        source: TAG_PANE,
        data: {
            repoPath: request.repoPath,
            name: request.name,
        },
        priority: "interactive",
    }, result => onRead(tagDetailsFromTaskResult(result)));
}

//
// Makes the error for a failed task, with the task's own message or, when it gave none, one that
// names the task.
//
export function taskFailedError(result: ITaskResult, taskName: string): IReadTagsError {
    return {
        name: "TaskFailed",
        message: result.errorMessage ?? `The ${taskName} task failed and gave no reason. Graft's log may hold more details.`,
    };
}

//
// Turns the result of the tags task into the tag names, or into why there are none.
//
export function tagNamesFromTaskResult(result: ITaskResult): Result<string[], IReadTagsError> {
    if (result.status === "failed") {
        return err(taskFailedError(result, "tags"));
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs !== "object") {
        return unexpectedOutput("tags", "a list of tag names");
    }
    if (outputs === null) {
        return unexpectedOutput("tags", "a list of tag names");
    }
    const names: unknown = Reflect.get(outputs, "names");
    if (!Array.isArray(names)) {
        return unexpectedOutput("tags", "a list of tag names");
    }
    const tagNames: string[] = [];
    for (const name of names) {
        if (typeof name !== "string") {
            return unexpectedOutput("tags", "a list of tag names");
        }
        tagNames.push(name);
    }
    return ok(tagNames);
}

//
// Turns the result of the tag details task into the tag, or into why there is none. A lightweight
// tag's result has no annotation field, because the backend leaves out a null field.
//
export function tagDetailsFromTaskResult(result: ITaskResult): Result<ITagDetails, IReadTagsError> {
    if (result.status === "failed") {
        return err(taskFailedError(result, "tag details"));
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs !== "object") {
        return unexpectedOutput("tag details", "a tag");
    }
    if (outputs === null) {
        return unexpectedOutput("tag details", "a tag");
    }
    const name: unknown = Reflect.get(outputs, "name");
    const commitHash: unknown = Reflect.get(outputs, "commitHash");
    const commitTitle: unknown = Reflect.get(outputs, "commitTitle");
    const annotation: unknown = Reflect.get(outputs, "annotation");
    if (typeof name !== "string") {
        return unexpectedOutput("tag details", "a tag");
    }
    if (typeof commitHash !== "string") {
        return unexpectedOutput("tag details", "a tag");
    }
    if (typeof commitTitle !== "string") {
        return unexpectedOutput("tag details", "a tag");
    }
    if (annotation === undefined) {
        return ok({
            name,
            commitHash,
            commitTitle,
            annotation: undefined,
        });
    }
    if (!isTagAnnotationJson(annotation)) {
        return unexpectedOutput("tag details", "a tag");
    }
    return ok({
        name,
        commitHash,
        commitTitle,
        annotation: {
            ...annotation,
            taggerDate: new Date(annotation.taggerDate),
        },
    });
}

//
// An annotated tag's annotation as the tag details task gives it in JSON, with its date as ISO
// 8601 text.
//
export interface ITagAnnotationJson {
    // The name of who made the tag.
    taggerName: string;

    // The email of who made the tag.
    taggerEmail: string;

    // When the tag was made, in strict ISO 8601.
    taggerDate: string;

    // The first line of the tag's message.
    title: string;

    // The rest of the tag's message after the title.
    description: string;
}

//
// Checks whether the value is an annotation as the tag details task gives it: each of its fields
// there as text.
//
export function isTagAnnotationJson(value: unknown): value is ITagAnnotationJson {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    const fields = ["taggerName", "taggerEmail", "taggerDate", "title", "description"];
    return fields.every(field => typeof Reflect.get(value, field) === "string");
}

//
// Makes the error for a task result that is not what the task gives, naming the task and what it
// should have given.
//
export function unexpectedOutput<TValue>(taskName: string, expected: string): Result<TValue, IReadTagsError> {
    return err({
        name: "UnexpectedOutput",
        message: `The ${taskName} task gave a result that is not ${expected}. Graft's backend and frontend may be from different builds, so build Graft again.`,
    });
}
