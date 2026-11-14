//
// Tests the commits page: renders it in a router with a fake window.ziggy made of Jest mocks, and checks
// that it queues the commits task for the repo, shows that it is loading, then lists the commits
// or says why they could not be read. It also checks the columns: clicking a commit opens the
// commit details pane and highlights the commit, clicking a changed file opens the file pane and
// highlights the file and each pane closes, and that the page scrolls each pane that opens into view.
// It presses the commit explorer's keys on the page and checks how they move the selection, change
// the active pane, open and close panes, and that they are left alone in a text box, outside the
// page and with Ctrl held. Dates are checked against the browser's own locale and time zone, which
// the page passes on. The page reads the open repo from a RepoProvider: it shows when no repo is
// open and reads another repo afresh when one is opened in its place.
//

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement, JSX } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { RepoProvider, useRepo } from "../../../components/repo-context";
import { ICommit } from "../../../lib/commits";
import { formatDate, formatDateTime } from "../../../lib/date-format";
import { CommitsPage, scrollLastPaneIntoView } from "../../../pages/commits";
import { activePaneClasses } from "../../../pages/commits/components/active-pane-style";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../fake-ziggy";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// The page scrolls each pane that opens into view. jsdom leaves scrollIntoView undefined, because
// it lays out no page, so the tests put a Jest mock on every element that records which element it
// was called on.
//
const scrollIntoView = jest.fn();
Element.prototype.scrollIntoView = scrollIntoView;

beforeEach(() => {
    scrollIntoView.mockClear();
});

//
// Reads the data-ids of the elements the page scrolled into view, in the order it scrolled them.
//
function scrolledDataIds(): (string | null)[] {
    return scrollIntoView.mock.contexts.map(element => {
        //
        // The cast is safe because the mock is only ever called as a method of an element, and a
        // type guard cannot narrow it because Jest types each context as unknown.
        //
        return (element as Element).getAttribute("data-id");
    });
}

//
// Shows a button that opens the repo at "/other-repo", as the open-repo action does, so a test can
// open another repo while the commits page shows.
//
function OpenOtherRepoButton(): JSX.Element {
    const { openRepo } = useRepo();
    return createElement("button", {
        onClick: () => openRepo("/other-repo"),
    }, "Open the other repo");
}

