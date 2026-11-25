//
// Tests the breadcrumb trail: renders it with plain and drop-down steps and checks the text,
// tooltip and style of each step, that the page step is the larger, bolder title, that long steps
// are cut short, that a drop-down lists and selects its pages, that its search box narrows them,
// says when none match and is cleared on closing and that picking a page opens it while picking
// the page shown only closes the drop-down. It also renders the repo explorer page's trail from
// pageTrail with a repo open and with none, and checks the repo step comes before the page only
// while a repo is open, and with its panes open, and checks a step follows the page for each.
// Last it lays the trail out at set widths, since jsdom lays nothing out, and checks the steps
// between the first and last collapse into one step only as far as they must, that the collapsed
// step's list shows them in order and closes on Escape, that only the trail with every middle step
// collapsed lets its steps shrink and that the trail measures itself again when the window
// changes size or its steps change.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { BreadcrumbTrail, collapsedStepsLabel } from "../../components/breadcrumb-trail";
import { explorerPaneSteps, ITrailStep, pageTrail } from "../../lib/breadcrumb-trail";
import { initialRepoExplorerState } from "../../lib/repo-explorer";

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
        renderTrail([
            {
                ...trail[1],
                dataId: "breadcrumb-other",
            },
            trail[0],
        ]);
        const otherStep = elementWithDataId("breadcrumb-other");
        expect(otherStep?.tagName).toBe("BUTTON");
        expect(otherStep?.classList.contains("font-[var(--weight-medium)]")).toBe(false);
        expect(otherStep?.classList.contains("font-[var(--weight-bold)]")).toBe(false);
        expect(otherStep?.classList.contains("text-[length:var(--text-md)]")).toBe(true);
        expect(otherStep?.classList.contains("text-[var(--color-text-muted)]")).toBe(true);
    });

    test("keeps the page step as the page's title when pane steps follow it", () => {
        renderTrail(pageTrail("/repo-explorer", "/repos/graft", explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commits",
        }, undefined)));
        const pageStep = elementWithDataId("breadcrumb-page");
        expect(pageStep?.classList.contains("text-[length:var(--text-lg)]")).toBe(true);
        expect(pageStep?.classList.contains("font-[var(--weight-bold)]")).toBe(true);
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
        renderTrail(pageTrail("/repo-explorer", "/home/user/projects/graft", []));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("graftRepo explorer");
        expect(elementWithDataId("breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId("breadcrumb-repo")?.getAttribute("aria-label")).toBe("/home/user/projects/graft");
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("Repo explorer");
    });

    test("with every pane open, shows a step per pane after Repo explorer, the commit's short hash and the file's name with their full text in the tooltip", () => {
        renderTrail(pageTrail("/repo-explorer", "/home/user/projects/graft", explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commits",
            openHash: "0123456789abcdef0123456789abcdef01234567",
            openPath: "src/a-file-with-a-long-name.ts",
        }, undefined)));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("graftRepo explorerCommits0123456a-file-with-a-lon…");
        expect(elementWithDataId("breadcrumb-pane-commit")?.getAttribute("aria-label")).toBe("0123456789abcdef0123456789abcdef01234567");
        expect(elementWithDataId("breadcrumb-pane-file")?.getAttribute("aria-label")).toBe("src/a-file-with-a-long-name.ts");
        expect(elementWithDataId("breadcrumb-pane-file")?.classList.contains("font-[var(--weight-medium)]")).toBe(true);
        expect(elementWithDataId("breadcrumb-pane-commits")?.classList.contains("text-[var(--color-text-muted)]")).toBe(true);
        expect(elementWithDataId("breadcrumb-pane-commit")?.classList.contains("text-[var(--color-text-muted)]")).toBe(true);
    });

    test("with the changes pane and a file open, shows Commit then the file's name after Repo explorer", () => {
        renderTrail(pageTrail("/repo-explorer", "/home/user/projects/graft", explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commit",
            openChange: "unstaged:notes.txt",
        }, "notes.txt")));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("graftRepo explorerCommitnotes.txt");
    });

    test("with no repo open, shows Repo explorer alone, with no repo step", () => {
        renderTrail(pageTrail("/repo-explorer", undefined, []));
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("Repo explorer");
        expect(elementWithDataId("breadcrumb-repo")).toBeUndefined();
    });
});

