//
// Tests the resize handle: renders it in a column beside a pane whose width the test sets, and
// checks it is a vertical separator with the pane's limits and a column resize pointer, that a drag
// moves the pane's right edge with the pointer, that Left and Right make the pane a step narrower
// or wider, that a double-click resets the pane, that each stops at the pane's limits and that its
// tooltip names the pane and how to use the handle.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { PANE_LIMITS } from "../../../../lib/pane-widths";
import { ResizeHandle, resizedPaneWidth } from "../../../../pages/repo-explorer/components/resize-handle";
import { boxOfWidth } from "../../../fake-box";

//
// jsdom has no pointer capture, which the handle takes during a drag, so the tests put Jest mocks
// on every element that record which pointer was captured and released.
//
const setPointerCapture = jest.fn();
const releasePointerCapture = jest.fn();
Element.prototype.setPointerCapture = setPointerCapture;
Element.prototype.releasePointerCapture = releasePointerCapture;

//
// A pointer event as the browser sends it: a mouse event with the pointer's id. jsdom has no
// PointerEvent, so fireEvent would send a plain event with no pointer id or position, and the tests
// put this one on the window for fireEvent to make pointer events with.
//
class FakePointerEvent extends MouseEvent {
    //
    // The id of the pointer that sent the event, which the handle captures during a drag.
    //
    readonly pointerId: number;

    constructor(type: string, init: PointerEventInit) {
        super(type, init);
        this.pointerId = init.pointerId ?? 0;
    }
}
Object.defineProperty(window, "PointerEvent", {
    value: FakePointerEvent,
    configurable: true,
    writable: true,
});

//
// What a rendered handle reports, and the handle itself.
//
interface IRenderedHandle {
    // The handle's element.
    handle: HTMLElement;

    // The mock called with each new width.
    onWidth: jest.Mock;

    // The mock called on a double-click.
    onReset: jest.Mock;
}

//
// Renders the handle for the commit pane in a column whose width on screen is the width given,
// because jsdom lays out no page and the handle reads the pane's width from its column.
//
function renderHandle(columnWidth: number): IRenderedHandle {
    const onWidth = jest.fn();
    const onReset = jest.fn();
    render(createElement("div", {
        children: createElement(ResizeHandle, {
            label: "commit pane",
            dataId: "commit-pane-resize-handle",
            limits: PANE_LIMITS.commits,
            onWidth,
            onReset,
        }),
    }));
    const handle = screen.getByRole("separator");
    const column = handle.parentElement;
    expect(column).toBeInstanceOf(HTMLElement);
    if (column instanceof HTMLElement) {
        jest.spyOn(column, "getBoundingClientRect").mockReturnValue(boxOfWidth(columnWidth));
    }
    return {
        handle,
        onWidth,
        onReset,
    };
}

beforeEach(() => {
    setPointerCapture.mockClear();
    releasePointerCapture.mockClear();
});

afterEach(() => {
    jest.restoreAllMocks();
});