//
// Shows the commits page as the only page of a router, as the app does, inside a RepoProvider
// with the repo the test gives open, or none for undefined, beside a button that opens another
// repo.
//
function renderCommitsPage(repoPath: string | undefined): void {
    const rootRoute = createRootRoute();
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: (): JSX.Element => createElement("div", null,
            createElement(OpenOtherRepoButton),
            createElement(CommitsPage),
        ),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([commitsRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
    render(createElement(RepoProvider, {
        initialRepoPath: repoPath,
        children: createElement(RouterProvider, {
            router,
        }),
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
    renderCommitsPage("/repo");
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

//
// A second commit to list, below the first.
//
const secondCommitJson = {
    ...commitJson,
    hash: "2222222222222222222222222222222222222222",
    refs: [],
    title: "The second commit",
};

//
// Shows the commits page and lists both commits, with nothing selected or open.
//
async function listTwoCommits(ziggy: FakeTaskZiggy): Promise<void> {
    renderCommitsPage("/repo");
    await screen.findByText("Loading the commits.");
    completeTaskAt(ziggy, 0, {
        commits: [commitJson, secondCommitJson],
    });
    await screen.findByText("The second commit");
}

//
// Ends the commit details task the page queued at the index of window.ziggy's addTask calls, with
// README.md and notes.txt as the commit's changed files.
//
function completeCommitDetails(ziggy: FakeTaskZiggy, index: number): void {
    completeTaskAt(ziggy, index, {
        commit: commitJson,
        changedFiles: [
            {
                status: "A",
                path: "README.md",
                linesAdded: 1,
                linesDeleted: 0,
                isBinary: false,
            },
            {
                status: "M",
                path: "notes.txt",
                linesAdded: 1,
                linesDeleted: 1,
                isBinary: false,
            },
        ],
    });
}

//
// Presses the key with the focus where it is, on the commits page once it has opened, as a user
// does.
//
function pressKey(key: string): void {
    act(() => {
        fireEvent.keyDown(document.activeElement ?? document.body, {
            key,
        });
    });
}

//
// Returns true when the element with the data-id is drawn with MaterialUI's selection styling.
//
function isSelected(dataId: string): boolean {
    return elementWithDataId(dataId).className.includes("Mui-selected");
}

//
// Returns the data-ids of the open panes whose border is in the style guide's active pane colour,
// graft.css's --color-select-pane, so a test reads which pane is active.
//
function activePaneIds(): (string | null)[] {
    return Array.from(elementWithDataId("commit-columns").children)
        .filter(pane => pane instanceof HTMLElement && pane.className.includes(activePaneClasses))
        .map(pane => pane.getAttribute("data-id"));
}

describe("CommitsPage", () => {
    test("shows that no repo is open and queues no task while no repo is open", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage(undefined);
        expect((await screen.findByText(/No repo is open/)).getAttribute("data-id")).toBe("commits-no-repo");
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commits-heading");
        expect(ziggy.addTask).not.toHaveBeenCalled();
    });

    test("reads the repo opened in place of the one shown, with no commit open", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        expect(elementWithDataId("changed-file-README.md").textContent).toContain("README.md");
        fireEvent.click(screen.getByText("Open the other repo"));
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(document.querySelector("[data-id=\"changed-file-README.md\"]")).toBeNull();
        const calls = (ziggy.addTask as jest.Mock).mock.calls;
        const task: IAddTask = calls[calls.length - 1][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/other-repo",
            pageSize: 50,
        });
    });

    test("queues the commits task for the repo's first page and shows that it is loading", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage("/repo");
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commits-heading");
        expect(screen.getByText("About").getAttribute("data-id")).toBe("commits-about-link");
        expect(screen.getByText("About").getAttribute("href")).toBe("/about");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/repo",
            pageSize: 50,
        });
    });

    test("lists the commits once the task has read them", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage("/repo");
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
        renderCommitsPage("/repo");
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
        expect(elementWithDataId(`commit-${commitJson.hash}`).className).toContain("font-[var(--weight-bold)]");
        expect(elementWithDataId(`commit-${commitJson.hash}`).className).toContain("Mui-selected");
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
        expect(elementWithDataId("changed-file-README.md").className).toContain("Mui-selected");
    });

    test("scrolls the commit details pane into view when it opens, then the file pane", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        expect(scrolledDataIds()).toEqual(["commit-details-pane"]);
        expect(scrollIntoView).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        expect(scrolledDataIds()).toEqual(["commit-details-pane", "file-pane"]);
    });

    test("scrolls nothing while no commit is open", async () => {
        const ziggy = installFakeTaskZiggy();
        renderCommitsPage("/repo");
        await screen.findByText("Loading the commits.");
        completeTaskAt(ziggy, 0, {
            commits: [commitJson],
        });
        await screen.findByText("The first commit");
        expect(scrollIntoView).not.toHaveBeenCalled();
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
        expect(elementWithDataId("changed-file-README.md").className).not.toContain("Mui-selected");
    });
});

