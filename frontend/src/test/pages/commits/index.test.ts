//
// Tests the commits page: renders it in a router with a fake window.ziggy made of Jest mocks, and checks
// that it queues the commits task for the repo, shows that it is loading, then lists the commits
// or says why they could not be read. It also checks the columns: clicking a commit opens the
// commit details pane and highlights the commit, clicking a changed file opens the file pane and
// highlights the file and each pane closes. Dates are checked against the browser's own locale and
// time zone, which the page passes on.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement, JSX } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { ICommit } from "../../../lib/commits";
import { formatDate, formatDateTime } from "../../../lib/date-format";
import { CommitsPage } from "../../../pages/commits";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../fake-ziggy";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// Shows the commits page for the repo at "/repo" as the only page of a router, as the app does.
//
function renderCommitsPage(): void {
    const rootRoute = createRootRoute();
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: (): JSX.Element => createElement(CommitsPage, {
            repoPath: "/repo",
        }),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([commitsRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
    render(createElement(RouterProvider, {
        router,
    }));
}

//
// Ends the commits task the page queued, as the backend does, with the result.
//
function completeTask(ziggy: FakeTaskZiggy, result: ITaskCompletedEvent["result"]): void {
    const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
    const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[0][0];
    act(() => {
        onTaskCompleted({
            taskId: task.taskId,
            result: {
                ...result,
                taskId: task.taskId,
            },
        });
    });
}

//
// Ends the task the page queued at the index of window.ziggy's addTask calls, as the backend does,
// with the outputs. Each task registers its own listener, at the same index.
//
function completeTaskAt(ziggy: FakeTaskZiggy, index: number, outputs: ITaskCompletedEvent["result"]["outputs"]): void {
    const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[index][0];
    const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[index][0];
    act(() => {
        onTaskCompleted({
            taskId: task.taskId,
            result: {
                taskId: task.taskId,
                status: "succeeded",
                outputs,
                type: task.taskType,
                inputs: null,
            },
        });
    });
}

//
// Finds the element with the data-id, failing the test when the page does not show it.
//
function elementWithDataId(dataId: string): Element {
    const element = document.querySelector(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as Element;
}

//
// The commit as the commits and commit details tasks give it.
//
const commitJson = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: [],
    refs: ["HEAD -> main"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: "2026-01-01T00:00:00Z",
    committerName: "Ada Author",
    committerEmail: "ada@example.com",
    committerDate: "2026-01-01T00:00:00Z",
    title: "The first commit",
    description: "",
};

//
// Shows the commits page, lists the commit, clicks it and ends its commit details task with
// README.md as its one changed file.
//
async function openCommitDetails(ziggy: FakeTaskZiggy): Promise<void> {
    renderCommitsPage();
    await screen.findByText("Loading the commits.");
    completeTaskAt(ziggy, 0, {
        commits: [commitJson],
    });
    fireEvent.click(await screen.findByText("The first commit"));
    completeTaskAt(ziggy, 1, {
        commit: commitJson,
        changedFiles: [{
            status: "A",
            path: "README.md",
            linesAdded: 1,
            linesDeleted: 0,
            isBinary: false,
        }],
    });
}

//
// A commit to list.
//
const commit: ICommit = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: [],
    refs: ["HEAD -> main"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: new Date("2026-01-01T00:00:00Z"),
    committerName: "Ada Author",
    committerEmail: "ada@example.com",
    committerDate: new Date("2026-01-01T00:00:00Z"),
    title: "The first commit",
    description: "",
};

describe("CommitsPage", () => {
    test("queues the commits task for the repo's first page and shows that it is loading", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage();
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commits-heading");
        expect(screen.getByText("About").getAttribute("data-id")).toBe("commits-about-link");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/repo",
            pageSize: 50,
        });
    });

    test("lists the commits once the task has read them", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage();
        await screen.findByText("Loading the commits.");
        completeTask(ziggy, {
            taskId: "",
            status: "succeeded",
            outputs: {
                commits: [{
                    hash: commit.hash,
                    parentHashes: [],
                    refs: ["HEAD -> main"],
                    authorName: "Ada Author",
                    authorEmail: "ada@example.com",
                    authorDate: "2026-01-01T00:00:00Z",
                    committerName: "Ada Author",
                    committerEmail: "ada@example.com",
                    committerDate: "2026-01-01T00:00:00Z",
                    title: "The first commit",
                    description: "",
                }],
            },
            type: "commits",
            inputs: null,
        });
        expect((await screen.findByText("The first commit")).closest("li")?.getAttribute("data-id")).toBe(`commit-${commit.hash}`);
        expect(elementWithDataId(`commit-${commit.hash}`).textContent).toBe(`The first commitHEAD -> mainAda Author${formatDate(commit.authorDate, Intl.DateTimeFormat().resolvedOptions())}1111111`);
    });

    test("says why the commits could not be read when the task failed", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage();
        await screen.findByText("Loading the commits.");
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git log failed.",
            type: "commits",
            inputs: null,
        });
        expect((await screen.findByText("Running git log failed.")).getAttribute("data-id")).toBe("commits-error");
    });

    test("opens the commit details pane to the right of the commit pane when a commit is clicked", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[1][0];
        expect(task.taskType).toBe("commit-details");
        const paneIds = Array.from(elementWithDataId("commit-columns").children).map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["commit-pane", "commit-details-pane"]);
        expect(elementWithDataId(`commit-${commitJson.hash}`).className).toContain("font-bold");
        expect(elementWithDataId("commit-details-author").textContent).toContain(formatDateTime(commit.authorDate, Intl.DateTimeFormat().resolvedOptions()));
    });

    test("opens the file pane to the right of the commit details pane when a changed file is clicked", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[2][0];
        expect(task.taskType).toBe("file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitJson.hash,
            path: "README.md",
        });
        completeTaskAt(ziggy, 2, {
            diff: "+# Test repo\n",
        });
        expect(screen.getByText(/# Test repo/).getAttribute("data-id")).toBe("file-diff");
        const paneIds = Array.from(elementWithDataId("commit-columns").children).map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["commit-pane", "commit-details-pane", "file-pane"]);
        expect(elementWithDataId("changed-file-README.md").className).toContain("bg-blue-500/15");
    });

    test("closes the file pane, then the commit details pane", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        fireEvent.click(elementWithDataId("file-pane-close"));
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        fireEvent.click(elementWithDataId("commit-details-close"));
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
        expect(elementWithDataId(`commit-${commitJson.hash}`).textContent).toContain("The first commit");
    });

    test("closes the file pane with the commit details pane", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        fireEvent.click(elementWithDataId("commit-details-close"));
        expect(screen.queryByText("Loading the diff.")).toBeNull();
        expect(document.querySelector("[data-id=\"changed-file-README.md\"]")).toBeNull();
    });

    test("closes the file pane when a commit is clicked, so it opens without a file", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        fireEvent.click(elementWithDataId(`commit-${commitJson.hash}`));
        expect(screen.queryByText("Loading the diff.")).toBeNull();
        expect(elementWithDataId("changed-file-README.md").className).not.toContain("bg-blue-500/15");
    });
});
