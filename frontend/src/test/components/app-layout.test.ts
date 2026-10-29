//
// Tests the app's layout: renders it as the root of a router with a stand-in page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the left sidebar starts expanded and the right sidebar closed, that the top
// bar's buttons minimise and expand the left sidebar and slide the right sidebar in and out and
// that the top bar's breadcrumb trail follows the page shown and its drop-down opens another page.
//

import { act, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import { AppLayout, navigationFailureReporter } from "../../components/app-layout";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// Renders the layout for the repo at /repos/graft around a stand-in for the About page and the
// Help page, because the layout shows the router's current page and its trail follows it.
//
async function renderAppLayout(): Promise<HTMLElement> {
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
    const router = createRouter({
        routeTree: rootRoute.addChildren([pageRoute, helpRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
    const { container } = render(createElement(RouterProvider, {
        router,
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
        const container = await renderAppLayout();
        const layout = elementWithDataId(container, "app-layout");
        expect(layout?.children[0]).toBe(elementWithDataId(container, "top-bar"));
        const row = layout?.children[1];
        expect(row?.children[0]).toBe(elementWithDataId(container, "left-sidebar"));
        expect(row?.children[1]).toBe(elementWithDataId(container, "main-content"));
        expect(row?.children[2]).toBe(elementWithDataId(container, "right-sidebar"));
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

describe("navigationFailureReporter", () => {
    test("reports which page could not be opened and why", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        navigationFailureReporter("/help")(new Error("the route is missing"));
        expect(consoleError).toHaveBeenCalledWith("Graft could not open the page at /help: Error: the route is missing. The page stays as it was, so look at the router's routes for that path.");
        consoleError.mockRestore();
    });
});
