//
// Reads a repo's local branches for the frontend: queues the backend's branches task, which runs
// git for-each-ref, and turns the task's result into the branches.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { IReadCommitsError } from "./commits";
import { REPO_DETAILS_PANE } from "./panes";
import { err, ok, Result } from "./result";

//
// One local branch.
//
export interface IBranch {
    // The branch's name, as in "main" or "feature/x".
    name: string;

    // Whether the branch is checked out, so HEAD points at it.
    isCheckedOut: boolean;
}

//
// Which repo's branches to read and the id to queue the task under.
//
export interface IBranchesRequest {
    // The id of the branches task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;
}

//
// Reads the repo's local branches: queues the branches task as interactive, because the user is
// waiting on it, and calls onRead with the branches, in the order of their names, or with why they
// could not be read once the task ends.
//
export function readBranches(request: IBranchesRequest, onRead: (result: Result<IBranch[], IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onRead(branchesFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "branches",
        source: REPO_DETAILS_PANE,
        data: {
            repoPath: request.repoPath,
        },
        priority: "interactive",
    };
    window.ziggy.addTask(task);
}

//
// Turns the result of the branches task into the branches, or into why there are none.
//
export function branchesFromTaskResult(result: ITaskResult): Result<IBranch[], IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The branches task failed with no description of the error. Graft's log has the details.",
        });
    }
    const outputs: unknown = result.outputs;
    if (typeof outputs === "object") {
        if (outputs !== null) {
            const branches: unknown = Reflect.get(outputs, "branches");
            if (isBranchList(branches)) {
                return ok(branches);
            }
        }
    }
    return err({
        name: "UnexpectedOutput",
        message: "The branches task gave a result that is not the repo's branches. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}

//
// Checks whether the value is a list of branches as the branches task gives them.
//
export function isBranchList(value: unknown): value is IBranch[] {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every(isBranch);
}

//
// Checks whether the value is one branch as the branches task gives it: its name as text and
// whether it is checked out as a boolean.
//
export function isBranch(value: unknown): value is IBranch {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    if (typeof Reflect.get(value, "name") !== "string") {
        return false;
    }
    return typeof Reflect.get(value, "isCheckedOut") === "boolean";
}
