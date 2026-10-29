//
// Tests the breadcrumb trail: renders it with plain and drop-down steps and checks the text and
// tooltip of each step, that long steps are cut short, that a drop-down lists and ticks its pages,
// that its search box narrows them, says when none match and is cleared on closing and that picking
// a page opens it while picking the page shown only closes the drop-down.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { BreadcrumbTrail } from "../../components/breadcrumb-trail";
import { ITrailStep } from "../../lib/breadcrumb-trail";

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
        expect(repoStep?.getAttribute("title")).toBe("/repos/a-repo-with-a-long-name");
        expect(repoStep?.classList.contains("text-gray-600")).toBe(true);
    });

    test("shows the last step in bold, whether plain text or a drop-down", () => {
        renderTrail([trail[0]]);
        expect(elementWithDataId("breadcrumb-repo")?.classList.contains("font-bold")).toBe(true);
    });

    test("shows a step with options as a button with a drop-down arrow, in bold when it is last", () => {
        renderTrail(trail);
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.tagName).toBe("BUTTON");
        expect(pageStep?.textContent).toBe("About");
        expect(pageStep?.getAttribute("title")).toBe("About");
        expect(pageStep?.querySelector("svg[data-icon=\"caret-down\"]")).not.toBeNull();
        expect(pageStep?.classList.contains("font-bold")).toBe(true);
    });

    test("shows a drop-down step before the last one in grey", () => {
        renderTrail([trail[1], trail[0]]);
        expect(elementWithDataId("breadcrumb-page")?.classList.contains("font-bold")).toBe(false);
        expect(elementWithDataId("breadcrumb-page")?.classList.contains("text-gray-600")).toBe(true);
    });

    test("opens a drop-down that lists the step's pages and ticks the one shown", () => {
        renderTrail(trail);
        expect(elementWithDataId("breadcrumb-page-menu")).toBeUndefined();
        openPageMenu();
        expect(elementWithDataId("breadcrumb-page-menu")).not.toBeUndefined();
        expect(elementWithDataId("breadcrumb-option-help")?.textContent).toBe("Help");
        expect(elementWithDataId("breadcrumb-option-about")?.textContent).toBe("About");
        expect(elementWithDataId("breadcrumb-option-about")?.querySelector("svg[data-icon=\"check\"]")).not.toBeNull();
        expect(elementWithDataId("breadcrumb-option-help")?.querySelector("svg[data-icon=\"check\"]")).toBeNull();
        expect(screen.getByPlaceholderText("Search")).not.toBeNull();
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
        fireEvent.change(screen.getByPlaceholderText("Search"), {
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
        fireEvent.change(screen.getByPlaceholderText("Search"), {
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
        fireEvent.change(screen.getByPlaceholderText("Search"), {
            target: {
                value: "branches",
            },
        });
        fireEvent.keyDown(screen.getByPlaceholderText("Search"), {
            key: "Escape",
        });
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-page-no-match")).toBeUndefined();
        });
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-page-menu")).toBeUndefined();
        });
        openPageMenu();
        expect(screen.getByPlaceholderText("Search")).toHaveProperty("value", "");
        expect(elementWithDataId("breadcrumb-option-help")).not.toBeUndefined();
    });
});
