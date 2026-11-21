//
// Stages or unstages one whole file for the frontend: queues the backend's stage file task, which
// runs git add, or its unstage file task, which runs git restore --staged.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { IReadCommitsError } from "./commits";
import { err, ok, Result } from "./result";

//
// Which file to stage or unstage and the id to queue the task under.
//
export interface IStageFileRequest {
    // The id of the task, which its task-completed event carries.
    taskId: string;

    // The path of the repo the file is in.
    repoPath: string;

    // The path of the file from the root of the repo.
    path: string;

    // Whether the file is in the staged list, so it is unstaged, or in the unstaged list, so it is
    // staged.
    isStaged: boolean;
}

//
// Picks the task that moves a file to the other list: unstage-file for a file in the staged list
// and stage-file for a file in the unstaged list.
//
export function stageTaskType(isStaged: boolean): string {
    if (isStaged) {
        return "unstage-file";
    }
    return "stage-file";
}

//
// Stages a file in the unstaged list or unstages a file in the staged list: queues the task as
// interactive, because the user is waiting on it, and calls onDone with the file's path or with
// why it could not be moved once the task ends.
//
export function toggleFileStaged(request: IStageFileRequest, onDone: (result: Result<string, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onDone(stagedPathFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: stageTaskType(request.isStaged),
        source: "repo-explorer-page",
        data: {
            repoPath: request.repoPath,
            path: request.path,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}

//
// Turns the result of the stage file or unstage file task into the path of the file it moved, or
// into why it did not.
//
export function stagedPathFromTaskResult(result: ITaskResult): Result<string, IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "Staging or unstaging the file failed with no description of the error. Graft's log has the details.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs === "object") {
        if (outputs !== null) {
            const path: unknown = Reflect.get(outputs, "path");
            if (typeof path === "string") {
                return ok(path);
            }
        }
    }
    return err({
        name: "UnexpectedOutput",
        message: "The stage file task gave a result that is not a file's path. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}
