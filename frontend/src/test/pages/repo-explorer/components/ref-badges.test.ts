//
// Tests a commit's ref badges: how each kind of ref is read and drawn, and the badge column, which
// shows no badges, all of them when they fit or the ones that fit and a "…" button whose drop-down
// lists every badge and closes on Escape or a click outside, without selecting the commit.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { RefBadge, refBadge, RefBadges } from "../../../../pages/repo-explorer/components/ref-badges";

//
// The hash of the commit whose badges are shown.
//
const hash = "1111111111111111111111111111111111111111";

//
// The refs of a first commit with a branch and several tags, more than the column has room for at
// the widths the tests give.
//
const manyRefs = ["HEAD -> main", "tag: v0.1", "tag: v0.2", "tag: v0.3", "tag: v0.4"];

//
// Returns the element with the data-id, searching the whole page because the drop-down draws
// outside the column, and fails the test when there is none.
//
function elementWithDataId(dataId: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
    expect(element).toBeInstanceOf(HTMLElement);
    //
    // Jest's expect does not narrow the type, and the check above has already failed the test when
    // the element is missing.
    //
    return element as HTMLElement;
}

//
// Returns whether the page has an element with the data-id, so a test can check the "…" or the
// drop-down is gone.
//
function hasElementWithDataId(dataId: string): boolean {
    return document.querySelector(`[data-id="${dataId}"]`) !== null;
}

//
// Gives every element the column's width and every badge the width, since jsdom lays nothing out.
//
function setWidths(columnWidthPx: number, badgeWidthPx: number): void {
    jest.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(columnWidthPx);
    const bounds: DOMRect = {
        x: 0,
        y: 0,
        width: badgeWidthPx,
        height: 24,
        top: 0,
        right: badgeWidthPx,
        bottom: 24,
        left: 0,
        toJSON: () => ({}),
    };
    jest.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockReturnValue(bounds);
}

//
// Renders the column for the refs inside a parent whose click and mouse-down handlers are the
// mocks, so a test can check what reaches the row.
//
function renderColumn(refs: string[], onRowClick: jest.Mock, onRowMouseDown: jest.Mock): HTMLElement {
    const { container } = render(createElement("div", {
        onClick: onRowClick,
        onMouseDown: onRowMouseDown,
    }, createElement(RefBadges, {
        hash,
        refs,
    })));
    return container;
}

//
// Returns the names on the badges the column shows, leaving out its hidden copy for measuring.
//
function shownNames(): string[] {
    const column = elementWithDataId(`commit-refs-${hash}`);
    const shown = Array.from(column.children).slice(1).filter(child => child.tagName === "SPAN");
    return shown.map(child => child.textContent ?? "");
}

afterEach(() => {
    jest.restoreAllMocks();
});