describe("ResizeHandle", () => {
    test("is a focusable vertical separator named for its pane, with the pane's limits", () => {
        const { handle } = renderHandle(850);
        expect(handle.getAttribute("data-id")).toBe("commit-pane-resize-handle");
        expect(handle.getAttribute("aria-orientation")).toBe("vertical");
        expect(handle.getAttribute("aria-label")).toBe("Resize the commit pane");
        expect(handle.getAttribute("aria-valuemin")).toBe("320");
        expect(handle.getAttribute("aria-valuemax")).toBe("1000");
        expect(handle.tabIndex).toBe(0);
    });

    test("is a strip as wide as the gap, placed in it, with the column resize pointer and a line that shows in the accent colour", () => {
        const { handle } = renderHandle(850);
        expect(handle.className).toContain("w-[var(--space-3)]");
        expect(handle.className).toContain("absolute");
        expect(handle.className).toContain("left-full");
        expect(handle.className).toContain("cursor-col-resize");
        const line = handle.firstElementChild;
        expect(line).not.toBeNull();
        expect(line?.getAttribute("aria-hidden")).toBe("true");
        expect(line?.className).toContain("w-[2px]");
        expect(line?.className).toContain("group-hover:bg-[var(--color-select-pane)]");
        expect(line?.className).toContain("group-focus-visible:bg-[var(--color-select-pane)]");
        expect(line?.className).toContain("group-active:bg-[var(--color-select-pane)]");
    });

    test("a drag moves the pane's right edge with the pointer, holding the pointer until it is let go", () => {
        const { handle, onWidth } = renderHandle(850);
        fireEvent.pointerDown(handle, {
            pointerId: 7,
            clientX: 900,
        });
        expect(setPointerCapture).toHaveBeenCalledWith(7);
        fireEvent.pointerMove(handle, {
            pointerId: 7,
            clientX: 950,
        });
        fireEvent.pointerMove(handle, {
            pointerId: 7,
            clientX: 700,
        });
        expect(onWidth.mock.calls).toEqual([[900], [650]]);
        fireEvent.pointerUp(handle, {
            pointerId: 7,
            clientX: 700,
        });
        expect(releasePointerCapture).toHaveBeenCalledWith(7);
        fireEvent.pointerMove(handle, {
            pointerId: 7,
            clientX: 800,
        });
        expect(onWidth).toHaveBeenCalledTimes(2);
    });

    test("a drag stops at the pane's limits", () => {
        const { handle, onWidth } = renderHandle(850);
        fireEvent.pointerDown(handle, {
            pointerId: 1,
            clientX: 900,
        });
        fireEvent.pointerMove(handle, {
            pointerId: 1,
            clientX: 0,
        });
        fireEvent.pointerMove(handle, {
            pointerId: 1,
            clientX: 3000,
        });
        expect(onWidth.mock.calls).toEqual([[320], [1000]]);
    });

    test("a pointer moving over the handle without a drag changes no width", () => {
        const { handle, onWidth } = renderHandle(850);
        fireEvent.pointerMove(handle, {
            pointerId: 1,
            clientX: 950,
        });
        expect(onWidth).not.toHaveBeenCalled();
    });

    test("Left and Right make the pane 16 pixels narrower or wider and keep the key from scrolling the page", () => {
        const { handle, onWidth } = renderHandle(850);
        expect(fireEvent.keyDown(handle, {
            key: "ArrowRight",
        })).toBe(false);
        expect(fireEvent.keyDown(handle, {
            key: "ArrowLeft",
        })).toBe(false);
        expect(onWidth.mock.calls).toEqual([[866], [834]]);
    });

    test("Left and Right stop at the pane's limits", () => {
        const narrow = renderHandle(320);
        fireEvent.keyDown(narrow.handle, {
            key: "ArrowLeft",
        });
        expect(narrow.onWidth).toHaveBeenCalledWith(320);
    });

    test("leaves any other key alone", () => {
        const { handle, onWidth } = renderHandle(850);
        expect(fireEvent.keyDown(handle, {
            key: "ArrowUp",
        })).toBe(true);
        expect(fireEvent.keyDown(handle, {
            key: "Enter",
        })).toBe(true);
        expect(onWidth).not.toHaveBeenCalled();
    });

    test("a double-click resets the pane", () => {
        const { handle, onReset, onWidth } = renderHandle(850);
        fireEvent.doubleClick(handle);
        expect(onReset).toHaveBeenCalledTimes(1);
        expect(onWidth).not.toHaveBeenCalled();
    });

    test("its tooltip names the pane and says how to use the handle", async () => {
        const { handle } = renderHandle(850);
        fireEvent.mouseOver(handle);
        expect(await screen.findByText("Resize the commit pane")).toBeTruthy();
        expect(screen.getByText("Drag, or use Left and Right. Double-click to reset.")).toBeTruthy();
    });
});

describe("resizedPaneWidth", () => {
    test("reads the width of the column the handle sits in", () => {
        const column = document.createElement("div");
        const handle = document.createElement("div");
        column.append(handle);
        jest.spyOn(column, "getBoundingClientRect").mockReturnValue(boxOfWidth(456));
        expect(resizedPaneWidth(handle)).toBe(456);
    });

    test("throws for a handle in no column, naming the fault and what to do", () => {
        expect(() => resizedPaneWidth(document.createElement("div"))).toThrow("A resize handle was rendered outside a pane's column, so there is no pane width to read. Render the handle inside the column that holds its pane.");
    });
});
