//
// Tests the breadcrumb trail: renders it with plain and drop-down steps and checks the text,
// tooltip and style of each step, that the page step is the larger, bolder title, that long steps
// are cut short, that a drop-down lists and selects its pages, that its search box narrows them,
// says when none match and is cleared on closing and that picking a page opens it while picking
// the page shown only closes the drop-down. It also renders the repo explorer page's trail from
// pageTrail with a repo open and with none, and checks the repo step comes before the page only
// while a repo is open.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { BreadcrumbTrail } from "../../components/breadcrumb-trail";
import { ITrailStep, pageTrail } from "../../lib/breadcrumb-trail";

//
// A trail with a plain repo step with a long name and a drop-down step of two pages, the second
// one shown.
//
const trail: ITrailStep[] = [
    {
        label: "a-repo-with-a-long-name",
        tooltip: "/repos/a-repo-with-a-long-name",
        dataId: "breadcrumb-repo",
        options: [],
    },
    {
        label: "About",
        tooltip: "About",
        dataId: "breadcrumb-page",
        options: [
            {
                label: "Help",
                path: "/help",
                dataId: "breadcrumb-option-help",
                isSelected: false,
            },
            {
                label: "About",
                path: "/",
                dataId: "breadcrumb-option-about",
                isSelected: true,
            },
        ],
    },
];

//
// Renders the trail with the steps and a Jest mock for opening a page, then returns the mock.
//
function renderTrail(steps: ITrailStep[]): jest.Mock {
    const onNavigate = jest.fn();
    render(createElement(BreadcrumbTrail, {
        steps,
        onNavigate,
    }));
    return onNavigate;
}