describe("RefBadges", () => {
    test("shows an empty column for a commit with no refs", () => {
        setWidths(160, 40);
        renderColumn([], jest.fn(), jest.fn());
        expect(shownNames()).toEqual([]);
        expect(hasElementWithDataId(`commit-refs-more-${hash}`)).toBe(false);
    });

    test("shows every badge and no \"…\" when they fit", () => {
        setWidths(160, 40);
        renderColumn(["HEAD -> main", "origin/main", "tag: v1.0"], jest.fn(), jest.fn());
        expect(shownNames()).toEqual(["main", "origin/main", "v1.0"]);
        expect(hasElementWithDataId(`commit-refs-more-${hash}`)).toBe(false);
    });

    test("shows the badges that fit and a \"…\" when there are too many", () => {
        setWidths(160, 58);
        renderColumn(manyRefs, jest.fn(), jest.fn());
        expect(shownNames()).toEqual(["main", "v0.1"]);
        const more = elementWithDataId(`commit-refs-more-${hash}`);
        expect(more.getAttribute("aria-label")).toBe("Show all 5 refs");
        expect(more.getAttribute("aria-expanded")).toBe("false");
        expect(more.querySelector("svg")?.getAttribute("data-icon")).toBe("ellipsis");
    });

    test("shows in the \"…\"'s tooltip how many badges are left out", async () => {
        setWidths(160, 58);
        renderColumn(manyRefs, jest.fn(), jest.fn());
        fireEvent.mouseOver(elementWithDataId(`commit-refs-more-${hash}`));
        expect(await screen.findByText("3 more")).toBeTruthy();
    });

    test("opens a drop-down of every badge on a click on the \"…\", without selecting the commit", async () => {
        setWidths(160, 58);
        const onRowClick = jest.fn();
        const onRowMouseDown = jest.fn();
        renderColumn(manyRefs, onRowClick, onRowMouseDown);
        const more = elementWithDataId(`commit-refs-more-${hash}`);
        //
        // The mouse-down starts the button's ripple, which updates after a promise, so the test
        // waits for it inside act.
        //
        await act(async () => {
            fireEvent.mouseDown(more);
        });
        fireEvent.click(more);
        const dialog = screen.getByRole("dialog", {
            name: "Refs",
        });
        expect(Array.from(dialog.querySelectorAll(".MuiChip-root")).map(chip => chip.textContent)).toEqual(["main", "v0.1", "v0.2", "v0.3", "v0.4"]);
        expect(more.getAttribute("aria-expanded")).toBe("true");
        fireEvent.click(dialog);
        expect(onRowClick).not.toHaveBeenCalled();
        expect(onRowMouseDown).not.toHaveBeenCalled();
    });

    test("closes the drop-down on Escape", async () => {
        setWidths(160, 58);
        renderColumn(manyRefs, jest.fn(), jest.fn());
        fireEvent.click(elementWithDataId(`commit-refs-more-${hash}`));
        fireEvent.keyDown(screen.getByRole("dialog"), {
            key: "Escape",
        });
        await waitFor(() => expect(hasElementWithDataId(`commit-refs-menu-${hash}`)).toBe(false));
    });

    test("closes the drop-down on a click outside it", async () => {
        setWidths(160, 58);
        renderColumn(manyRefs, jest.fn(), jest.fn());
        fireEvent.click(elementWithDataId(`commit-refs-more-${hash}`));
        fireEvent.click(elementWithDataId(`commit-refs-backdrop-${hash}`));
        await waitFor(() => expect(hasElementWithDataId(`commit-refs-menu-${hash}`)).toBe(false));
    });

    test("shows the first badge, cut short, when it alone is wider than the column", () => {
        setWidths(160, 300);
        renderColumn(["tag: a-very-long-tag-name", "tag: v1"], jest.fn(), jest.fn());
        expect(shownNames()).toEqual(["a-very-long-tag-name"]);
        expect(hasElementWithDataId(`commit-refs-more-${hash}`)).toBe(true);
    });
});

describe("refBadge", () => {
    test("reads HEAD's branch as the checked-out branch, by its name alone", () => {
        expect(refBadge("HEAD -> main")).toEqual({
            kind: "current",
            name: "main",
        });
    });

    test("reads a tag without its tag prefix", () => {
        expect(refBadge("tag: v1.0")).toEqual({
            kind: "tag",
            name: "v1.0",
        });
    });

    test("reads a name under origin as a remote branch", () => {
        expect(refBadge("origin/main")).toEqual({
            kind: "remote",
            name: "origin/main",
        });
    });

    test("reads any other name, a detached HEAD included, as a local branch", () => {
        expect(refBadge("feature")).toEqual({
            kind: "branch",
            name: "feature",
        });
        expect(refBadge("HEAD")).toEqual({
            kind: "branch",
            name: "HEAD",
        });
    });
});

describe("RefBadge", () => {
    test("draws the checked-out branch on the current variant with the branch icon", () => {
        const { container } = render(createElement(RefBadge, {
            gitRef: "HEAD -> main",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("main");
        expect(chip?.className).toContain("MuiChip-current");
        expect(chip?.querySelector("svg")?.getAttribute("data-icon")).toBe("code-branch");
    });

    test("draws a tag on the tag variant with the tag icon", () => {
        const { container } = render(createElement(RefBadge, {
            gitRef: "tag: v1.0",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("v1.0");
        expect(chip?.className).toContain("MuiChip-tag");
        expect(chip?.querySelector("svg")?.getAttribute("data-icon")).toBe("tag");
    });

    test("draws a remote branch on the remote variant with the cloud icon", () => {
        const { container } = render(createElement(RefBadge, {
            gitRef: "origin/main",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("origin/main");
        expect(chip?.className).toContain("MuiChip-remote");
        expect(chip?.querySelector("svg")?.getAttribute("data-icon")).toBe("cloud");
    });

    test("draws any other branch on the branch variant with the branch icon", () => {
        const { container } = render(createElement(RefBadge, {
            gitRef: "feature",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("feature");
        expect(chip?.className).toContain("MuiChip-branch");
        expect(chip?.querySelector("svg")?.getAttribute("data-icon")).toBe("code-branch");
    });
});
