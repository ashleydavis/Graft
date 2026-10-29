//
// Tests the commits page: renders it in a router with a fake bridge made of Jest mocks, and checks
// that it queues the commits task for the repo, shows that it is loading, then lists the commits
// or says why they could not be read. It also checks the columns: clicking a commit opens the
// commit details pane, clicking a changed file opens the file pane and each closes.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement, JSX } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { CommitsBridge, ICommit } from "../../../lib/commits";
import { CommitsPage } from "../../../pages/commits";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// Makes a fake bridge whose functions are Jest mocks.
//
function makeBridge(): CommitsBridge {
    return {
        addTask: jest.fn(),
        onTaskCompleted: jest.fn(),
        removeTaskCompletedListener: jest.fn(),
    };
}

//
// Shows the commits page for the repo at "/repo" as the only page of a router, as the app does.
//
function renderCommitsPage(bridge: CommitsBridge): void {
    const rootRoute = createRootRoute();
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: (): JSX.Element => createElement(CommitsPage, {
            bridge,
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
function completeTask(bridge: CommitsBridge, result: ITaskCompletedEvent["result"]): void {
    const task: IAddTask = (bridge.addTask as jest.Mock).mock.calls[0][0];
    const onTaskCompleted = (bridge.onTaskCompleted as jest.Mock).mock.calls[0][0];
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
// Ends the task the page queued at the index of the bridge's addTask calls, as the backend does,
// with the outputs. Each task registers its own listener, at the same index.
//
function completeTaskAt(bridge: CommitsBridge, index: number, outputs: ITaskCompletedEvent["result"]["outputs"]): void {
    const task: IAddTask = (bridge.addTask as jest.Mock).mock.calls[index][0];
    const onTaskCompleted = (bridge.onTaskCompleted as jest.Mock).mock.calls[index][0];
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
async function openCommitDetails(bridge: CommitsBridge): Promise<void> {
    renderCommitsPage(bridge);
    await screen.findByText("Loading the commits.");
    completeTaskAt(bridge, 0, {
        commits: [commitJson],
    });
    fireEvent.click(await screen.findByText(/The first commit \(/));
    completeTaskAt(bridge, 1, {
        commit: commitJson,
        changedFiles: [{
            status: "A",
            path: "README.md",
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
        const bridge = makeBridge();
        renderCommitsPage(bridge);
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commits-heading");
        expect(screen.getByText("About").getAttribute("data-id")).toBe("commits-about-link");
        const task: IAddTask = (bridge.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/repo",
            pageSize: 50,
        });
    });

    test("lists the commits once the task has read them", async () => {
        const bridge = makeBridge();
        renderCommitsPage(bridge);
        await screen.findByText("Loading the commits.");
        completeTask(bridge, {
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
        expect((await screen.findByText(/The first commit/)).getAttribute("data-id")).toBe(`commit-${commit.hash}`);
    });

    test("says why the commits could not be read when the task failed", async () => {
        const bridge = makeBridge();
        renderCommitsPage(bridge);
        await screen.findByText("Loading the commits.");
        completeTask(bridge, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git log failed.",
            type: "commits",
            inputs: null,
        });
        expect((await screen.findByText("Running git log failed.")).getAttribute("data-id")).toBe("commits-error");
    });

    test("opens the commit details pane to the right of the commit pane when a commit is clicked", async () => {
        const bridge = makeBridge();
        await openCommitDetails(bridge);
        const task: IAddTask = (bridge.addTask as jest.Mock).mock.calls[1][0];
        expect(task.taskType).toBe("commit-details");
        const columns = screen.getByText("A README.md").closest("[data-id=\"commit-columns\"]");
        const paneIds = Array.from(columns?.children ?? []).map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["commit-pane", "commit-details-pane"]);
    });

    test("opens the file pane to the right of the commit details pane when a changed file is clicked", async () => {
        const bridge = makeBridge();
        await openCommitDetails(bridge);
        fireEvent.click(screen.getByText("A README.md"));
        const task: IAddTask = (bridge.addTask as jest.Mock).mock.calls[2][0];
        expect(task.taskType).toBe("file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitJson.hash,
            path: "README.md",
        });
        completeTaskAt(bridge, 2, {
            diff: "+# Test repo\n",
        });
        expect(screen.getByText(/# Test repo/).getAttribute("data-id")).toBe("file-diff");
        const columns = screen.getByText("A README.md").closest("[data-id=\"commit-columns\"]");
        const paneIds = Array.from(columns?.children ?? []).map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["commit-pane", "commit-details-pane", "file-pane"]);
    });

    test("closes the file pane, then the commit details pane", async () => {
        const bridge = makeBridge();
        await openCommitDetails(bridge);
        fireEvent.click(screen.getByText("A README.md"));
        fireEvent.click(screen.getByText("Close", {
            selector: "[data-id=\"file-pane-close\"]",
        }));
        expect(screen.queryByText("README.md", {
            selector: "[data-id=\"file-pane-path\"]",
        })).toBeNull();
        fireEvent.click(screen.getByText("Close"));
        expect(screen.queryByText("A README.md")).toBeNull();
        expect(screen.getByText(/The first commit \(/).getAttribute("data-id")).toBe(`commit-${commitJson.hash}`);
    });

    test("closes the file pane with the commit details pane", async () => {
        const bridge = makeBridge();
        await openCommitDetails(bridge);
        fireEvent.click(screen.getByText("A README.md"));
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        fireEvent.click(screen.getByText("Close", {
            selector: "[data-id=\"commit-details-close\"]",
        }));
        expect(screen.queryByText("Loading the diff.")).toBeNull();
        expect(screen.queryByText("A README.md")).toBeNull();
    });

    test("closes the file pane when a commit is clicked, so it opens without a file", async () => {
        const bridge = makeBridge();
        await openCommitDetails(bridge);
        fireEvent.click(screen.getByText("A README.md"));
        expect(screen.getByText("Loading the diff.").getAttribute("data-id")).toBe("file-diff-loading");
        fireEvent.click(screen.getByText(/The first commit \(/));
        expect(screen.queryByText("Loading the diff.")).toBeNull();
        expect(screen.getByText("A README.md").getAttribute("data-id")).toBe("changed-file-README.md");
    });
});
