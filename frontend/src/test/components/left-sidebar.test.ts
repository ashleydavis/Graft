//
// Tests the left sidebar: renders it expanded and minimised, with a repo open or none, in a router
// with an About page, a repo explorer page and a Help page and checks its width, which links it
// shows with which labels, where they go and which one is highlighted.
//

import { act, render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, Outlet, RouterProvider } from "@tanstack/react-router";
import { createElement, Fragment, JSX } from "react";
import { LeftSidebar } from "../../components/left-sidebar";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// Renders the left sidebar beside a mock of each of the pages its links open, starting at the
// About page, because its links need a router as the app's have.
//
async function renderLeftSidebar(isMinimised: boolean, isRepoOpen: boolean): Promise<HTMLElement> {
    function Root(): JSX.Element {
        return createElement(Fragment, null,
            createElement(LeftSidebar, {
                isMinimised,
                isRepoOpen,
            }),
            createElement(Outlet),
        );
    }
    const rootRoute = createRootRoute({
        component: Root,
    });
    const aboutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/about",
        component: () => createElement("p", null, "The About page"),
    });
    const repoExplorerRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/repo-explorer",
        component: () => createElement("p", null, "The repo explorer page"),
    });
    const helpRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/help",
        component: () => createElement("p", null, "The Help page"),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([aboutRoute, repoExplorerRoute, helpRoute]),
        history: createMemoryHistory({
            initialEntries: ["/about"],
        }),
    });
    const { container } = render(createElement(RouterProvider, {
        router,
    }));
    await screen.findByText("The About page");
    return container;
}

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("LeftSidebar", () => {
    test("is wide and shows each link's name while expanded", async () => {
        const container = await renderLeftSidebar(false, true);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.classList.contains("w-[260px]")).toBe(true);
        expect(sidebar?.classList.contains("w-16")).toBe(false);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")?.textContent).toBe("Repo explorer");
        expect(elementWithDataId(container, "left-sidebar-help-link-label")?.textContent).toBe("Help");
        expect(elementWithDataId(container, "left-sidebar-about-link-label")?.textContent).toBe("About");
    });

    test("narrows to a strip of icons with no names while minimised", async () => {
        const container = await renderLeftSidebar(true, true);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.classList.contains("w-16")).toBe(true);
        expect(sidebar?.classList.contains("w-[260px]")).toBe(false);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-about-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-help-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.querySelector("svg[data-icon=\"code-commit\"]")).not.toBeNull();
        expect(elementWithDataId(container, "left-sidebar-help-link")?.querySelector("svg[data-icon=\"circle-question\"]")).not.toBeNull();
        expect(elementWithDataId(container, "left-sidebar-about-link")?.querySelector("svg[data-icon=\"circle-info\"]")).not.toBeNull();
        expect(sidebar?.textContent).toBe("");
    });

    test("names each link in its label and tooltip, whether expanded or minimised", async () => {
        const container = await renderLeftSidebar(true, true);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.getAttribute("aria-label")).toBe("Repo explorer");
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.getAttribute("aria-label")).toBe("Repo explorer");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("aria-label")).toBe("About");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("aria-label")).toBe("About");
        expect(elementWithDataId(container, "left-sidebar-help-link")?.getAttribute("aria-label")).toBe("Help");
        expect(elementWithDataId(container, "left-sidebar-help-link")?.getAttribute("aria-label")).toBe("Help");
    });

    test("links to the repo explorer page, the Help page and the About page", async () => {
        const container = await renderLeftSidebar(false, true);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.getAttribute("href")).toBe("/repo-explorer");
        expect(elementWithDataId(container, "left-sidebar-help-link")?.getAttribute("href")).toBe("/help");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("href")).toBe("/about");
    });

    test("holds only the links to the pages Graft has", async () => {
        const container = await renderLeftSidebar(false, true);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.querySelectorAll("a").length).toBe(3);
        expect(sidebar?.querySelectorAll("button").length).toBe(0);
    });

    test("hides the link to the repo explorer page while no repo is open, expanded or minimised", async () => {
        const expanded = await renderLeftSidebar(false, false);
        expect(elementWithDataId(expanded, "left-sidebar-repo-explorer-link")).toBeUndefined();
        expect(elementWithDataId(expanded, "left-sidebar-help-link")).not.toBeUndefined();
        expect(elementWithDataId(expanded, "left-sidebar-about-link")).not.toBeUndefined();
        expect(elementWithDataId(expanded, "left-sidebar")?.querySelectorAll("a").length).toBe(2);
        expanded.remove();
        const minimised = await renderLeftSidebar(true, false);
        expect(elementWithDataId(minimised, "left-sidebar-repo-explorer-link")).toBeUndefined();
        expect(elementWithDataId(minimised, "left-sidebar")?.querySelectorAll("a").length).toBe(2);
    });

    test("puts the Help link above the About link, apart from the commits link", async () => {
        const container = await renderLeftSidebar(false, true);
        const helpLink = elementWithDataId(container, "left-sidebar-help-link");
        expect(helpLink?.parentElement).toBe(elementWithDataId(container, "left-sidebar-about-link")?.parentElement);
        expect(helpLink?.nextElementSibling).toBe(elementWithDataId(container, "left-sidebar-about-link"));
        expect(helpLink?.parentElement).not.toBe(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.parentElement);
    });

    test("highlights the link to the page being shown, and only that one", async () => {
        const container = await renderLeftSidebar(false, true);
        expect(elementWithDataId(container, "left-sidebar-about-link")?.classList.contains("bg-[var(--color-selected)]")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.classList.contains("bg-[var(--color-selected)]")).toBe(false);
        act(() => {
            elementWithDataId(container, "left-sidebar-repo-explorer-link")?.click();
        });
        await screen.findByText("The repo explorer page");
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")?.classList.contains("bg-[var(--color-selected)]")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-about-link")?.classList.contains("bg-[var(--color-selected)]")).toBe(false);
    });
});
