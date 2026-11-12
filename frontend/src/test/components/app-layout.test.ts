//
// Tests the app's layout: renders it as the root of a router with a mock page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the left sidebar starts expanded and the right sidebar closed, that the top
// bar's buttons minimise and expand the left sidebar and slide the right sidebar in and out and
// that the top bar's breadcrumb trail follows the page shown and its drop-down opens another page.
// It also checks the layout reads the open repo: with none open the trail has no repo step and the
// Commits link is hidden, and the open-repo action it registers opens the folder picked on the
// commits page.
//

import { act, cleanup, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import { AppLayout, navigationFailureReporter } from "../../components/app-layout";
import type { IActionHandler, IZiggyBridge } from "ziggy";
import { AppTheme, systemDarkQuery } from "../../components/app-theme";
import { RepoProvider } from "../../components/repo-context";
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
// The calls of window.ziggy the layout makes: AppTheme's and the open-repo action's.
//
type LayoutZiggy = IFakeThemeZiggy & Pick<IZiggyBridge, "registerAction" | "removeAction" | "invoke">;

//
// Puts a fake on window.ziggy for the layout, with no saved theme setting and a system theme that
// is light, and returns it.
//
function installLayoutZiggy(): LayoutZiggy {
    return installFakeZiggy({
        ...makeFakeThemeZiggy({
            systemTheme: "light",
        }),
        registerAction: jest.fn(),
        removeAction: jest.fn(),
        invoke: jest.fn(),
    });
}

//
// Renders the layout with the repo open, or none for undefined, around mock pages for the About
// page, the Help page and the commits page, because the layout shows the router's current page and
// its trail follows it. The layout is inside the open repo's context and the app's theme, as it is
// in the app, with the fake window.ziggy the test installed.
//
async function renderAppLayout(repoPath: string | undefined): Promise<HTMLElement> {
    const rootRoute = createRootRoute({
        component: AppLayout,
    });
    const pageRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
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
            initialEntries: ["/"],
        }),
    });
    const { container } = render(createElement(AppTheme, {
        systemDark: makeFakeMediaQuery(systemDarkQuery, false),
        children: createElement(RepoProvider, {
            initialRepoPath: repoPath,
            children: createElement(RouterProvider, {
                router,
            }),
        }),
    }));
    await screen.findByText("The page");
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
        installLayoutZiggy();
        const container = await renderAppLayout("/repos/graft");
        const layout = elementWithDataId(container, "app-layout");
        expect(layout?.children[0]).toBe(elementWithDataId(container, "top-bar"));
        const row = layout?.children[1];
        expect(row?.children[0]).toBe(elementWithDataId(container, "left-sidebar"));
        expect(row?.children[1]).toBe(elementWithDataId(container, "main-content"));
        expect(row?.children[2]).toBe(elementWithDataId(container, "right-sidebar"));
    });

    test("shows the page in the main content area", async () => {
        installLayoutZiggy();
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "main-content")?.contains(elementWithDataId(container, "mock-page") ?? null)).toBe(true);
    });

    test("starts with the left sidebar expanded and the right sidebar closed", async () => {
        installLayoutZiggy();
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's menu button minimises the left sidebar and expands it again", async () => {
        installLayoutZiggy();
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
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-60")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's right sidebar button slides the right sidebar in and out again", async () => {
        installLayoutZiggy();
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

    test("the top bar's theme menu changes the theme to the one chosen", async () => {
        installLayoutZiggy();
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
        installLayoutZiggy();
        const container = await renderAppLayout("/repos/graft");
        const trailArea = elementWithDataId(container, "top-bar-trail");
        expect(elementWithDataId(container, "top-bar")?.contains(trailArea ?? null)).toBe(true);
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("title")).toBe("/repos/graft");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });

    test("picking another page in the trail's drop-down opens it and the trail follows", async () => {
        installLayoutZiggy();
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
        installLayoutZiggy();
        const container = await renderAppLayout(undefined);
        expect(elementWithDataId(container, "left-sidebar-commits-link")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-about-link")).not.toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });
});

describe("AppLayout's open-repo action", () => {
    //
    // Returns the handler the layout registered for the open-repo action.
    //
    function registeredHandler(layoutZiggy: LayoutZiggy): IActionHandler {
        const registerAction = layoutZiggy.registerAction as jest.Mock;
        expect(registerAction).toHaveBeenCalledWith("open-repo", expect.any(Function));
        const calls = registerAction.mock.calls;
        return calls[calls.length - 1][1];
    }

    test("opens the folder picked on the commits page, with the trail and Commits link following", async () => {
        const layoutZiggy = installLayoutZiggy();
        const container = await renderAppLayout(undefined);
        (layoutZiggy.invoke as jest.Mock).mockResolvedValue("/repos/picked");
        await act(async () => {
            await registeredHandler(layoutZiggy)();
        });
        expect(layoutZiggy.invoke).toHaveBeenCalledWith("pick-repo-folder", null);
        await screen.findByText("The commits page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("picked");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("title")).toBe("/repos/picked");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("Commits");
        expect(elementWithDataId(container, "left-sidebar-commits-link")).not.toBeUndefined();
    });

    test("opens the folder picked in place of the repo open before", async () => {
        const layoutZiggy = installLayoutZiggy();
        const container = await renderAppLayout("/repos/graft");
        (layoutZiggy.invoke as jest.Mock).mockResolvedValue("/repos/other");
        await act(async () => {
            await registeredHandler(layoutZiggy)();
        });
        await screen.findByText("The commits page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("other");
    });

    test("opens nothing and stays on the page when the picker is cancelled", async () => {
        const layoutZiggy = installLayoutZiggy();
        const container = await renderAppLayout(undefined);
        (layoutZiggy.invoke as jest.Mock).mockResolvedValue(null);
        await act(async () => {
            await registeredHandler(layoutZiggy)();
        });
        expect(screen.getByText("The page").getAttribute("data-id")).toBe("mock-page");
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-commits-link")).toBeUndefined();
    });

    test("removes the action's handler when the layout goes", async () => {
        const layoutZiggy = installLayoutZiggy();
        await renderAppLayout(undefined);
        cleanup();
        expect(layoutZiggy.removeAction).toHaveBeenCalledWith("open-repo");
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