describe("CommitsPage keys", () => {
    test("takes the focus when it opens, so the keys work at once", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        expect(document.activeElement).toBe(elementWithDataId("commits-page"));
    });

    test("handles the keys with the focus on the page's body", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        act(() => {
            document.querySelector<HTMLElement>("[data-id=\"commits-page\"]")?.blur();
        });
        expect(document.activeElement).toBe(document.body);
        pressKey("ArrowDown");
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
    });

    test("starts with the commit pane active and nothing selected", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        expect(activePaneIds()).toEqual(["commit-pane"]);
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(false);
        expect(isSelected(`commit-${secondCommitJson.hash}`)).toBe(false);
    });

    test("Down and Up move the selection through the commits", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
        pressKey("ArrowDown");
        expect(isSelected(`commit-${secondCommitJson.hash}`)).toBe(true);
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(false);
        pressKey("ArrowUp");
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
    });

    test("Enter opens the selected commit's details pane and makes it active", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        pressKey("Enter");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[1][0];
        expect(task.taskType).toBe("commit-details");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: secondCommitJson.hash,
        });
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
    });

    test("Enter with nothing selected opens nothing", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("Enter");
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["commit-pane"]);
    });

    test("Down, Up and Enter in the commit details pane select and open a changed file", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        expect(isSelected("changed-file-README.md")).toBe(true);
        pressKey("ArrowDown");
        expect(isSelected("changed-file-notes.txt")).toBe(true);
        pressKey("ArrowUp");
        pressKey("ArrowDown");
        pressKey("Enter");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[2][0];
        expect(task.taskType).toBe("file-diff");
        expect(task.data).toEqual({
            repoPath: "/repo",
            hash: commitJson.hash,
            path: "notes.txt",
        });
        expect(activePaneIds()).toEqual(["file-pane"]);
    });

    test("Down in the commit details pane selects nothing until its files are read", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        pressKey("ArrowDown");
        completeCommitDetails(ziggy, 1);
        expect(isSelected("changed-file-README.md")).toBe(false);
    });

    test("Left and Right move between the open panes and stop at the ends", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowRight");
        expect(activePaneIds()).toEqual(["commit-pane"]);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        pressKey("Enter");
        pressKey("ArrowRight");
        expect(activePaneIds()).toEqual(["file-pane"]);
        pressKey("ArrowLeft");
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        pressKey("ArrowLeft");
        expect(activePaneIds()).toEqual(["commit-pane"]);
        pressKey("ArrowLeft");
        expect(activePaneIds()).toEqual(["commit-pane"]);
        pressKey("ArrowRight");
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
    });

    test("Up and Down in the file pane change nothing", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        pressKey("Enter");
        pressKey("ArrowDown");
        expect(isSelected("changed-file-README.md")).toBe(true);
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
    });

    test("Escape closes the rightmost pane and makes the pane to its left active, then does nothing", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        pressKey("Enter");
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["commit-pane"]);
        pressKey("Escape");
        expect(activePaneIds()).toEqual(["commit-pane"]);
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
    });

    test("keeps each key it handles from the rest of the page", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        const event = new KeyboardEvent("keydown", {
            key: "ArrowDown",
            bubbles: true,
            cancelable: true,
        });
        act(() => {
            document.body.dispatchEvent(event);
        });
        expect(event.defaultPrevented).toBe(true);
    });

    test("leaves other keys alone", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        const event = new KeyboardEvent("keydown", {
            key: "a",
            bubbles: true,
            cancelable: true,
        });
        act(() => {
            document.body.dispatchEvent(event);
        });
        expect(event.defaultPrevented).toBe(false);
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(false);
    });

    test("ignores the keys while a text box has the focus", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        const textBox = document.createElement("input");
        elementWithDataId("commits-page").appendChild(textBox);
        act(() => {
            fireEvent.keyDown(textBox, {
                key: "ArrowDown",
            });
        });
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(false);
        textBox.remove();
    });

    test("ignores the keys with Ctrl held", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        act(() => {
            fireEvent.keyDown(document.body, {
                key: "ArrowDown",
                ctrlKey: true,
            });
        });
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(false);
    });

    test("Enter on a focused commit row opens it once, with the commit details pane active", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        fireEvent.click(elementWithDataId(`commit-${commitJson.hash}`));
        expect(activePaneIds()).toEqual(["commit-pane"]);
        act(() => {
            fireEvent.keyDown(elementWithDataId(`commit-${commitJson.hash}`), {
                key: "Enter",
            });
        });
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        expect((ziggy.addTask as jest.Mock).mock.calls.length).toBe(2);
    });

    test("clicking a changed file selects it and makes the commit details pane active", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        pressKey("Enter");
        fireEvent.click(elementWithDataId("changed-file-notes.txt"));
        expect(isSelected("changed-file-notes.txt")).toBe(true);
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        fireEvent.click(elementWithDataId(`commit-${secondCommitJson.hash}`));
        expect(isSelected(`commit-${secondCommitJson.hash}`)).toBe(true);
        expect(activePaneIds()).toEqual(["commit-pane"]);
    });

    test("stops handling the keys once the page has gone", async () => {
        const ziggy = installFakeTaskZiggy();
        const removeEventListener = jest.spyOn(document, "removeEventListener");
        await listTwoCommits(ziggy);
        cleanup();
        expect(removeEventListener).toHaveBeenCalledWith("keydown", expect.any(Function), {
            capture: true,
        });
        removeEventListener.mockRestore();
    });
});

describe("scrollLastPaneIntoView", () => {
    test("scrolls the last pane in the columns into view", () => {
        const columns = document.createElement("div");
        const firstPane = document.createElement("section");
        const lastPane = document.createElement("section");
        columns.append(firstPane, lastPane);
        scrollLastPaneIntoView(columns);
        expect(scrollIntoView.mock.contexts).toEqual([lastPane]);
    });

    test("scrolls nothing when the columns are not drawn or hold no pane", () => {
        scrollLastPaneIntoView(null);
        scrollLastPaneIntoView(document.createElement("div"));
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});