//
// The trail of the repo explorer page with every pane open, which the layout tests lay out at
// widths that need none, some or every middle step collapsed.
//
const fullTrail: ITrailStep[] = pageTrail("/repo-explorer", "/repos/graft", explorerPaneSteps({
    ...initialRepoExplorerState,
    openLink: "commits",
    openHash: "0123456789abcdef0123456789abcdef01234567",
    openPath: "src/notes.txt",
}, undefined));

//
// The room in pixels between two laid out steps, which the chevron takes.
//
const SEPARATOR_WIDTH_PX = 20;

//
// Makes the bounds of an element at left that is width pixels wide.
//
function boundsAt(left: number, width: number): DOMRect {
    return {
        x: left,
        y: 0,
        width,
        height: 24,
        top: 0,
        right: left + width,
        bottom: 24,
        left,
        toJSON: () => ({}),
    };
}

//
// The width a laid out element takes: ten pixels a character for a step and SEPARATOR_WIDTH_PX for
// a chevron, which has no text.
//
function laidOutWidth(element: Element): number {
    if (element.classList.contains("MuiBreadcrumbs-separator")) {
        return SEPARATOR_WIDTH_PX;
    }
    return 10 * (element.textContent ?? "").length;
}

//
// Lays the trail out as a browser would at the trail width: the trail is trailWidthPx wide and
// each step and chevron sits after the one before it. With the trail of fullTrail the steps are
// 50, 130, 70, 70 and 90 pixels wide, 490 pixels in full with the chevrons.
//
function layOutTrail(trailWidthPx: number): void {
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function laidOutBounds(this: HTMLElement): DOMRect {
        if (this.getAttribute("data-id") === "breadcrumb-trail") {
            return boundsAt(0, trailWidthPx);
        }
        if (this.classList.contains("MuiBreadcrumbs-li")) {
            let left = 0;
            let sibling = this.previousElementSibling;
            while (sibling) {
                left += laidOutWidth(sibling);
                sibling = sibling.previousElementSibling;
            }
            return boundsAt(left, laidOutWidth(this));
        }
        return boundsAt(0, 0);
    });
}

//
// The data-ids of the steps the trail shows, in order, the collapsed step among them.
//
function shownStepIds(): string[] {
    const shown = document.querySelectorAll("[data-id=\"breadcrumb-trail\"] .MuiBreadcrumbs-li > [data-id]");
    return Array.from(shown).map(step => step.getAttribute("data-id") ?? "");
}

