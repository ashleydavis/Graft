//
// Tests the app's layout: renders it as the root of a router with a mock page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the Keyboard Shortcuts action shows the keyboard shortcuts overlay over it, that
// the Commit Explorer action opens the commits page from any page and is removed with the layout,
// that the left sidebar starts expanded and the right sidebar closed, that the top bar's buttons
// minimise and expand the left sidebar and slide the right sidebar in and out, that both sidebars
// are saved in Graft's state file and restored from it, that the top bar's breadcrumb trail
// follows the page shown and its drop-down opens another page and that the right sidebar shows the
// Git commands the page shown has run. It also checks the layout reads the open repo: with none
// open the trail has no repo step and the Commits link is hidden, the open-repo action it
// registers opens the folder picked on the commits page and the new-window action it registers
// calls Ziggy's newWindow.
//

import { act, cleanup, render, RenderResult, screen, waitFor } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import type { ITaskEvent, IZiggyBridge } from "ziggy";
import { AppLayout, commitExplorerAction, leftSidebarMinimisedStateKey, navigationFailureReporter, rightSidebarOpenStateKey } from "../../components/app-layout";
import { AppTheme, systemDarkQuery } from "../../components/app-theme";
import { RepoProvider } from "../../components/repo-context";
import { shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
import { makeFakeMediaQuery } from "../fake-media-query";
import { IFakeThemeZiggy, makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { installFakeZiggy } from "../fake-ziggy";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// The fake window.ziggy's calls that add and remove a task event listener, which a test reads to
// send a task's event to the listeners the layout added, as the backend does.
//
const onTaskEvent = jest.fn();
const removeTaskEventListener = jest.fn();

//
// The task event listeners the layout has added and not removed.
//
function taskEventListeners(): ((event: ITaskEvent<unknown>) => void)[] {
    const removed = removeTaskEventListener.mock.calls.map(call => call[0]);
    return onTaskEvent.mock.calls.map(call => call[0]).filter(listener => !removed.includes(listener));
}

//
// Sends every task event listener the event, as Ziggy does when a task sends one.
//
function sendTaskEvent(event: ITaskEvent<unknown>): void {
    act(() => {
        for (const listener of taskEventListeners()) {
            listener(event);
        }
    });
}

//
// The calls of window.ziggy a test may give the layout: AppTheme's, the action calls and the
// folder picker's invoke.
//
type LayoutZiggy = IFakeThemeZiggy & IFakeActionZiggy & Pick<IZiggyBridge, "invoke" | "newWindow">;

//
// Renders the layout with the repo open, or none for undefined, around mocks of the About page,
// the commits page and the Help page, because the layout shows the router's current page and its
// trail follows it. The layout is inside the open repo's context and the app's theme, as it is in
// the app, with no saved theme setting, a system theme that is light and an empty state file, and
// listens for task events on the fake window.ziggy. window.ziggy also keeps the action handlers the
// layout registers, which the test reaches through the fake it returns with the container, and
// answers the folder picker with the invoke given.
//
async function renderAppLayoutWithZiggy(repoPath: string | undefined, invoke: jest.Mock = jest.fn()): Promise<[HTMLElement, IFakeActionZiggy]> {
    const ziggy = makeFakeActionZiggy([]);
    const rendered = await renderFakedAppLayout({
        ...makeFakeThemeZiggy({
            systemTheme: "light",
        }),
        ...ziggy,
        invoke,
    }, repoPath);
    return [rendered.container, ziggy];
}

//
// Renders the layout as renderAppLayoutWithZiggy does and returns its container only.
//
async function renderAppLayout(repoPath: string | undefined): Promise<HTMLElement> {
    const [container] = await renderAppLayoutWithZiggy(repoPath);
    return container;
}

//
// Renders the layout as renderAppLayoutWithZiggy does, with the fake put on window.ziggy beside a
// fake of the action calls and the task event calls, so a test chooses what Graft's config and
// state files hold and which calls fail. A fake that has its own action calls replaces the default
// one. The repo the test names is open, or none for undefined. It returns the render, so a test
// can unmount the layout as Graft closing does.
//
async function renderFakedAppLayout(fake: Partial<LayoutZiggy>, repoPath: string | undefined): Promise<RenderResult> {
    const rootRoute = createRootRoute({
        component: AppLayout,
    });
    const pageRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/about",
        component: () => createElement("p", {
            "data-id": "mock-page",
        }, "The page"),
    });
    const helpRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/help",
        component: () => createElement("p", null, "The Help page"),
    });
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/commits",
        component: () => createElement("p", null, "The commits page"),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([pageRoute, helpRoute, commitsRoute]),
        history: createMemoryHistory({
            initialEntries: ["/about"],
        }),
    });
    onTaskEvent.mockClear();
    removeTaskEventListener.mockClear();
    installFakeZiggy({
        ...makeFakeActionZiggy([]),
        ...fake,
        onTaskEvent,
        removeTaskEventListener,
    });
    const rendered = render(createElement(AppTheme, {
        systemDark: makeFakeMediaQuery(systemDarkQuery, false),
        children: createElement(RepoProvider, {
            initialRepoPath: repoPath,
            children: createElement(RouterProvider, {
                router,
            }),
        }),
    }));
    await screen.findByText("The page");
    return rendered;
}

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("AppLayout", () => {
    test("puts the top bar above the left sidebar, the main content area and the right sidebar, in that order", async () => {
        const container = await renderAppLayout("/repos/graft");
        const layout = elementWithDataId(container, "app-layout");
        expect(layout?.children[0]).toBe(elementWithDataId(container, "top-bar"));
        const row = layout?.children[1];
        expect(row?.children[0]).toBe(elementWithDataId(container, "left-sidebar"));
        expect(row?.children[1]).toBe(elementWithDataId(container, "main-content"));
        expect(row?.children[2]).toBe(elementWithDataId(container, "right-sidebar"));
    });

    test("the Keyboard Shortcuts action shows the keyboard shortcuts overlay over the layout", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        expect(elementWithDataId(document.body, "shortcuts-overlay")).toBeUndefined();
        await act(async () => {
            await ziggy.runRegisteredAction(shortcutsOverlayAction);
        });
        expect(elementWithDataId(document.body, "shortcuts-overlay-search")).not.toBeUndefined();
        expect(elementWithDataId(container, "main-content")).not.toBeUndefined();
    });

    test("names the backend's Commit Explorer action", () => {
        expect(commitExplorerAction).toBe("open-commit-explorer");
    });

    test("the Commit Explorer action opens the commits page", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        expect(ziggy.hasRegisteredAction(commitExplorerAction)).toBe(true);
        await act(async () => {
            await ziggy.runRegisteredAction(commitExplorerAction);
        });
        expect(await screen.findByText("The commits page")).toBeTruthy();
    });

    test("the Commit Explorer action opens the commits page from another page", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-help-link")?.click();
        });
        await screen.findByText("The Help page");
        await act(async () => {
            await ziggy.runRegisteredAction(commitExplorerAction);
        });
        expect(await screen.findByText("The commits page")).toBeTruthy();
    });

    test("removes the Commit Explorer action's handler when the layout goes", async () => {
        const ziggy = makeFakeActionZiggy([]);
        const rendered = await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...ziggy,
        }, "/repos/graft");
        rendered.unmount();
        expect(ziggy.hasRegisteredAction(commitExplorerAction)).toBe(false);
    });

    test("shows the page in the main content area", async () => {
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "main-content")?.contains(elementWithDataId(container, "mock-page") ?? null)).toBe(true);
    });

    test("starts with the left sidebar expanded and the right sidebar closed", async () => {
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's menu button minimises the left sidebar and expands it again", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's right sidebar button slides the right sidebar in and out again", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-toggle")?.getAttribute("aria-label")).toBe("Close the right sidebar");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
    });

    test("saves each click of the sidebar buttons in Graft's state file", async () => {
        const fake = makeFakeThemeZiggy({
            systemTheme: "light",
        });
        const { container } = await renderFakedAppLayout(fake, "/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(fake.stateWrites).toEqual([
            [leftSidebarMinimisedStateKey, true],
            [rightSidebarOpenStateKey, true],
            [leftSidebarMinimisedStateKey, false],
        ]);
    });

    test("starts with the sidebars as they were left when Graft last closed", async () => {
        const firstRun = makeFakeThemeZiggy({
            systemTheme: "light",
        });
        const first = await renderFakedAppLayout(firstRun, "/repos/graft");
        act(() => {
            elementWithDataId(first.container, "left-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(first.container, "right-sidebar-toggle")?.click();
        });
        first.unmount();

        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: Object.fromEntries(firstRun.stateWrites),
        }), "/repos/graft");
        await waitFor(() => {
            expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        });
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        expect(elementWithDataId(container, "right-sidebar-toggle")?.getAttribute("aria-label")).toBe("Close the right sidebar");
    });

    test("starts with the left sidebar expanded and the right sidebar closed when the state file holds false", async () => {
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: {
                [leftSidebarMinimisedStateKey]: false,
                [rightSidebarOpenStateKey]: false,
            },
        }), "/repos/graft");
        await act(async () => {
            await Promise.resolve();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("treats a value in the state file other than true as off", async () => {
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: {
                [leftSidebarMinimisedStateKey]: "yes",
                [rightSidebarOpenStateKey]: 1,
            },
        }), "/repos/graft");
        await act(async () => {
            await Promise.resolve();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("reports a state file it cannot read and starts with the left sidebar expanded and the right sidebar closed", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            getStateError: new Error("the disk is gone"),
        }), "/repos/graft");
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(`Graft could not read whether the left sidebar is minimised from its state file at ${leftSidebarMinimisedStateKey}: Error: the disk is gone. Graft starts with the default until it is changed.`);
        });
        expect(consoleError).toHaveBeenCalledWith(`Graft could not read whether the right sidebar is open from its state file at ${rightSidebarOpenStateKey}: Error: the disk is gone. Graft starts with the default until it is changed.`);
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
        consoleError.mockRestore();
    });

    test("reports a sidebar it cannot save and still changes the sidebar", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            setStateError: new Error("the disk is full"),
        }), "/repos/graft");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(`Graft could not save whether the right sidebar is open in its state file at ${rightSidebarOpenStateKey}: Error: the disk is full. The sidebar stays as it is until Graft closes, and the next run starts as the file holds.`);
        });
        consoleError.mockRestore();
    });

    test("the top bar's theme menu changes the theme to the one chosen", async () => {
        const container = await renderAppLayout("/repos/graft");
        const themeButton = (): HTMLElement | undefined => elementWithDataId(container, "theme-button");

        //
        // Opens the theme menu, which draws outside the layout, and chooses the setting.
        //
        function chooseTheme(setting: string): void {
            act(() => {
                themeButton()?.click();
            });
            act(() => {
                document.querySelector<HTMLElement>(`[data-id="theme-option-${setting}"]`)?.click();
            });
        }

        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: System. Choose a theme");
        chooseTheme("dark");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: Dark. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        chooseTheme("light");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: Light. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        chooseTheme("system");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: System. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    test("the top bar's trail starts with the repo and names the page shown", async () => {
        const container = await renderAppLayout("/repos/graft");
        const trailArea = elementWithDataId(container, "top-bar-trail");
        expect(elementWithDataId(container, "top-bar")?.contains(trailArea ?? null)).toBe(true);
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("aria-label")).toBe("/repos/graft");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });

    test("picking another page in the trail's drop-down opens it and the trail follows", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "breadcrumb-page")?.click();
        });
        act(() => {
            document.querySelector<HTMLElement>("[data-id=\"breadcrumb-option-help\"]")?.click();
        });
        await screen.findByText("The Help page");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("Help");
    });
});

