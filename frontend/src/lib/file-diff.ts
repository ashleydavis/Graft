//
// Reads the diff of one file in a commit for the frontend: queues the backend's file diff task,
// which runs git diff-tree and turns the task's result into the diff.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { CommitsBridge, IReadCommitsError } from "./commits";
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
export function readFileDiff(bridge: CommitsBridge, request: IFileDiffRequest, onRead: (result: Result<string, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        bridge.removeTaskCompletedListener(onTaskCompleted);
        onRead(fileDiffFromTaskResult(event.result));
    }

    bridge.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "file-diff",
        source: "commits-page",
        data: {
            repoPath: request.repoPath,
            hash: request.hash,
            path: request.path,
        },
        priority: "interactive",
    };
    bridge.addTask(task);
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