describe("BreadcrumbTrail laid out in the room it has", () => {
    afterEach(() => {
        jest.restoreAllMocks();
    });

    test("shows every step, none allowed to shrink, when the trail fits", () => {
        layOutTrail(490);
        renderTrail(fullTrail);
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-page", "breadcrumb-pane-commits", "breadcrumb-pane-commit", "breadcrumb-pane-file"]);
        expect(elementWithDataId("breadcrumb-collapsed")).toBeUndefined();
        const steps = document.querySelectorAll(".MuiBreadcrumbs-li");
        expect(Array.from(steps).every(step => step.classList.contains("shrink-0"))).toBe(true);
        expect(elementWithDataId("breadcrumb-trail")?.querySelector("ol")?.classList.contains("flex-nowrap")).toBe(true);
    });

    test("collapses only the step after the first when that is enough", () => {
        layOutTrail(400);
        renderTrail(fullTrail);
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-collapsed", "breadcrumb-pane-commits", "breadcrumb-pane-commit", "breadcrumb-pane-file"]);
        expect(elementWithDataId("breadcrumb-collapsed")?.getAttribute("aria-label")).toBe("Show 1 hidden step");
        expect(elementWithDataId("breadcrumb-repo")?.parentElement?.classList.contains("shrink-0")).toBe(true);
    });

    test("collapses every step between the first and last when only that fits, and lets the steps left shrink", () => {
        layOutTrail(250);
        renderTrail(fullTrail);
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-collapsed", "breadcrumb-pane-file"]);
        expect(elementWithDataId("breadcrumb-collapsed")?.getAttribute("aria-label")).toBe("Show 3 hidden steps");
        expect(elementWithDataId("breadcrumb-repo")?.parentElement?.classList.contains("min-w-0")).toBe(true);
        expect(elementWithDataId("breadcrumb-pane-file")?.parentElement?.classList.contains("min-w-0")).toBe(true);
        expect(elementWithDataId("breadcrumb-pane-file")?.classList.contains("truncate")).toBe(true);
    });

    test("clicking the collapsed step lists the hidden steps in order with their full text, and Escape closes the list", async () => {
        layOutTrail(250);
        renderTrail(fullTrail);
        expect(elementWithDataId("breadcrumb-collapsed-menu")).toBeUndefined();
        act(() => {
            elementWithDataId("breadcrumb-collapsed")?.click();
        });
        const list = elementWithDataId("breadcrumb-collapsed-menu");
        const entries = Array.from(list?.querySelectorAll("li") ?? []);
        expect(entries.map(entry => entry.getAttribute("data-id"))).toEqual(["breadcrumb-page-collapsed", "breadcrumb-pane-commits-collapsed", "breadcrumb-pane-commit-collapsed"]);
        expect(entries.map(entry => entry.textContent)).toEqual(["Repo explorer", "Commits", "0123456"]);
        expect(elementWithDataId("breadcrumb-collapsed")?.getAttribute("aria-expanded")).toBe("true");
        fireEvent.keyDown(entries[0], {
            key: "Escape",
        });
        await waitFor(() => {
            expect(elementWithDataId("breadcrumb-collapsed-menu")).toBeUndefined();
        });
    });

    test("lists a step's full text, not its shortened text", () => {
        layOutTrail(250);
        renderTrail([
            fullTrail[0],
            {
                label: "a-step-with-a-long-name",
                tooltip: "a-step-with-a-long-name",
                dataId: "breadcrumb-long",
                options: [],
            },
            fullTrail[4],
        ]);
        act(() => {
            elementWithDataId("breadcrumb-collapsed")?.click();
        });
        expect(elementWithDataId("breadcrumb-long-collapsed")?.textContent).toBe("a-step-with-a-long-name");
    });

    test("widening the window brings the collapsed steps back", () => {
        layOutTrail(250);
        renderTrail(fullTrail);
        expect(elementWithDataId("breadcrumb-collapsed")).not.toBeUndefined();
        jest.restoreAllMocks();
        layOutTrail(490);
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });
        expect(elementWithDataId("breadcrumb-collapsed")).toBeUndefined();
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-page", "breadcrumb-pane-commits", "breadcrumb-pane-commit", "breadcrumb-pane-file"]);
    });

    test("narrowing the window collapses steps", () => {
        layOutTrail(490);
        renderTrail(fullTrail);
        expect(elementWithDataId("breadcrumb-collapsed")).toBeUndefined();
        jest.restoreAllMocks();
        layOutTrail(300);
        act(() => {
            window.dispatchEvent(new Event("resize"));
        });
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-collapsed", "breadcrumb-pane-commit", "breadcrumb-pane-file"]);
    });

    test("measures itself again when its steps change", () => {
        layOutTrail(250);
        const onNavigate = jest.fn();
        const { rerender } = render(createElement(BreadcrumbTrail, {
            steps: fullTrail,
            onNavigate,
        }));
        expect(elementWithDataId("breadcrumb-collapsed")).not.toBeUndefined();
        rerender(createElement(BreadcrumbTrail, {
            steps: fullTrail.slice(0, 2),
            onNavigate,
        }));
        expect(elementWithDataId("breadcrumb-collapsed")).toBeUndefined();
        expect(shownStepIds()).toEqual(["breadcrumb-repo", "breadcrumb-page"]);
    });

    test("stops measuring when the window changes size once it is gone", () => {
        layOutTrail(490);
        const { unmount } = render(createElement(BreadcrumbTrail, {
            steps: fullTrail,
            onNavigate: jest.fn(),
        }));
        const removeListener = jest.spyOn(window, "removeEventListener");
        unmount();
        expect(removeListener).toHaveBeenCalledWith("resize", expect.any(Function));
    });

    test("shows an empty trail for a page with no steps", () => {
        renderTrail([]);
        expect(elementWithDataId("breadcrumb-trail")?.textContent).toBe("");
    });
});

describe("collapsedStepsLabel", () => {
    test("names one hidden step in the singular", () => {
        expect(collapsedStepsLabel(1)).toBe("Show 1 hidden step");
    });

    test("names several hidden steps in the plural", () => {
        expect(collapsedStepsLabel(2)).toBe("Show 2 hidden steps");
    });
});
