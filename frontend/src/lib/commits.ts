//
// Reads a page of a repo's commits for the frontend: queues the backend's commits task, which runs
// git log, and turns the task's result into commits.
//

import type { IAddTask, ITaskCompletedEvent, ITaskResult, IZiggyBridge } from "ziggy";
import { err, ok, Result } from "./result";

//
// What readCommitPage needs of window.ziggy, so a test can give it a fake with only these.
//
export type CommitsBridge = Pick<IZiggyBridge, "addTask" | "onTaskCompleted" | "removeTaskCompletedListener">;

//
// One commit.
//
export interface ICommit {
    // The commit's full hash.
    hash: string;

    // The full hashes of its parents: none for the first commit, two or more for a merge.
    parentHashes: string[];

    // The branches, tags and HEAD that point at it, as git names them ("HEAD -> main", "tag: v1").
    refs: string[];

    // The name of who wrote the change.
    authorName: string;

    // The email of who wrote the change.
    authorEmail: string;

    // When the change was written.
    authorDate: Date;

    // The name of who made the commit.
    committerName: string;

    // The email of who made the commit.
    committerEmail: string;

    // When the commit was made.
    committerDate: Date;

    // The first line of the commit message.
    title: string;

    // The rest of the commit message after the title. Empty when the message is only a title.
    description: string;
}

//
// One commit as the commits task gives it in JSON, with its dates as ISO 8601 text.
//
export interface ICommitJson {
    // The commit's full hash.
    hash: string;

    // The full hashes of its parents.
    parentHashes: string[];

    // The branches, tags and HEAD that point at it.
    refs: string[];

    // The name of who wrote the change.
    authorName: string;

    // The email of who wrote the change.
    authorEmail: string;

    // When the change was written, in strict ISO 8601.
    authorDate: string;

    // The name of who made the commit.
    committerName: string;

    // The email of who made the commit.
    committerEmail: string;

    // When the commit was made, in strict ISO 8601.
    committerDate: string;

    // The first line of the commit message.
    title: string;

    // The rest of the commit message after the title.
    description: string;
}

//
// The result of the commits task: one page of commits, newest first.
//
export interface ILogPageJson {
    // The commits on the page.
    commits: ICommitJson[];
}

//
// Why a page of commits could not be read.
//
export interface IReadCommitsError {
    // TaskFailed when the commits task failed, UnexpectedOutput when its result was not a page.
    name: "TaskFailed" | "UnexpectedOutput";

    // What went wrong and what to do, ready to show the user.
    message: string;
}

//
// Which page of commits to read and the id to queue its task under.
//
export interface ICommitPageRequest {
    // The id of the commits task, which its task-completed event carries.
    taskId: string;

    // The path of the repo to read.
    repoPath: string;

    // The most commits to read.
    pageSize: number;
}

//
// Reads the path of the repo to show from the query of the frontend's address: the repo a smoke
// test gave the app, or the test repo at /tmp/graft/test-repo, which scripts/test/create-test-repo.sh
// creates.
//
export function repoPathFromSearch(search: string): string {
    const repoPath = new URLSearchParams(search).get("repo");
    if (repoPath) {
        return repoPath;
    }
    return "/tmp/graft/test-repo";
}

//
// Reads the first page of commits from the repo: queues the commits task as interactive, because
// the user is waiting on it, and calls onRead with the commits or with why they could not be read
// once the task ends.
//
export function readCommitPage(bridge: CommitsBridge, request: ICommitPageRequest, onRead: (result: Result<ICommit[], IReadCommitsError>) => void): void {
    function onTaskCompleted(event: ITaskCompletedEvent): void {
        if (event.taskId !== request.taskId) {
            return;
        }
        bridge.removeTaskCompletedListener(onTaskCompleted);
        onRead(commitsFromTaskResult(event.result));
    }

    bridge.onTaskCompleted(onTaskCompleted);
    const task: IAddTask = {
        taskId: request.taskId,
        taskType: "commits",
        source: "commits-page",
        data: {
            repoPath: request.repoPath,
            pageSize: request.pageSize,
        },
        priority: "interactive",
    };
    bridge.addTask(task);
}

//
// Turns the result of the commits task into its commits, or into why there are none.
//
export function commitsFromTaskResult(result: ITaskResult): Result<ICommit[], IReadCommitsError> {
    if (result.status === "failed") {
        return err({
            name: "TaskFailed",
            message: result.errorMessage ?? "The commits task failed without saying why. Graft's log may say more.",
        });
    }
    if (!isLogPageJson(result.outputs)) {
        return err({
            name: "UnexpectedOutput",
            message: "The commits task gave a result that is not a page of commits. Graft's backend and frontend may be from different builds, so build Graft again.",
        });
    }
    return ok(result.outputs.commits.map(commitFromJson));
}

//
// Turns a commit from the task's JSON into a commit, with its dates as Dates.
//
export function commitFromJson(json: ICommitJson): ICommit {
    return {
        hash: json.hash,
        parentHashes: json.parentHashes,
        refs: json.refs,
        authorName: json.authorName,
        authorEmail: json.authorEmail,
        authorDate: new Date(json.authorDate),
        committerName: json.committerName,
        committerEmail: json.committerEmail,
        committerDate: new Date(json.committerDate),
        title: json.title,
        description: json.description,
    };
}

//
// Whether the value is a page of commits as the commits task gives it.
//
export function isLogPageJson(value: unknown): value is ILogPageJson {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    const commits: unknown = Reflect.get(value, "commits");
    if (!Array.isArray(commits)) {
        return false;
    }
    return commits.every(isCommitJson);
}

//
// Whether the value is a commit as the commits task gives it: every field there, of its type.
//
export function isCommitJson(value: unknown): value is ICommitJson {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    const stringFields = ["hash", "authorName", "authorEmail", "authorDate", "committerName", "committerEmail", "committerDate", "title", "description"];
    if (!stringFields.every(field => typeof Reflect.get(value, field) === "string")) {
        return false;
    }
    if (!isStringList(Reflect.get(value, "parentHashes"))) {
        return false;
    }
    return isStringList(Reflect.get(value, "refs"));
}

//
// Whether the value is a list of strings.
//
export function isStringList(value: unknown): value is string[] {
    if (!Array.isArray(value)) {
        return false;
    }
    return value.every(item => typeof item === "string");
}
