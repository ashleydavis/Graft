//
// Tests the left sidebar: renders it expanded and minimised in a router with an About page and a
// commits page and checks its width, which links it shows with which labels, where they go and
// which one is highlighted.
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
// Renders the left sidebar beside a stand-in for each of the pages its links open, starting at the
// About page, because its links need a router as the app's have.
//
async function renderLeftSidebar(isMinimised: boolean): Promise<HTMLElement> {
    function Root(): JSX.Element {
        return createElement(Fragment, null,
            createElement(LeftSidebar, {
                isMinimised,
            }),
            createElement(Outlet),
        );
    }
    const rootRoute = createRootRoute({
        component: Root,
    });
    const aboutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: () => createElement("p", null, "The About page"),
    });
    const commitsRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/commits",
        component: () => createElement("p", null, "The commits page"),
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([aboutRoute, commitsRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
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
        const container = await renderLeftSidebar(false);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.classList.contains("w-60")).toBe(true);
        expect(sidebar?.classList.contains("w-16")).toBe(false);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")?.textContent).toBe("Commits");
        expect(elementWithDataId(container, "left-sidebar-about-link-label")?.textContent).toBe("About");
    });

    test("narrows to a strip of icons with no names while minimised", async () => {
        const container = await renderLeftSidebar(true);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.classList.contains("w-16")).toBe(true);
        expect(sidebar?.classList.contains("w-60")).toBe(false);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-about-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.querySelector("svg[data-icon=\"code-commit\"]")).not.toBeNull();
        expect(elementWithDataId(container, "left-sidebar-about-link")?.querySelector("svg[data-icon=\"circle-info\"]")).not.toBeNull();
        expect(sidebar?.textContent).toBe("");
    });

    test("names each link in its label and tooltip, whether expanded or minimised", async () => {
        const container = await renderLeftSidebar(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.getAttribute("aria-label")).toBe("Commits");
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.getAttribute("title")).toBe("Commits");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("aria-label")).toBe("About");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("title")).toBe("About");
    });

    test("links to the commits page and the About page", async () => {
        const container = await renderLeftSidebar(false);
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.getAttribute("href")).toBe("/commits");
        expect(elementWithDataId(container, "left-sidebar-about-link")?.getAttribute("href")).toBe("/");
    });

    test("holds only the links to the pages Graft has", async () => {
        const container = await renderLeftSidebar(false);
        const sidebar = elementWithDataId(container, "left-sidebar");
        expect(sidebar?.querySelectorAll("a").length).toBe(2);
        expect(sidebar?.querySelectorAll("button").length).toBe(0);
    });

    test("highlights the link to the page being shown, and only that one", async () => {
        const container = await renderLeftSidebar(false);
        expect(elementWithDataId(container, "left-sidebar-about-link")?.classList.contains("bg-gray-200")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.classList.contains("bg-gray-200")).toBe(false);
        act(() => {
            elementWithDataId(container, "left-sidebar-commits-link")?.click();
        });
        await screen.findByText("The commits page");
        expect(elementWithDataId(container, "left-sidebar-commits-link")?.classList.contains("bg-gray-200")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-about-link")?.classList.contains("bg-gray-200")).toBe(false);
    });
});
