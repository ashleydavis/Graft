//
// Tests the repo explorer page: renders it in a router with a fake window.ziggy made of Jest mocks,
// and checks that it opens on the repo details pane with the repo's name and path, and that its
// Commits link opens the commit pane, which queues the commits task for the repo, shows that it is
// loading, then lists the commits or says why they could not be read. It also checks the columns:
// clicking a commit opens the commit details pane and highlights the commit, clicking a changed
// file opens the file pane and highlights the file and each pane closes, and that the page scrolls
// each pane that opens into view.
// It presses the repo explorer's keys on the page and checks how they move the selection, change
// the active pane, open and close panes, and that they are left alone in a text box, outside the
// page and with Ctrl held. Dates are checked against the browser's own locale and time zone, which
// the page passes on. The page reads the open repo from a RepoProvider: it shows when no repo is
// open and reads another repo afresh when one is opened in its place. It checks the page starts
// with its panes, or with the message that no repo is open, because the breadcrumb trail names it.
// Its Commit link opens the changes pane, which reads the working tree's changes, opens a changed
// file's pane on a click or on Enter, and stages or unstages a file and reads the changes again,
// with the file's pane following the file to the other list. The commit section commits the
// staged files with the typed message, clears it and reads the changes again, or shows git's error
// text and keeps it. It checks the page puts a step in the breadcrumb trail for each open pane as
// panes open and close, and takes them out when it closes.
// Each pane after the repo details pane fades in as it opens, and as it closes stays drawn, inert,
// in a column that fades and narrows until its animation ends, while the keys and clicks still act
// on the other panes. Under reduced motion the columns have an empty animation class and a closed
// pane goes at once.
//

import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement, JSX } from "react";
import type { IAddTask, ITaskCompletedEvent } from "ziggy";
import { PaneTrailContext } from "../../../components/pane-trail";
import { RepoProvider, useRepo } from "../../../components/repo-context";
import { ITrailStep } from "../../../lib/breadcrumb-trail";
import { ICommit } from "../../../lib/commits";
import { formatDate, formatDateTime } from "../../../lib/date-format";
import { REDUCED_MOTION_QUERY } from "../../../lib/pane-animation";
import { RepoExplorerPage, scrollLastPaneIntoView } from "../../../pages/repo-explorer";
import { activeFlatPaneClasses, activePaneClasses } from "../../../pages/repo-explorer/components/active-pane-style";
import { openRowClasses } from "../../../pages/repo-explorer/components/commit-list";
import { IFakeListLayout, installFakeListLayout } from "../../fake-list-layout";
import { makeFakeMediaQuery } from "../../fake-media-query";
import { FakeTaskZiggy, installFakeTaskZiggy } from "../../fake-ziggy";
import { RepoOpener } from "../../repo-opener";

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

//
// Records the pane steps the page puts in the breadcrumb trail, in place of the layout that draws
// the trail.
//
const setPaneSteps = jest.fn();

//
// The fake layout each test runs with, so the commit list has a height to draw its rows in.
//
let layout: IFakeListLayout;

beforeEach(() => {
    scrollIntoView.mockClear();
    setPaneSteps.mockClear();
    layout = installFakeListLayout();
});

afterEach(() => {
    layout.uninstall();
});

//
// Reads the data-ids of the pane steps the page last put in the breadcrumb trail.
//
function lastPaneStepIds(): string[] {
    const calls = setPaneSteps.mock.calls;
    const steps: ITrailStep[] = calls[calls.length - 1][0];
    return steps.map(step => step.dataId);
}

//
// Installs a fake window.matchMedia whose reduced motion query matches when isReducedMotion is
// true. jsdom has no window.matchMedia and runs no animations, so a closing pane would stay drawn
// for good. Most tests check what the page draws once a pane has gone, so they run with reduced
// motion, where a closed pane goes at once. The tests of the animation turn it off and end each
// closing animation themselves.
//
function installReducedMotion(isReducedMotion: boolean): void {
    window.matchMedia = (query: string): MediaQueryList => makeFakeMediaQuery(query, query === REDUCED_MOTION_QUERY && isReducedMotion);
}

beforeEach(() => {
    installReducedMotion(true);
});

//
// Reads the data-ids of the panes in the columns the page scrolled into view, in the order it
// scrolled them.
//
function scrolledDataIds(): (string | null)[] {
    return scrollIntoView.mock.contexts.map(element => {
        //
        // The cast is safe because the mock is only ever called as a method of an element, and a
        // type guard cannot narrow it because Jest types each context as unknown.
        //
        return paneInColumn(element as Element).getAttribute("data-id");
    });
}

//
// Finds the pane the page draws in the column: the column itself for the repo details pane, which
// the page draws on its own, or else the one pane the column holds.
//
function paneInColumn(column: Element): Element {
    if (column.hasAttribute("data-id")) {
        return column;
    }
    expect(column.firstElementChild).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return column.firstElementChild as Element;
}

//
// Lists the panes the page draws, from left to right.
//
function paneElements(): Element[] {
    return Array.from(elementWithDataId("repo-explorer-columns").children).map(column => paneInColumn(column));
}

