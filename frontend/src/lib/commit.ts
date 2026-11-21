//
// Commits the staged files for the frontend: queues the backend's commit task, which runs git
// commit with the user's message, and works out what the changes pane's Commit button shows.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { IReadCommitsError } from "./commits";
import { err, ok, Result } from "./result";

//
// Which repo to commit in, the message and the id to queue the task under.
//
export interface ICommitRequest {
    // The id of the task, which its task-completed event carries.
    taskId: string;

    // The path of the repo whose staged files are committed.
    repoPath: string;

    // The commit message as the user wrote it.
    message: string;
}

//
// Commits the repo's staged files with the message: queues the commit task as interactive,
// because the user is waiting on it, and calls onDone with the commit's message or with why no
// commit was made, which holds git's own error text, once the task ends.
//
export function commitStagedFiles(request: ICommitRequest, onDone: (result: Result<string, IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onDone(commitMessageFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "commit",
        source: "repo-explorer-page",
        data: {
            repoPath: request.repoPath,
            message: request.message,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}

//
// Turns the result of the commit task into the message of the commit it made, or into why it made
// none.
//
export function commitMessageFromTaskResult(result: ITaskResult): Result<string, IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The commit failed with no description of the error. Graft's log has the details.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs === "object") {
        if (outputs !== null) {
            const message: unknown = Reflect.get(outputs, "message");
            if (typeof message === "string") {
                return ok(message);
            }
        }
    }
    return err({
        name: "UnexpectedOutput",
        message: "The commit task gave a result that is not a commit's message. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}

//
// Checks whether the Commit button can commit: the message has more than white space and at least
// one file is staged, as git needs for a commit.
//
export function canCommit(message: string, stagedCount: number): boolean {
    if (message.trim() === "") {
        return false;
    }
    return stagedCount > 0;
}

//
// Writes the Commit button's words, as the style guide's Commit button has them: "Commit 1 file"
// or "Commit 3 files", and "Nothing to commit" while no file is staged.
//
export function commitButtonText(stagedCount: number): string {
    if (stagedCount === 0) {
        return "Nothing to commit";
    }
    if (stagedCount === 1) {
        return "Commit 1 file";
    }
    return `Commit ${stagedCount} files`;
}

//
// What the Commit button's tooltip shows: a title and a detail, so a disabled button shows what
// is missing.
//
export interface ICommitTip {
    // What the button does, or that there is nothing to commit yet.
    title: string;

    // What the user does next, or what the commit holds.
    detail: string;
}

//
// Works out the Commit button's tooltip: what is missing while the button is disabled, and what
// it commits once it is enabled.
//
export function commitTip(message: string, stagedCount: number): ICommitTip {
    if (stagedCount === 0) {
        return {
            title: "Nothing to commit yet",
            detail: "Stage a file to commit it.",
        };
    }
    if (message.trim() === "") {
        return {
            title: "Nothing to commit yet",
            detail: "Write a commit message.",
        };
    }
    return {
        title: "Commit the staged changes",
        detail: "Makes a commit of the staged files with this message.",
    };
}
