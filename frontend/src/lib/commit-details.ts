//
// Reads one commit's details and the files it changed for the frontend: queues the backend's
// commit details task, which runs git log and git diff-tree and turns the task's result into
// them.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { CommitsBridge, commitFromJson, ICommit, IReadCommitsError, isCommitJson } from "./commits";
import { err, ok, Result } from "./result";

//
// One file a commit changed.
//
export interface IChangedFile {
    // How the commit changed the file, as git's one letter status: A, D, M or T.
    status: string;

    // The file's path from the root of the repo.
    path: string;
}

//
// A commit and the files it changed.
//
export interface ICommitDetails {
    // The commit's details.
    commit: ICommit;

    // The files the commit changed, in the order git lists them.
    changedFiles: IChangedFile[];
}

//
// Which commit to read and the id to queue its task under.
//
export interface ICommitDetailsRequest {
    // The id of the commit details task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;

    // The hash of the commit.
    hash: string;
}

//
// Reads the commit's details and changed files: queues the commit details task as interactive,
// because the user is waiting on it and calls onRead with them or with why they could not be read
// once the task ends.
//
export function readCommitDetails(bridge: CommitsBridge, request: ICommitDetailsRequest, onRead: (result: Result<ICommitDetails, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        bridge.removeTaskCompletedListener(onTaskCompleted);
        onRead(commitDetailsFromTaskResult(event.result));
    }

    bridge.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "commit-details",
        source: "commits-page",
        data: {
            repoPath: request.repoPath,
            hash: request.hash,
        },
        priority: "interactive",
    };
    bridge.addTask(task);
}

//
// Turns the result of the commit details task into the commit and its changed files, or into why
// there are none.
//
export function commitDetailsFromTaskResult(result: ITaskResult): Result<ICommitDetails, IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The commit details task failed without saying why. Graft's log may say more.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs !== "object") {
        return unexpectedCommitDetails();
    }
    if (outputs === null) {
        return unexpectedCommitDetails();
    }
    const commit: unknown = Reflect.get(outputs, "commit");
    const changedFiles: unknown = Reflect.get(outputs, "changedFiles");
    if (!isCommitJson(commit)) {
        return unexpectedCommitDetails();
    }
    if (!Array.isArray(changedFiles)) {
        return unexpectedCommitDetails();
    }
    if (!changedFiles.every(isChangedFile)) {
        return unexpectedCommitDetails();
    }
    return ok({
        commit: commitFromJson(commit),
        changedFiles,
    });
}

//
// The error for a commit details task result that is not a commit with its changed files.
//
export function unexpectedCommitDetails(): Result<ICommitDetails, IReadCommitsError> {
    return err({
        name: "UnexpectedOutput",
        message: "The commit details task gave a result that is not a commit with its changed files. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}

//
// Whether the value is a changed file as the commit details task gives it.
//
export function isChangedFile(value: unknown): value is IChangedFile {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    if (typeof Reflect.get(value, "status") !== "string") {
        return false;
    }
    return typeof Reflect.get(value, "path") === "string";
}