//
// Shows a button that opens the repo at "/other-repo", as the open-repo action does, so a test can
// open another repo while the repo explorer page shows.
//
function OpenOtherRepoButton(): JSX.Element {
    const { openRepo } = useRepo();
    return createElement("button", {
        onClick: () => openRepo("/other-repo"),
    }, "Open the other repo");
}

//
// Shows the repo explorer page as the only page of a router, as the app does, inside a RepoProvider
// with the repo the test gives open, or none for undefined, beside a button that opens another
// repo. The layout's PaneTrailContext around the router gives the page the setPaneSteps mock.
//
function renderRepoExplorerPage(repoPath: string | undefined): void {
    const rootRoute = createRootRoute();
    const pageRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: (): JSX.Element => createElement("div", null,
            createElement(OpenOtherRepoButton),
            createElement(RepoExplorerPage),
        ),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([pageRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
    render(createElement(RepoProvider, {
        children: [
            createElement(RepoOpener, {
                key: "repo-opener",
                repoPath,
            }),
            createElement(PaneTrailContext.Provider, {
                key: "pane-trail",
                value: {
                    setPaneSteps,
                },
                children: createElement(RouterProvider, {
                    router,
                }),
            }),
        ],
    }));
}

//
// Waits for the repo details pane's Commits link, which the router draws after the first render,
// and clicks it, as a user does, which opens the commit pane.
//
async function clickCommitsLink(): Promise<void> {
    fireEvent.click(await screen.findByText("Commits"));
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
// Shows the repo explorer page, clicks its Commits link, lists the commit, clicks it and ends its
// commit details task with README.md as its one changed file.
//
async function openCommitDetails(ziggy: FakeTaskZiggy): Promise<void> {
    renderRepoExplorerPage("/repo");
    await clickCommitsLink();
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
// Shows the repo explorer page, opens the commit pane with the keys, Down and Enter on the Commits
// link, and lists both commits, with the commit pane active and no commit selected or open.
//
async function listTwoCommits(ziggy: FakeTaskZiggy): Promise<void> {
    renderRepoExplorerPage("/repo");
    await screen.findByText("Commits");
    pressKey("ArrowDown");
    pressKey("Enter");
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
// Presses the key with the focus where it is, on the repo explorer page once it has opened, as a
// user does.
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
// graft.css's --color-select-pane, so a test reads which pane is active. The file pane marks it
// with the classes of activeFlatPaneClass. A closing pane keeps how it last looked, so only the
// panes still open count.
//
function activePaneIds(): (string | null)[] {
    return paneElements()
        .filter(pane => pane.closest("[inert]") === null)
        .filter(pane => pane instanceof HTMLElement && (pane.className.includes(activePaneClasses) || pane.className.includes(activeFlatPaneClasses)))
        .map(pane => pane.getAttribute("data-id"));
}

describe("RepoExplorerPage", () => {
    test("shows that no repo is open and queues no task while no repo is open", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage(undefined);
        expect((await screen.findByText(/No repo is open/)).getAttribute("data-id")).toBe("repo-explorer-no-repo");
        expect(ziggy.addTask).not.toHaveBeenCalled();
    });

    test("shows no page heading and no About link while no repo is open, because the breadcrumb trail names the page", async () => {
        installFakeTaskZiggy();
        renderRepoExplorerPage(undefined);
        await screen.findByText(/No repo is open/);
        expect(elementWithDataId("repo-explorer-page").querySelector("h1")).toBeNull();
        expect(elementWithDataId("repo-explorer-page").querySelector("a")).toBeNull();
        expect(screen.queryByText("Repo explorer")).toBeNull();
        expect(screen.queryByText("About")).toBeNull();
    });

    test("shows no page heading and no About link while a repo is open, because the breadcrumb trail names the page", async () => {
        installFakeTaskZiggy();
        renderRepoExplorerPage("/repos/graft");
        await screen.findByText("/repos/graft");
        expect(elementWithDataId("repo-explorer-page").querySelector("h1")).toBeNull();
        expect(elementWithDataId("repo-explorer-page").querySelector("a[href=\"/about\"]")).toBeNull();
        expect(screen.queryByText("Repo explorer")).toBeNull();
        expect(screen.queryByText("About")).toBeNull();
        expect(elementWithDataId("repo-explorer-page").firstElementChild).toBe(elementWithDataId("repo-explorer-columns"));
    });

    test("opens on the repo details pane alone, with the repo's name and path and the Commits link, and queues no task", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repos/graft");
        expect((await screen.findByText("/repos/graft")).closest("[data-id=\"repo-details-path\"]")).not.toBeNull();
        expect(elementWithDataId("repo-details-name").textContent).toBe("graft");
        expect(elementWithDataId("repo-details-heading").textContent).toBe("Repograft");
        expect(elementWithDataId("repo-details-commits").textContent).toBe("Commits");
        const paneIds = paneElements().map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["repo-details-pane"]);
        expect(ziggy.addTask).not.toHaveBeenCalled();
    });

    test("opens the commit pane to the right of the repo details pane when the Commits link is clicked", async () => {
        installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
        await screen.findByText("Loading the commits.");
        const paneIds = paneElements().map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["repo-details-pane", "commit-pane"]);
        expect(elementWithDataId("repo-details-commits").className).toContain(openRowClasses);
        expect(isSelected("repo-details-commits")).toBe(true);
        expect(elementWithDataId("repo-details-commits").getAttribute("aria-current")).toBe("true");
        expect(scrolledDataIds()).toEqual(["commit-pane"]);
    });

    test("reads the repo opened in place of the one shown, with only the repo details pane open", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        expect(elementWithDataId("changed-file-README.md").textContent).toContain("README.md");
        fireEvent.click(screen.getByText("Open the other repo"));
        expect((await screen.findByText("/other-repo")).closest("[data-id=\"repo-details-path\"]")).not.toBeNull();
        expect(document.querySelector("[data-id=\"commit-pane\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"changed-file-README.md\"]")).toBeNull();
        await clickCommitsLink();
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        const calls = (ziggy.addTask as jest.Mock).mock.calls;
        const task: IAddTask = calls[calls.length - 1][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/other-repo",
            pageSize: 50,
            afterHash: null,
        });
    });

    test("queues the commits task for the repo's first page and shows that it is loading", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[0][0];
        expect(task.taskType).toBe("commits");
        expect(task.data).toEqual({
            repoPath: "/repo",
            pageSize: 50,
            afterHash: null,
        });
    });

    test("lists the commits once the task has read them", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
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
        //
        // The badge column holds a hidden copy of the badges it measures, so "main" is in it twice.
        //
        expect(elementWithDataId(`commit-${commit.hash}`).textContent).toBe(`The first commitmainmainAda Author${formatDate(commit.authorDate, Intl.DateTimeFormat().resolvedOptions())}1111111`);
    });

    test("says why the commits could not be read when the task failed", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
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
        const paneIds = paneElements().map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["repo-details-pane", "commit-pane", "commit-details-pane"]);
        expect(elementWithDataId(`commit-${commitJson.hash}`).className).toContain(openRowClasses);
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
        expect(elementWithDataId("file-diff").textContent).toContain("# Test repo");
        const paneIds = paneElements().map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["repo-details-pane", "commit-pane", "commit-details-pane", "file-pane"]);
        expect(elementWithDataId("changed-file-README.md").className).toContain("Mui-selected");
    });

    test("scrolls the commit pane into view when it opens, then the commit details pane, then the file pane", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        expect(scrolledDataIds()).toEqual(["commit-pane", "commit-details-pane"]);
        expect(scrollIntoView).toHaveBeenCalledWith({
            behavior: "smooth",
            block: "nearest",
            inline: "nearest",
        });
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        expect(scrolledDataIds()).toEqual(["commit-pane", "commit-details-pane", "file-pane"]);
    });

    test("scrolls nothing while only the repo details pane is open", async () => {
        installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await screen.findByText("/repo");
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

describe("RepoExplorerPage breadcrumb trail", () => {
    test("puts a step in the trail for each pane as the commit pane, a commit and a file open and close", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await screen.findByText("Commits");
        expect(lastPaneStepIds()).toEqual([]);
        await clickCommitsLink();
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-commits"]);
        completeTaskAt(ziggy, 0, {
            commits: [commitJson],
        });
        fireEvent.click(await screen.findByText("The first commit"));
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-commits", "breadcrumb-pane-commit"]);
        completeTaskAt(ziggy, 1, {
            commit: commitJson,
            changedFiles: [{
                status: "A",
                path: "docs/README.md",
                linesAdded: 1,
                linesDeleted: 0,
                isBinary: false,
            }],
        });
        fireEvent.click(await screen.findByText("README.md"));
        const calls = setPaneSteps.mock.calls;
        expect(calls[calls.length - 1][0]).toEqual([
            {
                label: "Commits",
                tooltip: "Commits",
                dataId: "breadcrumb-pane-commits",
                options: [],
            },
            {
                label: "1111111",
                tooltip: "1111111111111111111111111111111111111111",
                dataId: "breadcrumb-pane-commit",
                options: [],
            },
            {
                label: "README.md",
                tooltip: "docs/README.md",
                dataId: "breadcrumb-pane-file",
                options: [],
            },
        ]);
        fireEvent.click(screen.getByLabelText("Close file diff"));
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-commits", "breadcrumb-pane-commit"]);
    });

    test("puts the changes pane and its open file in the trail", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-changes"]);
        fireEvent.click(elementWithDataId("change-unstaged-notes.txt"));
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-changes", "breadcrumb-pane-file"]);
    });

    test("takes its pane steps out of the trail when the page closes", async () => {
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
        expect(lastPaneStepIds()).toEqual(["breadcrumb-pane-commits"]);
        cleanup();
        expect(lastPaneStepIds()).toEqual([]);
    });
});