describe("AppLayout with no repo open", () => {
    test("hides the left sidebar's Commits link and starts the trail with the page", async () => {
        const container = await renderAppLayout(undefined);
        expect(elementWithDataId(container, "left-sidebar-commits-link")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-about-link")).not.toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });
});

describe("AppLayout's open-repo action", () => {
    test("opens the folder picked on the commits page, with the trail and Commits link following", async () => {
        const invoke = jest.fn().mockResolvedValue("/repos/picked");
        const [container, ziggy] = await renderAppLayoutWithZiggy(undefined, invoke);
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        expect(invoke).toHaveBeenCalledWith("pick-repo-folder", null);
        await screen.findByText("The commits page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("picked");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("aria-label")).toBe("/repos/picked");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("Commits");
        expect(elementWithDataId(container, "left-sidebar-commits-link")).not.toBeUndefined();
    });

    test("opens the folder picked in place of the repo open before", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft", jest.fn().mockResolvedValue("/repos/other"));
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        await screen.findByText("The commits page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("other");
    });

    test("opens nothing and stays on the page when the picker is cancelled", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy(undefined, jest.fn().mockResolvedValue(null));
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        expect(screen.getByText("The page").getAttribute("data-id")).toBe("mock-page");
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-commits-link")).toBeUndefined();
    });

    test("removes the action's handler when the layout goes", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy(undefined);
        expect(ziggy.hasRegisteredAction("open-repo")).toBe(true);
        cleanup();
        expect(ziggy.hasRegisteredAction("open-repo")).toBe(false);
    });
});

describe("AppLayout's new-window action", () => {
    test("calls Ziggy's newWindow with no arguments", async () => {
        const ziggy = makeFakeActionZiggy([]);
        const newWindow = jest.fn().mockResolvedValue(undefined);
        await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...ziggy,
            newWindow,
        }, undefined);
        await act(async () => {
            await ziggy.runRegisteredAction("new-window");
        });
        expect(newWindow).toHaveBeenCalledWith([]);
    });

    test("removes the action's handler when the layout goes", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy(undefined);
        expect(ziggy.hasRegisteredAction("new-window")).toBe(true);
        cleanup();
        expect(ziggy.hasRegisteredAction("new-window")).toBe(false);
    });
});

