//
// Tests the app's layout: renders it as the root of a router with a stand-in page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the Keyboard Shortcuts action shows the keyboard shortcuts overlay over it, that
// the left sidebar starts expanded and the right sidebar closed, that the top
// bar's buttons minimise and expand the left sidebar and slide the right sidebar in and out and
// that the top bar's breadcrumb trail follows the page shown and its drop-down opens another page,
// and that the right sidebar shows the Git commands the page shown has run.
//

import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import type { ITaskEvent } from "ziggy";
import { AppLayout, navigationFailureReporter } from "../../components/app-layout";
import { AppTheme, systemDarkQuery } from "../../components/app-theme";
import { shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
import { makeFakeMediaQuery } from "../fake-media-query";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
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
// Renders the layout for the repo at /repos/graft around a stand-in for the About page, the
// commits page and the Help page, because the layout shows the router's current page and its trail
// follows it. The layout is inside the app's theme, as it is in the app, with no saved theme
// setting and a system theme that is light, and listens for task events on the fake window.ziggy.
// window.ziggy also keeps the action handlers the layout registers, which the test reaches through
// the fake it returns with the container.
//
async function renderAppLayoutWithZiggy(): Promise<[HTMLElement, IFakeActionZiggy]> {
    const rootRoute = createRootRoute({
        component: () => createElement(AppLayout, {
            repoPath: "/repos/graft",
        }),
    });
    const pageRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => createElement("p", {
            "data-id": "stand-in-page",
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
            initialEntries: ["/"],
        }),
    });
    onTaskEvent.mockClear();
    removeTaskEventListener.mockClear();
    const ziggy = installFakeZiggy({
        ...makeFakeThemeZiggy({
            systemTheme: "light",
        }),
        ...makeFakeActionZiggy(),
        onTaskEvent,
        removeTaskEventListener,
    });
    const { container } = render(createElement(AppTheme, {
        systemDark: makeFakeMediaQuery(systemDarkQuery, false),
        children: createElement(RouterProvider, {
            router,
        }),
    }));
    await screen.findByText("The page");
    return [container, ziggy];
}

//
// Renders the layout as renderAppLayoutWithZiggy does and returns its container only.
//
async function renderAppLayout(): Promise<HTMLElement> {
    const [container] = await renderAppLayoutWithZiggy();
    return container;
}

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("AppLayout", () => {
    test("puts the top bar above the left sidebar, the main content area and the right sidebar, in that order", async () => {
        const container = await renderAppLayout();
        const layout = elementWithDataId(container, "app-layout");
        expect(layout?.children[0]).toBe(elementWithDataId(container, "top-bar"));
        const row = layout?.children[1];
        expect(row?.children[0]).toBe(elementWithDataId(container, "left-sidebar"));
        expect(row?.children[1]).toBe(elementWithDataId(container, "main-content"));
        expect(row?.children[2]).toBe(elementWithDataId(container, "right-sidebar"));
    });

    test("the Keyboard Shortcuts action shows the keyboard shortcuts overlay over the layout", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy();
        expect(elementWithDataId(document.body, "shortcuts-overlay")).toBeUndefined();
        await act(async () => {
            await ziggy.runRegisteredAction(shortcutsOverlayAction);
        });
        expect(elementWithDataId(document.body, "shortcuts-overlay-placeholder")).not.toBeUndefined();
        expect(elementWithDataId(container, "main-content")).not.toBeUndefined();
    });

    test("shows the page in the main content area", async () => {
        const container = await renderAppLayout();
        expect(elementWithDataId(container, "main-content")?.contains(elementWithDataId(container, "stand-in-page") ?? null)).toBe(true);
    });

    test("starts with the left sidebar expanded and the right sidebar closed", async () => {
        const container = await renderAppLayout();
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's menu button minimises the left sidebar and expands it again", async () => {
        const container = await renderAppLayout();
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-60")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's right sidebar button slides the right sidebar in and out again", async () => {
        const container = await renderAppLayout();
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

    test("the top bar's theme menu changes the theme to the one chosen", async () => {
        const container = await renderAppLayout();
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
        const container = await renderAppLayout();
        const trailArea = elementWithDataId(container, "top-bar-trail");
        expect(elementWithDataId(container, "top-bar")?.contains(trailArea ?? null)).toBe(true);
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("title")).toBe("/repos/graft");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });

    test("picking another page in the trail's drop-down opens it and the trail follows", async () => {
        const container = await renderAppLayout();
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
        const container = await renderAppLayout();
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();
    });

    test("the right sidebar shows the commits page's commands, kept while the sidebar is closed and while another page is open", async () => {
        const container = await renderAppLayout();
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
        const container = await renderAppLayout();
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
        await renderAppLayout();
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