describe("RepoExplorerPage keys", () => {
    test("takes the focus when it opens, so the keys work at once", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        expect(document.activeElement).toBe(elementWithDataId("repo-explorer-page"));
    });

    test("handles the keys with the focus on the page's body", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        act(() => {
            document.querySelector<HTMLElement>("[data-id=\"repo-explorer-page\"]")?.blur();
        });
        expect(document.activeElement).toBe(document.body);
        pressKey("ArrowDown");
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
    });

    test("starts with the repo details pane active and nothing selected", async () => {
        installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await screen.findByText("/repo");
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        expect(isSelected("repo-details-commits")).toBe(false);
    });

    test("Down selects the Commits link and Enter opens the commit pane and makes it active", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await screen.findByText("/repo");
        pressKey("Enter");
        expect(document.querySelector("[data-id=\"commit-pane\"]")).toBeNull();
        pressKey("ArrowDown");
        expect(isSelected("repo-details-commits")).toBe(true);
        pressKey("Enter");
        expect((ziggy.addTask as jest.Mock).mock.calls[0][0].taskType).toBe("commits");
        expect(activePaneIds()).toEqual(["commit-pane"]);
    });

    test("opens the commit pane with the commit pane active and no commit selected", async () => {
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
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        pressKey("ArrowLeft");
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        pressKey("ArrowRight");
        expect(activePaneIds()).toEqual(["commit-pane"]);
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

    test("Escape closes the rightmost pane and makes the pane to its left active, until only the repo details pane is left", async () => {
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
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"commit-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        expect(isSelected("repo-details-commits")).toBe(true);
        pressKey("Escape");
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
    });

    test("Enter on the Commits link after Escape closed the commit pane opens it again and reads the commits afresh", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"commit-pane\"]")).toBeNull();
        pressKey("Enter");
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect((ziggy.addTask as jest.Mock).mock.calls[1][0].taskType).toBe("commits");
        expect(activePaneIds()).toEqual(["commit-pane"]);
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
        elementWithDataId("repo-explorer-page").appendChild(textBox);
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

//
// Makes a page of the count of commits as the commits task gives them, starting at the index, each
// with a hash of its own made from its index and the title "Commit <index>".
//
function commitPageJson(firstIndex: number, count: number): typeof commitJson[] {
    return Array.from({
        length: count,
    }, (unusedValue, offset) => ({
        ...secondCommitJson,
        hash: (firstIndex + offset).toString(16).padStart(40, "0"),
        title: `Commit ${firstIndex + offset}`,
    }));
}

//
// Scrolls the commit list to its end, as a user does with the mouse wheel or the scroll bar.
//
function scrollCommitListToEnd(): void {
    const scrollArea = elementWithDataId("commit-list-scroll");
    act(() => {
        scrollArea.scrollTop = scrollArea.scrollHeight;
        scrollArea.dispatchEvent(new Event("scroll"));
    });
}

//
// Reads the data of the task the page queued at the index of window.ziggy's addTask calls.
//
function taskDataAt(ziggy: FakeTaskZiggy, index: number): IAddTask["data"] {
    return (ziggy.addTask as jest.Mock).mock.calls[index][0].data;
}

//
// Shows the repo explorer page, opens the commit pane with its Commits link and ends the commits
// task with a full first page.
//
async function listFirstPage(ziggy: FakeTaskZiggy): Promise<void> {
    renderRepoExplorerPage("/repo");
    await clickCommitsLink();
    await screen.findByText("Loading the commits.");
    completeTaskAt(ziggy, 0, {
        commits: commitPageJson(0, 50),
    });
    await screen.findByText("Commit 0");
}

describe("RepoExplorerPage commit pages", () => {
    test("reads no further page until the list scrolls near the end of the first", async () => {
        const ziggy = installFakeTaskZiggy();
        await listFirstPage(ziggy);
        expect(ziggy.addTask).toHaveBeenCalledTimes(1);
        expect(screen.queryByText("Loading the commits.")).toBeNull();
    });

    test("reads the next page after the last commit read when the list scrolls near the end, with a loading row while it is read", async () => {
        const ziggy = installFakeTaskZiggy();
        await listFirstPage(ziggy);
        scrollCommitListToEnd();
        expect(ziggy.addTask).toHaveBeenCalledTimes(2);
        expect(taskDataAt(ziggy, 1)).toEqual({
            repoPath: "/repo",
            pageSize: 50,
            afterHash: commitPageJson(49, 1)[0].hash,
        });
        expect(screen.getByText("Loading the commits.").getAttribute("data-id")).toBe("commits-loading");
        expect(screen.getByText("Commit 49")).toBeTruthy();

        completeTaskAt(ziggy, 1, {
            commits: commitPageJson(50, 50),
        });
        expect(screen.queryByText("Loading the commits.")).toBeNull();
        scrollCommitListToEnd();
        expect(screen.getByText("Commit 99")).toBeTruthy();
        expect(taskDataAt(ziggy, 2)).toEqual({
            repoPath: "/repo",
            pageSize: 50,
            afterHash: commitPageJson(99, 1)[0].hash,
        });
    });

    test("reads no more pages after a page shorter than the page size, which ends at the first commit", async () => {
        const ziggy = installFakeTaskZiggy();
        await listFirstPage(ziggy);
        scrollCommitListToEnd();
        completeTaskAt(ziggy, 1, {
            commits: commitPageJson(50, 3),
        });
        scrollCommitListToEnd();
        expect(screen.getByText("Commit 52")).toBeTruthy();
        expect(ziggy.addTask).toHaveBeenCalledTimes(2);
        expect(screen.queryByText("Loading the commits.")).toBeNull();
    });

    test("shows an error row under the commits read when a later page could not be read, and reads no more", async () => {
        const ziggy = installFakeTaskZiggy();
        await listFirstPage(ziggy);
        scrollCommitListToEnd();
        const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[1][0];
        const taskId: string = (ziggy.addTask as jest.Mock).mock.calls[1][0].taskId;
        act(() => {
            onTaskCompleted({
                taskId,
                result: {
                    taskId,
                    status: "failed",
                    errorMessage: "Running git log failed.",
                    type: "commits",
                    inputs: null,
                },
            });
        });
        expect(screen.getByText("Running git log failed.").getAttribute("data-id")).toBe("commits-error");
        expect(screen.getByText("Commit 49")).toBeTruthy();
        scrollCommitListToEnd();
        expect(ziggy.addTask).toHaveBeenCalledTimes(2);
    });

    test("drops a page read before the commit pane closed and opened again", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
        await screen.findByText("Loading the commits.");
        pressKey("Escape");
        pressKey("Enter");
        await screen.findByText("Loading the commits.");
        completeTaskAt(ziggy, 0, {
            commits: commitPageJson(100, 2),
        });
        expect(screen.queryByText("Commit 100")).toBeNull();
        expect(screen.getByText("Loading the commits.")).toBeTruthy();
        completeTaskAt(ziggy, 1, {
            commits: commitPageJson(0, 2),
        });
        expect(screen.getByText("Commit 0")).toBeTruthy();
        expect(screen.queryByText("Commit 100")).toBeNull();
    });

    test("Down moves the selection from the first page onto the next and scrolls each selected row into view", async () => {
        const ziggy = installFakeTaskZiggy();
        await listFirstPage(ziggy);
        scrollCommitListToEnd();
        completeTaskAt(ziggy, 1, {
            commits: commitPageJson(50, 3),
        });
        layout.scrollTo.mockClear();
        pressKey("ArrowRight");
        for (let press = 0; press < 51; press++) {
            pressKey("ArrowDown");
        }
        expect(isSelected(`commit-${commitPageJson(50, 1)[0].hash}`)).toBe(true);
        expect(layout.scrollTo).toHaveBeenCalled();
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        expect(isSelected(`commit-${commitPageJson(52, 1)[0].hash}`)).toBe(true);
// Finds the column the page draws the pane with the data-id in, failing the test when the page
// does not show the pane.
//
function columnOf(dataId: string): HTMLElement {
    const column = elementWithDataId(dataId).parentElement;
    expect(column).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return column as HTMLElement;
}

describe("RepoExplorerPage pane animation", () => {
    beforeEach(() => {
        installReducedMotion(false);
    });

    test("fades each pane in as it opens", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        for (const dataId of ["commit-pane", "commit-details-pane", "file-pane"]) {
            expect(columnOf(dataId).className).toContain("graft-pane-in");
            expect(columnOf(dataId).className).not.toContain("graft-pane-out");
            expect(columnOf(dataId).hasAttribute("inert")).toBe(false);
        }
        expect(elementWithDataId("repo-details-pane").parentElement).toBe(elementWithDataId("repo-explorer-columns"));
    });

    test("keeps a closing pane drawn, inert and fading out, until its own animation ends", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        fireEvent.click(elementWithDataId("file-pane-close"));
        const column = columnOf("file-pane");
        expect(column.className).toContain("graft-pane-out");
        expect(column.className).not.toContain("graft-pane-in");
        expect(column.hasAttribute("inert")).toBe(true);
        fireEvent.animationEnd(elementWithDataId("file-pane"));
        expect(columnOf("file-pane")).toBe(column);
        fireEvent.animationEnd(column);
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-in");
    });

    test("narrows a closing pane from its column's width as the animation starts", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("commit-details-close"));
        const column = columnOf("commit-details-pane");
        jest.spyOn(column, "offsetWidth", "get").mockReturnValue(450);
        fireEvent.animationStart(elementWithDataId("commit-details-pane"));
        expect(column.style.getPropertyValue("--pane-width")).toBe("");
        fireEvent.animationStart(column);
        expect(column.style.getPropertyValue("--pane-width")).toBe("450px");
    });

    test("moves the focus out of a closing pane as its animation starts", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        const closeButton = document.querySelector<HTMLElement>("[data-id=\"file-pane-close\"]");
        //
        // The button's focus ripple starts and stops after a promise settles, so the focus and the
        // blur run in an async act that waits for it.
        //
        await act(async () => {
            closeButton?.focus();
        });
        expect(document.activeElement).toBe(closeButton);
        fireEvent.click(elementWithDataId("file-pane-close"));
        const column = columnOf("file-pane");
        await act(async () => {
            fireEvent.animationStart(column);
        });
        expect(document.activeElement).toBe(document.body);
        pressKey("Escape");
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-out");
    });

    test("closes the panes with the keys while they animate and reopens a closing pane", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        completeCommitDetails(ziggy, 1);
        pressKey("ArrowDown");
        pressKey("Enter");
        pressKey("Escape");
        pressKey("Escape");
        expect(columnOf("file-pane").className).toContain("graft-pane-out");
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-out");
        expect(activePaneIds()).toEqual(["commit-pane"]);
        pressKey("Enter");
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-in");
        expect(columnOf("commit-details-pane").hasAttribute("inert")).toBe(false);
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        fireEvent.animationEnd(columnOf("file-pane"));
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
    });

    test("clicks the open panes while a pane closes", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("commit-details-close"));
        fireEvent.click(elementWithDataId(`commit-${commitJson.hash}`));
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-in");
    });

    test("scrolls the last pane still open into view as a pane closes", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        scrollIntoView.mockClear();
        fireEvent.click(elementWithDataId("file-pane-close"));
        expect(scrolledDataIds()).toEqual(["commit-details-pane"]);
        expect(scrollIntoView.mock.contexts).toEqual([columnOf("commit-details-pane")]);
    });

    test("draws another commit's details afresh, so they fade in again", async () => {
        const ziggy = installFakeTaskZiggy();
        await listTwoCommits(ziggy);
        pressKey("ArrowDown");
        pressKey("Enter");
        const firstColumn = columnOf("commit-details-pane");
        pressKey("ArrowLeft");
        pressKey("ArrowDown");
        pressKey("Enter");
        expect(columnOf("commit-details-pane")).not.toBe(firstColumn);
        expect(columnOf("commit-details-pane").className).toContain("graft-pane-in");
    });

    test("closes the commit pane as the Commit link opens the changes pane in its place", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await clickCommitsLink();
        fireEvent.click(await screen.findByText("Commit"));
        expect(columnOf("commit-pane").className).toContain("graft-pane-out");
        expect(columnOf("changes-pane").className).toContain("graft-pane-in");
        expect(taskTypeAt(ziggy, 1)).toBe("working-changes");
    });
});

