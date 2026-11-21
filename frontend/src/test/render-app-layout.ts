//
// Renders the app's layout for the tests of the layout and of the feature hooks it calls: as the
// root of a router with mock pages, inside the open repo's context and the app's theme, with a
// fake window.ziggy the test reaches. It also sends task events to the listeners the layout added,
// as the backend does.
//

import { act, render, RenderResult, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import type { ITaskEvent, IZiggyBridge } from "ziggy";
import { AppLayout } from "../components/app-layout";
import { AppTheme, systemDarkQuery } from "../components/app-theme";
import { RepoProvider } from "../components/repo-context";
import { IFakeActionZiggy, makeFakeActionZiggy } from "./fake-action-ziggy";
import { makeFakeMediaQuery } from "./fake-media-query";
import { IFakeThemeZiggy, makeFakeThemeZiggy } from "./fake-theme-ziggy";
import { installFakeZiggy } from "./fake-ziggy";
import { RepoOpener } from "./repo-opener";

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
export function taskEventListeners(): ((event: ITaskEvent<unknown>) => void)[] {
    const removed = removeTaskEventListener.mock.calls.map(call => call[0]);
    return onTaskEvent.mock.calls.map(call => call[0]).filter(listener => !removed.includes(listener));
}

//
// Sends every task event listener the event, as Ziggy does when a task sends one.
//
export function sendTaskEvent(event: ITaskEvent<unknown>): void {
    act(() => {
        for (const listener of taskEventListeners()) {
            listener(event);
        }
    });
}

//
// The calls of window.ziggy a test may give the layout: AppTheme's, the action calls, the folder
// picker's invoke and runAction, which the top bar's keyboard shortcuts button calls.
//
export type LayoutZiggy = IFakeThemeZiggy & IFakeActionZiggy & Pick<IZiggyBridge, "invoke" | "newWindow" | "runAction">;

//
// Renders the layout with the repo open, or none for undefined, around mocks of the About page, the
// repo explorer page and the Help page, because the layout shows the router's current page and its
// trail follows it. The layout is inside the open repo's context and the app's theme, as it is in
// the app, with no saved theme setting, a system theme that is light and an empty state file, and
// listens for task events on the fake window.ziggy. window.ziggy also keeps the action handlers the
// layout registers, which the test reaches through the fake it returns with the container, and
// returns the folder picker's choice from the invoke given.
//
export async function renderAppLayoutWithZiggy(repoPath: string | undefined, invoke: jest.Mock = jest.fn()): Promise<[HTMLElement, IFakeActionZiggy]> {
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
export async function renderAppLayout(repoPath: string | undefined): Promise<HTMLElement> {
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
export async function renderFakedAppLayout(fake: Partial<LayoutZiggy>, repoPath: string | undefined): Promise<RenderResult> {
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
    const repoExplorerRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/repo-explorer",
        component: () => createElement("p", null, "The repo explorer page"),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([pageRoute, helpRoute, repoExplorerRoute]),
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
            children: [
                createElement(RepoOpener, {
                    key: "repo-opener",
                    repoPath,
                }),
                createElement(RouterProvider, {
                    key: "router",
                    router,
                }),
            ],
        }),
    }));
    await screen.findByText("The page");
    return rendered;
}

//
// The element with the data-id in the container.
//
export function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}
