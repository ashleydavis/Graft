//
// Tests the collapse button and the collapsed strip: renders each and checks that the button has
// its data-id, a chevron pointing left, a tooltip that shows it collapses the pane to the left and
// names C and reports a click, and that the strip carries the pane's name, its title down it, a
// restore button with a chevron pointing right and a tooltip naming C, which reports a click, and
// the active pane's border only while the pane is active.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { activePaneClasses, inactivePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { CollapseButton, CollapsedStrip } from "../../../../pages/repo-explorer/components/collapse";

//
// Finds the element with the data-id, failing the test when it is not drawn.
//
function elementWithDataId(dataId: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as HTMLElement;
}

//
// Hovers the element and waits for its MaterialUI tooltip, then returns the tooltip's text.
//
async function tooltipText(element: HTMLElement): Promise<string | null> {
    act(() => {
        fireEvent.mouseOver(element);
    });
    return (await screen.findByRole("tooltip")).textContent;
}

//
// Renders the strip of the commit pane, active or not, with the restore callback.
//
function renderStrip(isActive: boolean, onRestore: jest.Mock): void {
    render(createElement(CollapsedStrip, {
        paneLabel: "Commits",
        title: "Commits",
        paneDataId: "commit-pane",
        isActive,
        onRestore,
    }));
}

describe("CollapseButton", () => {
    test("has its data-id and a chevron pointing left and reports a click", () => {
        const onCollapse = jest.fn();
        render(createElement(CollapseButton, {
            dataId: "commit-pane-collapse",
            onCollapse,
        }));
        const button = screen.getByLabelText("Collapse the pane");
        expect(button.getAttribute("data-id")).toBe("commit-pane-collapse");
        expect(button.querySelector("svg")?.getAttribute("data-icon")).toBe("chevron-left");
        fireEvent.click(button);
        expect(onCollapse).toHaveBeenCalledTimes(1);
    });

    test("has a tooltip that shows it collapses the pane to the left and names the key C", async () => {
        render(createElement(CollapseButton, {
            dataId: "commit-pane-collapse",
            onCollapse: jest.fn(),
        }));
        expect(await tooltipText(screen.getByLabelText("Collapse the pane"))).toBe("Collapse the pane to the leftKey: C");
    });
});

describe("CollapsedStrip", () => {
    test("carries the pane's name and shows its title down the strip", () => {
        renderStrip(false, jest.fn());
        const strip = elementWithDataId("commit-pane-strip");
        expect(strip.getAttribute("aria-label")).toBe("Commits");
        expect(strip.className).toContain("flex-none");
        const title = elementWithDataId("commit-pane-strip-title");
        expect(title.textContent).toBe("Commits");
        expect(title.className).toContain("[writing-mode:vertical-rl]");
        expect(title.className).toContain("truncate");
    });

    test("has a restore button at its top with a chevron pointing right, which reports a click", () => {
        const onRestore = jest.fn();
        renderStrip(false, onRestore);
        const restore = elementWithDataId("commit-pane-restore");
        expect(restore.getAttribute("aria-label")).toBe("Restore commits");
        expect(restore.querySelector("svg")?.getAttribute("data-icon")).toBe("chevron-right");
        expect(elementWithDataId("commit-pane-strip").firstElementChild).toBe(restore);
        fireEvent.click(restore);
        expect(onRestore).toHaveBeenCalledTimes(1);
    });

    test("has a restore button whose tooltip names the key C", async () => {
        renderStrip(false, jest.fn());
        expect(await tooltipText(elementWithDataId("commit-pane-restore"))).toBe("Restore the paneKey: C");
    });

    test("has the active pane's border only while the pane is active", () => {
        renderStrip(true, jest.fn());
        expect(elementWithDataId("commit-pane-strip").className).toContain(activePaneClasses);
    });

    test("has the border of a pane that is not active while the pane is not active", () => {
        renderStrip(false, jest.fn());
        const className = elementWithDataId("commit-pane-strip").className;
        expect(className).toContain(inactivePaneClasses);
        expect(className).not.toContain(activePaneClasses);
    });
});