describe("RepoExplorerPage pane animation under reduced motion", () => {
    test("gives the columns no animation class and removes a closed pane at once", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        expect(columnOf("commit-details-pane").className).not.toContain("graft-pane");
        fireEvent.click(elementWithDataId("commit-details-close"));
        expect(document.querySelector("[data-id=\"commit-details-pane\"]")).toBeNull();
        expect(columnOf("commit-pane").className).not.toContain("graft-pane");
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

    test("passes over a closing pane, whose column is inert, to the last pane still open", () => {
        const columns = document.createElement("div");
        const openPane = document.createElement("section");
        const closingPane = document.createElement("section");
        closingPane.setAttribute("inert", "");
        columns.append(openPane, closingPane);
        scrollLastPaneIntoView(columns);
        expect(scrollIntoView.mock.contexts).toEqual([openPane]);
    });

    test("scrolls nothing when the columns are not drawn or hold no pane", () => {
        scrollLastPaneIntoView(null);
        scrollLastPaneIntoView(document.createElement("div"));
        expect(scrollIntoView).not.toHaveBeenCalled();
    });
});

//
// The working tree's changes as the working changes task gives them: notes.txt modified and
// unstaged and old.txt deleted and staged.
//
const changesJson = {
    unstaged: [{
        status: "M",
        path: "notes.txt",
    }],
    staged: [{
        status: "D",
        path: "old.txt",
    }],
};

//
// Reads the task type of window.ziggy's addTask call at the index.
//
function taskTypeAt(ziggy: FakeTaskZiggy, index: number): string {
    return (ziggy.addTask as jest.Mock).mock.calls[index][0].taskType;
}

//
// Shows the repo explorer page, clicks its Commit link and ends the working changes task with
// `changesJson`.
//
async function openChanges(ziggy: FakeTaskZiggy): Promise<void> {
    renderRepoExplorerPage("/repo");
    fireEvent.click(await screen.findByText("Commit"));
    await screen.findByText("Loading the changes.");
    completeTaskAt(ziggy, 0, changesJson);
    await screen.findByText("Unstaged (1)");
}

describe("RepoExplorerPage changes pane", () => {
    test("opens the changes pane to the right of the repo details pane when the Commit link is clicked and reads the changes", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        expect(taskTypeAt(ziggy, 0)).toBe("working-changes");
        expect((ziggy.addTask as jest.Mock).mock.calls[0][0].data).toEqual({
            repoPath: "/repo",
        });
        const paneIds = paneElements().map(pane => pane.getAttribute("data-id"));
        expect(paneIds).toEqual(["repo-details-pane", "changes-pane"]);
        expect(elementWithDataId("change-unstaged-notes.txt").textContent).toBe("notes.txt");
        expect(elementWithDataId("change-staged-old.txt").textContent).toBe("old.txt");
        expect(scrolledDataIds()).toContain("changes-pane");
    });

    test("shows why the changes could not be read when the task failed", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        fireEvent.click(await screen.findByText("Commit"));
        await screen.findByText("Loading the changes.");
        completeTask(ziggy, {
            taskId: "",
            status: "failed",
            errorMessage: "Running git status failed.",
            type: "working-changes",
            inputs: null,
        });
        expect((await screen.findByText("Running git status failed.")).getAttribute("data-id")).toBe("changes-error");
    });

    test("opens a changed file's pane with its unstaged diff when its row is clicked", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("change-unstaged-notes.txt"));
        expect(taskTypeAt(ziggy, 1)).toBe("working-file-diff");
        expect((ziggy.addTask as jest.Mock).mock.calls[1][0].data).toEqual({
            repoPath: "/repo",
            path: "notes.txt",
            isStaged: false,
            status: "M",
        });
        expect(elementWithDataId("file-pane-path").textContent).toBe("notes.txt");
        expect(activePaneIds()).toEqual(["changes-pane"]);
        expect(isSelected("change-unstaged-notes.txt")).toBe(true);
        fireEvent.click(screen.getByLabelText("Close file diff"));
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
    });

    test("stages a file, reads the changes again and follows the open file to the staged list", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("change-unstaged-notes.txt"));
        fireEvent.click(elementWithDataId("stage-notes.txt"));
        expect(taskTypeAt(ziggy, 2)).toBe("stage-file");
        expect((ziggy.addTask as jest.Mock).mock.calls[2][0].data).toEqual({
            repoPath: "/repo",
            path: "notes.txt",
        });
        completeTaskAt(ziggy, 2, {
            path: "notes.txt",
        });
        expect(taskTypeAt(ziggy, 3)).toBe("working-changes");
        completeTaskAt(ziggy, 3, {
            unstaged: [],
            staged: [
                {
                    status: "M",
                    path: "notes.txt",
                },
                {
                    status: "D",
                    path: "old.txt",
                },
            ],
        });
        expect(await screen.findByText("Staged (2)")).not.toBeNull();
        expect(elementWithDataId("changes-unstaged-empty").textContent).toBe("Everything is staged.");
        expect(isSelected("change-staged-notes.txt")).toBe(true);
        expect(elementWithDataId("change-staged-notes.txt").getAttribute("aria-current")).toBe("true");
        expect(taskTypeAt(ziggy, 4)).toBe("working-file-diff");
        expect((ziggy.addTask as jest.Mock).mock.calls[4][0].data.isStaged).toBe(true);
    });

    test("unstages a file and closes no pane when another file was open", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("unstage-old.txt"));
        expect(taskTypeAt(ziggy, 1)).toBe("unstage-file");
        completeTaskAt(ziggy, 1, {
            path: "old.txt",
        });
        completeTaskAt(ziggy, 2, {
            unstaged: [
                {
                    status: "M",
                    path: "notes.txt",
                },
                {
                    status: "D",
                    path: "old.txt",
                },
            ],
            staged: [],
        });
        expect(await screen.findByText("Unstaged (2)")).not.toBeNull();
        expect(elementWithDataId("changes-staged-empty").textContent).toBe("Nothing staged yet.");
    });

    test("closes a changed file's pane when its row has gone after the changes are read again", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("change-staged-old.txt"));
        fireEvent.click(elementWithDataId("stage-notes.txt"));
        completeTaskAt(ziggy, 2, {
            path: "notes.txt",
        });
        completeTaskAt(ziggy, 3, {
            unstaged: [],
            staged: [{
                status: "M",
                path: "notes.txt",
            }],
        });
        await screen.findByText("Staged (1)");
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
    });

    test("shows why a file was not staged and keeps the lists", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("stage-notes.txt"));
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[1][0];
        const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[1][0];
        act(() => {
            onTaskCompleted({
                taskId: task.taskId,
                result: {
                    taskId: task.taskId,
                    status: "failed",
                    errorMessage: "Running git add failed.",
                    type: "stage-file",
                    inputs: null,
                },
            });
        });
        expect(elementWithDataId("changes-stage-error").textContent).toBe("Running git add failed.");
        expect(elementWithDataId("change-unstaged-notes.txt")).not.toBeNull();
        expect((ziggy.addTask as jest.Mock).mock.calls.length).toBe(2);
    });

    test("the keys open the changes pane, move through its rows, open a file and close the panes", async () => {
        const ziggy = installFakeTaskZiggy();
        renderRepoExplorerPage("/repo");
        await screen.findByText("Commit");
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        expect(isSelected("repo-details-commit")).toBe(true);
        pressKey("Enter");
        expect(activePaneIds()).toEqual(["changes-pane"]);
        completeTaskAt(ziggy, 0, changesJson);
        await screen.findByText("Unstaged (1)");
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        expect(isSelected("change-staged-old.txt")).toBe(true);
        pressKey("Enter");
        expect(activePaneIds()).toEqual(["file-pane"]);
        expect((ziggy.addTask as jest.Mock).mock.calls[1][0].data.isStaged).toBe(true);
        pressKey("ArrowDown");
        expect(isSelected("change-staged-old.txt")).toBe(true);
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["changes-pane"]);
        pressKey("Escape");
        expect(document.querySelector("[data-id=\"changes-pane\"]")).toBeNull();
        expect(isSelected("repo-details-commit")).toBe(true);
    });
});

