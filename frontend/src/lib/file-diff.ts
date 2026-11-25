//
// Reads the diff of one file for the frontend, in a commit or in the working tree: queues the
// backend's file diff task, which runs git diff-tree, or its working file diff task, which runs
// git diff, and turns the task's result into the diff.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { IReadCommitsError } from "./commits";
import { FILE_PANE, WORKING_FILE_PANE } from "./panes";
import { err, ok, Result } from "./result";

//
// Which file's diff to read and the id to queue its task under.
//
export interface IFileDiffRequest {
    // The id of the file diff task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;

    // The hash of the commit that changed the file.
    hash: string;

    // The path of the file from the root of the repo.
    path: string;
}

//
// Reads the file's diff in the commit: queues the file diff task as interactive, because the user
// is waiting on it and calls onRead with the diff or with why it could not be read once the task
// ends.
//
export function readFileDiff(request: IFileDiffRequest, onRead: (result: Result<string, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onRead(fileDiffFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "file-diff",
        source: FILE_PANE,
        data: {
            repoPath: request.repoPath,
            hash: request.hash,
            path: request.path,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}

//
// Turns the result of the file diff task into the diff, or into why there is none.
//
export function fileDiffFromTaskResult(result: ITaskResult): Result<string, IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The file diff task failed without saying why. Graft's log may say more.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs === "object") {
        if (outputs !== null) {
            const diff: unknown = Reflect.get(outputs, "diff");
            if (typeof diff === "string") {
                return ok(diff);
            }
        }
    }
    return err({
        name: "UnexpectedOutput",
        message: "The file diff task gave a result that is not a diff. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}

//
// Which changed file's diff to read from the working tree and the id to queue its task under.
//
export interface IWorkingFileDiffRequest {
    // The id of the working file diff task, which its task-completed event carries.
    taskId: string;

    // The path of the repo the file is in.
    repoPath: string;

    // The path of the file from the root of the repo.
    path: string;

    // Whether the file is in the staged list, so its staged changes are read, or in the unstaged
    // list, so its unstaged changes are read.
    isStaged: boolean;

    // The file's one letter status in its list, which marks an untracked file ("?") for the
    // backend.
    status: string;
}

//
// Reads a changed file's staged or unstaged diff: queues the working file diff task as
// interactive, because the user is waiting on it, and calls onRead with the diff or with why it
// could not be read once the task ends. Its result is laid out as the file diff task's.
//
export function readWorkingFileDiff(request: IWorkingFileDiffRequest, onRead: (result: Result<string, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onRead(fileDiffFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "working-file-diff",
        source: WORKING_FILE_PANE,
        data: {
            repoPath: request.repoPath,
            path: request.path,
            isStaged: request.isStaged,
            status: request.status,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}