describe("AppLayout's Git commands", () => {
    //
    // Opens the right sidebar.
    //
    function openRightSidebar(container: HTMLElement): void {
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
    }

    //
    // Opens the page with its link in the left sidebar and waits for its text.
    //
    async function openPage(container: HTMLElement, page: string, text: string): Promise<void> {
        act(() => {
            elementWithDataId(container, `left-sidebar-${page}-link`)?.click();
        });
        await screen.findByText(text);
    }

    //
    // Sends the event the Git interface function sends for the command, from a task of the
    // commits page.
    //
    function sendCommitsPageCommand(command: string): void {
        sendTaskEvent({
            taskId: "t1",
            source: "commits-page",
            data: {
                type: "git-command",
                directoryCommand: "cd /repos/graft",
                command,
            },
        });
    }

    test("the right sidebar says the About page has run no Git commands", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();
    });

    test("the right sidebar shows the commits page's commands, kept while the sidebar is closed and while another page is open", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendCommitsPageCommand("git log --max-count=50");
        await openPage(container, "commits", "The commits page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-directory")?.textContent).toBe("cd /repos/graft");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50");

        openRightSidebar(container);
        sendCommitsPageCommand("git diff-tree abc");
        await openPage(container, "help", "The Help page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();

        await openPage(container, "commits", "The commits page");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree abc");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git log --max-count=50");
    });

    test("ignores a task event that is not a Git command", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendTaskEvent({
            taskId: "t1",
            source: "commits-page",
            data: {
                type: "output",
            },
        });
        await openPage(container, "commits", "The commits page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();
    });

    test("stops listening for task events when it is removed", async () => {
        await renderAppLayout("/repos/graft");
        expect(taskEventListeners().length).toBe(1);
        cleanup();
        expect(taskEventListeners().length).toBe(0);
    });
});

describe("navigationFailureReporter", () => {
    test("reports which page could not be opened and why", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        navigationFailureReporter("/help")(new Error("the route is missing"));
        expect(consoleError).toHaveBeenCalledWith("Graft could not open the page at /help: Error: the route is missing. The page stays as it was, so look at the router's routes for that path.");
        consoleError.mockRestore();
    });
});
