//
// Reads the working tree's changes for the frontend: queues the backend's working changes task,
// which runs git status, and turns the task's result into the unstaged and staged files.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { IReadCommitsError } from "./commits";
import { CHANGES_PANE } from "./panes";
import { err, ok, Result } from "./result";

//
// One file in the unstaged list or the staged list.
//
export interface IWorkingFile {
    // How the file changed, as git's one letter status in that list: A, D, M, T, ? (untracked) or
    // U (in conflict).
    status: string;

    // The file's path from the root of the repo.
    path: string;
}

//
// The working tree's changes. A file with staged and unstaged changes is in both lists.
//
export interface IWorkingChanges {
    // The files whose changes are not staged, in the order git lists them.
    unstaged: IWorkingFile[];

    // The files whose changes are staged for the next commit, in the order git lists them.
    staged: IWorkingFile[];
}

//
// Which repo's changes to read and the id to queue the task under.
//
export interface IWorkingChangesRequest {
    // The id of the working changes task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;
}

//
// Reads the repo's changes: queues the working changes task as interactive, because the user is
// waiting on it, and calls onRead with the two lists or with why they could not be read once the
// task ends.
//
export function readWorkingChanges(request: IWorkingChangesRequest, onRead: (result: Result<IWorkingChanges, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onRead(workingChangesFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "working-changes",
        source: CHANGES_PANE,
        data: {
            repoPath: request.repoPath,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}

//
// Turns the result of the working changes task into the two lists, or into why there are none.
//
export function workingChangesFromTaskResult(result: ITaskResult): Result<IWorkingChanges, IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The working changes task failed with no description of the error. Graft's log has the details.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs === "object") {
        if (outputs !== null) {
            const unstaged: unknown = Reflect.get(outputs, "unstaged");
            const staged: unknown = Reflect.get(outputs, "staged");
            if (isWorkingFileList(unstaged)) {
                if (isWorkingFileList(staged)) {
                    return ok({
                        unstaged,
                        staged,
                    });
                }
            }
        }
    }
    return err({
        name: "UnexpectedOutput",
        message: "The working changes task gave a result that is not the repo's changes. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}

//
// Checks whether the value is a list of files as the working changes task gives them, each with
// its status and its path as text.
//
export function isWorkingFileList(value: unknown): value is IWorkingFile[] {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every(isWorkingFile);
}

//
// Checks whether the value is one file as the working changes task gives it.
//
export function isWorkingFile(value: unknown): value is IWorkingFile {
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

//
// Counts the files with any change, a file in both lists counted once, for the changes pane's
// header.
//
export function changedFileCount(changes: IWorkingChanges): number {
    const paths = new Set<string>();
    for (const file of changes.unstaged) {
        paths.add(file.path);
    }
    for (const file of changes.staged) {
        paths.add(file.path);
    }
    return paths.size;
}
