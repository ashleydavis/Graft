//
// Tests the About page: renders it in a router and checks it shows Graft's name, what Graft is,
// its icon (a Font Awesome icon inside a MaterialUI Avatar that carries the Tailwind class) and
// its link to the commits page.
//

import { render, screen } from "@testing-library/react";
import { createMemoryHistory, createRootRoute, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { createElement } from "react";
import { AboutPage } from "../../../pages/about";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// Shows the About page as the only page of a router, because its link to the commits page needs
// one, as the app's pages have.
//
async function renderAboutPage(): Promise<HTMLElement> {
    const rootRoute = createRootRoute();
    const aboutRoute = createRoute({
        getParentRoute: () => rootRoute,
        path: "/",
        component: AboutPage,
    });
    const router = createRouter({
        routeTree: rootRoute.addChildren([aboutRoute]),
        history: createMemoryHistory({
            initialEntries: ["/"],
        }),
    });
    const { container } = render(createElement(RouterProvider, {
        router,
    }));
    await screen.findByText("About Graft");
    return container;
}

describe("AboutPage", () => {
    test("shows the heading", async () => {
        await renderAboutPage();
        expect(screen.getByText("About Graft").getAttribute("data-id")).toBe("about-heading");
    });

    test("says what Graft is", async () => {
        await renderAboutPage();
        expect(screen.getByText(/Graft is a desktop Git client/).getAttribute("data-id")).toBe("about-description");
    });

    test("shows the Font Awesome icon in a MaterialUI Avatar styled with a Tailwind class", async () => {
        const container = await renderAboutPage();
        const avatar = container.querySelector("[data-id=\"about-icon\"]");
        expect(avatar).not.toBeNull();
        expect(avatar?.classList.contains("MuiAvatar-root")).toBe(true);
        expect(avatar?.classList.contains("bg-emerald-700")).toBe(true);
        expect(avatar?.querySelector("svg[data-icon=\"code-branch\"]")).not.toBeNull();
    });

    test("links to the commits page", async () => {
        await renderAboutPage();
        const link = screen.getByText("Commits");
        expect(link.getAttribute("data-id")).toBe("about-commits-link");
        expect(link.getAttribute("href")).toBe("/commits");
    });
});