//
// Types the message into the commit section's message box, as a user does.
//
function typeCommitMessage(message: string): void {
    fireEvent.change(elementWithDataId("commit-message"), {
        target: {
            value: message,
        },
    });
}

describe("RepoExplorerPage commit section", () => {
    test("commits the staged files with the message, clears the message and reads the changes again", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        typeCommitMessage("Remove the old file");
        expect(elementWithDataId("commit-button").textContent).toBe("Commit 1 file");
        fireEvent.click(elementWithDataId("commit-button"));
        expect(taskTypeAt(ziggy, 1)).toBe("commit");
        expect((ziggy.addTask as jest.Mock).mock.calls[1][0].data).toEqual({
            repoPath: "/repo",
            message: "Remove the old file",
        });
        expect(elementWithDataId("commit-button")).toHaveProperty("disabled", true);
        completeTaskAt(ziggy, 1, {
            message: "Remove the old file",
        });
        expect(elementWithDataId("commit-message")).toHaveProperty("value", "");
        expect(taskTypeAt(ziggy, 2)).toBe("working-changes");
        completeTaskAt(ziggy, 2, {
            unstaged: changesJson.unstaged,
            staged: [],
        });
        expect(await screen.findByText("Staged (0)")).not.toBeNull();
        expect(elementWithDataId("commit-button").textContent).toBe("Nothing to commit");
        expect(document.querySelector("[data-id=\"commit-error\"]")).toBeNull();
    });

    test("shows git's error text when the commit fails, keeps the message and clears the error on the next commit", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        typeCommitMessage("Remove the old file");
        fireEvent.click(elementWithDataId("commit-button"));
        const task: IAddTask = (ziggy.addTask as jest.Mock).mock.calls[1][0];
        const onTaskCompleted = (ziggy.onTaskCompleted as jest.Mock).mock.calls[1][0];
        act(() => {
            onTaskCompleted({
                taskId: task.taskId,
                result: {
                    taskId: task.taskId,
                    status: "failed",
                    errorMessage: "Git did not make the commit:\nThe pre-commit hook found a problem.",
                    type: "commit",
                    inputs: null,
                },
            });
        });
        expect(elementWithDataId("commit-error").textContent).toBe("Git did not make the commit:\nThe pre-commit hook found a problem.");
        expect(elementWithDataId("commit-message")).toHaveProperty("value", "Remove the old file");
        expect(elementWithDataId("commit-button")).toHaveProperty("disabled", false);
        expect((ziggy.addTask as jest.Mock).mock.calls.length).toBe(2);

        fireEvent.click(elementWithDataId("commit-button"));
        completeTaskAt(ziggy, 2, {
            message: "Remove the old file",
        });
        expect(document.querySelector("[data-id=\"commit-error\"]")).toBeNull();
    });
});