//
// The element with the data-id anywhere in the document, because the drop-down is drawn outside
// the trail.
//
function elementWithDataId(dataId: string): HTMLElement | undefined {
    return document.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

//
// Opens the drop-down of the page step.
//
function openPageMenu(): void {
    act(() => {
        elementWithDataId("breadcrumb-page")?.click();
    });
}

describe("BreadcrumbTrail", () => {
    test("shows each step in order with a chevron between them", () => {
        renderTrail(trail);
        const trailElement = elementWithDataId("breadcrumb-trail");
        expect(trailElement?.textContent).toBe("a-repo-with-a-lon\u2026About");
        expect(trailElement?.querySelectorAll("svg[data-icon=\"chevron-right\"]").length).toBe(1);
    });

    test("shows a step with no options as plain text, cut short with its full text in its tooltip", () => {
        renderTrail(trail);
        const repoStep = elementWithDataId("breadcrumb-repo");
        expect(repoStep?.tagName).toBe("SPAN");
        expect(repoStep?.textContent).toBe("a-repo-with-a-lon\u2026");
        expect(repoStep?.getAttribute("aria-label")).toBe("/repos/a-repo-with-a-long-name");
        expect(repoStep?.classList.contains("text-[var(--color-text-muted)]")).toBe(true);
    });

    test("shows a last step that is not the page in the medium weight at the normal size", () => {
        renderTrail([trail[0]]);
        const repoStep = elementWithDataId("breadcrumb-repo");
        expect(repoStep?.classList.contains("font-[var(--weight-medium)]")).toBe(true);
        expect(repoStep?.classList.contains("text-[length:var(--text-md)]")).toBe(true);
        expect(repoStep?.classList.contains("font-[var(--weight-bold)]")).toBe(false);
        expect(repoStep?.classList.contains("text-[length:var(--text-lg)]")).toBe(false);
    });

    test("shows a step with options as a button with a drop-down arrow", () => {
        renderTrail(trail);
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.tagName).toBe("BUTTON");
        expect(pageStep?.textContent).toBe("About");
        expect(pageStep?.getAttribute("aria-label")).toBe("About");
        expect(pageStep?.querySelector("svg[data-icon=\"chevron-down\"]")).not.toBeNull();
    });

    test("shows the page step as the page's title, larger and bolder, as a drop-down", () => {
        renderTrail(trail);
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.classList.contains("text-[length:var(--text-lg)]")).toBe(true);
        expect(pageStep?.classList.contains("font-[var(--weight-bold)]")).toBe(true);
        expect(pageStep?.classList.contains("text-[var(--color-text)]")).toBe(true);
        expect(pageStep?.classList.contains("text-[length:var(--text-md)]")).toBe(false);
        expect(pageStep?.classList.contains("font-[var(--weight-medium)]")).toBe(false);
    });

    test("shows the page step as the page's title, larger and bolder, as plain text", () => {
        renderTrail([
            trail[0],
            {
                label: "Repo explorer",
                tooltip: "Repo explorer",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.tagName).toBe("SPAN");
        expect(pageStep?.classList.contains("text-[length:var(--text-lg)]")).toBe(true);
        expect(pageStep?.classList.contains("font-[var(--weight-bold)]")).toBe(true);
        expect(pageStep?.classList.contains("text-[var(--color-text)]")).toBe(true);
    });

    test("keeps the steps before the page at the normal size and weight", () => {
        renderTrail(trail);
        const repoStep = elementWithDataId("breadcrumb-repo");
        expect(repoStep?.classList.contains("text-[length:var(--text-md)]")).toBe(true);
        expect(repoStep?.classList.contains("text-[length:var(--text-lg)]")).toBe(false);
        expect(repoStep?.classList.contains("font-[var(--weight-bold)]")).toBe(false);
        expect(repoStep?.classList.contains("font-[var(--weight-medium)]")).toBe(false);
    });

    test("shows a drop-down step before the last one in the muted text colour at the normal size", () => {
        renderTrail([trail[1], trail[0]]);
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.classList.contains("font-[var(--weight-medium)]")).toBe(false);
        expect(pageStep?.classList.contains("font-[var(--weight-bold)]")).toBe(false);
        expect(pageStep?.classList.contains("text-[length:var(--text-md)]")).toBe(true);
        expect(pageStep?.classList.contains("text-[var(--color-text-muted)]")).toBe(true);
    });

    test("opens a drop-down that lists the step's pages and selects the one shown, with no tick", () => {
        renderTrail(trail);
        expect(elementWithDataId("breadcrumb-page-menu")).toBeUndefined();
        openPageMenu();
        expect(elementWithDataId("breadcrumb-page-menu")).not.toBeUndefined();
        expect(elementWithDataId("breadcrumb-option-help")?.textContent).toBe("Help");
        expect(elementWithDataId("breadcrumb-option-about")?.textContent).toBe("About");
        expect(elementWithDataId("breadcrumb-option-about")?.classList.contains("Mui-selected")).toBe(true);
        expect(elementWithDataId("breadcrumb-option-help")?.classList.contains("Mui-selected")).toBe(false);
        expect(elementWithDataId("breadcrumb-page-menu")?.querySelector("svg[data-icon=\"check\"]")).toBeNull();
        expect(screen.getByPlaceholderText("Search pages")).not.toBeNull();
    });

    test("gives the drop-down's search box a data-id made from the step's", () => {
        renderTrail(trail);
        openPageMenu();
        expect(elementWithDataId("breadcrumb-page-search")).toBe(screen.getByPlaceholderText("Search pages"));
    });

    test("picking another page opens it and closes the drop-down", async () => {
        const onNavigate = renderTrail(trail);
        openPageMenu();
        act(() => {
            elementWithDataId("breadcrumb-option-help")?.click();
        });
        expect(onNavigate).toHaveBeenCalledWith("/help");
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-option-help")).toBeUndefined();
        });
    });

    test("picking the page shown only closes the drop-down", async () => {
        const onNavigate = renderTrail(trail);
        openPageMenu();
        act(() => {
            elementWithDataId("breadcrumb-option-about")?.click();
        });
        expect(onNavigate).not.toHaveBeenCalled();
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-option-about")).toBeUndefined();
        });
    });

    test("the search box narrows the pages by name", () => {
        renderTrail(trail);
        openPageMenu();
        fireEvent.change(screen.getByPlaceholderText("Search pages"), {
            target: {
                value: "he",
            },
        });
        expect(elementWithDataId("breadcrumb-option-help")).not.toBeUndefined();
        expect(elementWithDataId("breadcrumb-option-about")).toBeUndefined();
        expect(elementWithDataId("breadcrumb-page-no-match")).toBeUndefined();
    });

    test("says when no page matches the search", () => {
        renderTrail(trail);
        openPageMenu();
        fireEvent.change(screen.getByPlaceholderText("Search pages"), {
            target: {
                value: "branches",
            },
        });
        expect(elementWithDataId("breadcrumb-page-no-match")?.textContent).toBe("No page matches \"branches\".");
        expect(elementWithDataId("breadcrumb-option-help")).toBeUndefined();
    });

    test("closing the drop-down clears the search, so it opens on every page again", async () => {
        renderTrail(trail);
        openPageMenu();
        fireEvent.change(screen.getByPlaceholderText("Search pages"), {
            target: {
                value: "branches",
            },
        });
        fireEvent.keyDown(screen.getByPlaceholderText("Search pages"), {
            key: "Escape",
        });
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-page-no-match")).toBeUndefined();
        });
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-page-menu")).toBeUndefined();
        });
        openPageMenu();
        expect(screen.getByPlaceholderText("Search pages")).toHaveProperty("value", "");
        expect(elementWithDataId("breadcrumb-option-help")).not.toBeUndefined();
    });
});

describe("BreadcrumbTrail with the trail of the repo explorer page", () => {
    test("with a repo open, shows the repo's name before Repo explorer, with its full path in the tooltip", () => {
        renderTrail(pageTrail("/repo-explorer", "/home/user/projects/graft"));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("graftRepo explorer");
        expect(elementWithDataId("breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId("breadcrumb-repo")?.getAttribute("aria-label")).toBe("/home/user/projects/graft");
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("Repo explorer");
    });

    test("with no repo open, shows Repo explorer alone, with no repo step", () => {
        renderTrail(pageTrail("/repo-explorer", undefined));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("Repo explorer");
        expect(elementWithDataId("breadcrumb-repo")).toBeUndefined();
    });
});
