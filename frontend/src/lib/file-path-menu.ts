//
// What the file path menu offers for a file of the open repo: the text each copy item copies, the
// name of the file manager item on each platform and the backend tasks that show the file in the
// file manager and open it in the editor.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult } from "ziggy";
import { err, ok, Result } from "./result";

//
// Where an open item of the menu opens the file: the platform's file manager, or the editor the
// `editor` setting names.
//
export type OpenTarget = "file-manager" | "editor";

//
// The backend's task for each open target.
//
export const openTaskTypes: Record<OpenTarget, string> = {
    "file-manager": "show-file-in-file-manager",
    editor: "open-file-in-editor",
};

//
// One item of the file path menu that copies a path: its name, its data-id and the text it copies.
//
export interface ICopyItem {
    // The item's name, such as "Copy file name".
    label: string;

    // The item's data-id, so a smoke test can click it.
    dataId: string;

    // The text the item copies.
    text: string;
}

//
// Returns the name of the menu item that shows a file in the platform's file manager, as the
// style guide names it for each platform. The platform is the operating system's name as Ziggy's
// getPlatform reports it.
//
export function fileManagerLabel(os: string): string {
    if (os === "macos") {
        return "Reveal in Finder";
    }
    if (os === "windows") {
        return "Show in Explorer";
    }
    return "Open in file manager";
}

//
// Joins the repo's path and the file's path from the repo's root into the file's full path, with
// the platform's separator, `\` on Windows and `/` elsewhere, so a pasted path works in the
// platform's own tools.
//
export function fullFilePath({ repoPath, path, os }: { repoPath: string, path: string, os: string }): string {
    if (os === "windows") {
        return `${repoPath.replace(/[\\/]+$/, "")}\\${path.replace(/\//g, "\\")}`;
    }
    return `${repoPath.replace(/\/+$/, "")}/${path}`;
}

//
// Returns the file's name: the part of its path after the last slash.
//
export function fileName(path: string): string {
    return path.slice(path.lastIndexOf("/") + 1);
}

//
// Builds the menu's copy items, in the menu's order: the full path, the path from the repo's root
// and the file's name.
//
export function copyItems({ repoPath, path, os }: { repoPath: string, path: string, os: string }): ICopyItem[] {
    return [
        {
            label: "Copy full file path",
            dataId: "file-path-menu-copy-full",
            text: fullFilePath({
                repoPath,
                path,
                os,
            }),
        },
        {
            label: "Copy relative file path",
            dataId: "file-path-menu-copy-relative",
            text: path,
        },
        {
            label: "Copy file name",
            dataId: "file-path-menu-copy-name",
            text: fileName(path),
        },
    ];
}

//
// Which file to open, where and the id to queue the task under.
//
export interface IOpenFileRequest {
    // The id of the task, which its task-completed event carries.
    taskId: string;

    // The path of the repo the file is in.
    repoPath: string;

    // The path of the file from the root of the repo.
    path: string;

    // Where the file opens.
    target: OpenTarget;
}

//
// Why a file could not be opened.
//
export interface IOpenFileError {
    // Which error it is: the task failed, or it gave a result the frontend does not read.
    name: "TaskFailed" | "UnexpectedOutput";

    // What happened, to show the user.
    message: string;
}

//
// Opens the file in the target through the backend: queues the target's task as interactive,
// because the user is waiting on it, and calls onDone with the file's path or with why it could
// not be opened once the task ends.
//
export function openFile(request: IOpenFileRequest, onDone: (result: Result<string, IOpenFileError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        window.ziggy.removeTaskCompletedListener(onTaskCompleted);
        onDone(openedPathFromTaskResult(event.result));
    }

    window.ziggy.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: openTaskTypes[request.target],
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
// Turns the result of an open file task into the path of the file it opened, or into why it did
// not, with the backend's own text, which names the command it ran.
//
export function openedPathFromTaskResult(result: ITaskResult): Result<string, IOpenFileError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "Opening the file failed with no description of the error. Graft's log has the details.",
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
        message: "The open file task gave a result that is not a file's path. Graft's backend and frontend may be from different builds, so build Graft again.",
    });
}