describe("RepoExplorerPage pane clicks", () => {
    test("clicking a pane's title bar makes that pane active", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        fireEvent.click(elementWithDataId("file-pane-path"));
        expect(activePaneIds()).toEqual(["file-pane"]);
        fireEvent.click(elementWithDataId("commit-pane-heading"));
        expect(activePaneIds()).toEqual(["commit-pane"]);
        fireEvent.click(elementWithDataId("commit-details-heading"));
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        fireEvent.click(elementWithDataId("repo-details-heading"));
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
    });

    test("clicking a pane's empty space makes that pane active and a click between the panes changes nothing", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        fireEvent.click(elementWithDataId("repo-details-pane"));
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        fireEvent.click(elementWithDataId("file-pane"));
        expect(activePaneIds()).toEqual(["file-pane"]);
        fireEvent.click(elementWithDataId("repo-explorer-columns"));
        expect(activePaneIds()).toEqual(["file-pane"]);
    });

    test("a click on a row or a close button still does what it did, with the pane it leaves active", async () => {
        const ziggy = installFakeTaskZiggy();
        await openCommitDetails(ziggy);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        fireEvent.click(elementWithDataId("repo-details-heading"));
        fireEvent.click(elementWithDataId(`commit-${commitJson.hash}`));
        expect(isSelected(`commit-${commitJson.hash}`)).toBe(true);
        expect(activePaneIds()).toEqual(["commit-pane"]);
        fireEvent.click(elementWithDataId("changed-file-README.md"));
        fireEvent.click(elementWithDataId("repo-details-heading"));
        fireEvent.click(elementWithDataId("file-pane-close"));
        expect(document.querySelector("[data-id=\"file-pane\"]")).toBeNull();
        expect(activePaneIds()).toEqual(["commit-details-pane"]);
        fireEvent.click(elementWithDataId("repo-details-commits"));
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
    });

    test("clicking the changes pane's title bar or its file pane makes that pane active", async () => {
        const ziggy = installFakeTaskZiggy();
        await openChanges(ziggy);
        fireEvent.click(elementWithDataId("change-unstaged-notes.txt"));
        fireEvent.click(elementWithDataId("file-pane-path"));
        expect(activePaneIds()).toEqual(["file-pane"]);
        fireEvent.click(elementWithDataId("changes-heading"));
        expect(activePaneIds()).toEqual(["changes-pane"]);
        fireEvent.click(elementWithDataId("repo-details-heading"));
        expect(activePaneIds()).toEqual(["repo-details-pane"]);
        fireEvent.click(elementWithDataId("changes-pane"));
        expect(activePaneIds()).toEqual(["changes-pane"]);
    });
});
