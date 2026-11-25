//
// Tests the widths of the repo explorer's panes that the resize handles set: that each width is
// kept inside the pane's limits, that a drag and the Left and Right keys move the width, that each
// pane has its own key path in Graft's state file, that a saved width is read back inside the
// limits and anything else is the usual width, and the style that gives a pane its width.
//

import { clampPaneWidth, draggedPaneWidth, steppedPaneWidth, PANE_LIMITS, paneWidthStateKey, paneWidthStyle, RESIZE_KEY_STEP, savedPaneWidth } from "../../lib/pane-widths";

describe("PANE_LIMITS", () => {
    test("gives the commit pane and the commit details pane the style guide's limits", () => {
        expect(PANE_LIMITS.commits).toEqual({
            min: 320,
            max: 1000,
        });
        expect(PANE_LIMITS.commitDetails).toEqual({
            min: 300,
            max: 800,
        });
    });

    test("gives the repo details pane and the changes pane the commit details pane's limits", () => {
        expect(PANE_LIMITS.repoDetails).toEqual(PANE_LIMITS.commitDetails);
        expect(PANE_LIMITS.changes).toEqual(PANE_LIMITS.commitDetails);
    });
});

describe("clampPaneWidth", () => {
    test("keeps a width inside the limits, rounded to a whole pixel", () => {
        expect(clampPaneWidth(500.4, PANE_LIMITS.commits)).toBe(500);
        expect(clampPaneWidth(500.6, PANE_LIMITS.commits)).toBe(501);
    });

    test("keeps a width at the limits, which are inside them", () => {
        expect(clampPaneWidth(320, PANE_LIMITS.commits)).toBe(320);
        expect(clampPaneWidth(1000, PANE_LIMITS.commits)).toBe(1000);
    });

    test("moves a width past a limit to that limit", () => {
        expect(clampPaneWidth(100, PANE_LIMITS.commits)).toBe(320);
        expect(clampPaneWidth(2000, PANE_LIMITS.commits)).toBe(1000);
        expect(clampPaneWidth(299, PANE_LIMITS.commitDetails)).toBe(300);
        expect(clampPaneWidth(801, PANE_LIMITS.commitDetails)).toBe(800);
    });
});

describe("draggedPaneWidth", () => {
    test("moves the pane's right edge with the pointer", () => {
        expect(draggedPaneWidth(450, 600, 650, PANE_LIMITS.commitDetails)).toBe(500);
        expect(draggedPaneWidth(450, 600, 520, PANE_LIMITS.commitDetails)).toBe(370);
    });

    test("leaves the width as it was while the pointer is where the drag started", () => {
        expect(draggedPaneWidth(450, 600, 600, PANE_LIMITS.commitDetails)).toBe(450);
    });

    test("stops at the pane's limits", () => {
        expect(draggedPaneWidth(450, 600, 0, PANE_LIMITS.commitDetails)).toBe(300);
        expect(draggedPaneWidth(450, 600, 2000, PANE_LIMITS.commitDetails)).toBe(800);
    });
});

describe("steppedPaneWidth", () => {
    test("makes the pane a step narrower for Left and a step wider for Right", () => {
        expect(RESIZE_KEY_STEP).toBe(16);
        expect(steppedPaneWidth(500, "ArrowLeft", PANE_LIMITS.commits)).toBe(484);
        expect(steppedPaneWidth(500, "ArrowRight", PANE_LIMITS.commits)).toBe(516);
    });

    test("stops at the pane's limits", () => {
        expect(steppedPaneWidth(330, "ArrowLeft", PANE_LIMITS.commits)).toBe(320);
        expect(steppedPaneWidth(320, "ArrowLeft", PANE_LIMITS.commits)).toBe(320);
        expect(steppedPaneWidth(990, "ArrowRight", PANE_LIMITS.commits)).toBe(1000);
        expect(steppedPaneWidth(1000, "ArrowRight", PANE_LIMITS.commits)).toBe(1000);
    });

    test("leaves the width undefined for any other key", () => {
        expect(steppedPaneWidth(500, "ArrowUp", PANE_LIMITS.commits)).toBeUndefined();
        expect(steppedPaneWidth(500, "Enter", PANE_LIMITS.commits)).toBeUndefined();
        expect(steppedPaneWidth(500, "a", PANE_LIMITS.commits)).toBeUndefined();
    });
});

describe("paneWidthStateKey", () => {
    test("gives each pane a key path of its own under paneWidths", () => {
        expect(paneWidthStateKey("repoDetails")).toBe("paneWidths.repoDetails");
        expect(paneWidthStateKey("commits")).toBe("paneWidths.commits");
        expect(paneWidthStateKey("commitDetails")).toBe("paneWidths.commitDetails");
        expect(paneWidthStateKey("changes")).toBe("paneWidths.changes");
    });
});

describe("savedPaneWidth", () => {
    test("reads a saved width", () => {
        expect(savedPaneWidth(600, PANE_LIMITS.commits)).toBe(600);
    });

    test("keeps a saved width inside the limits", () => {
        expect(savedPaneWidth(10, PANE_LIMITS.commits)).toBe(320);
        expect(savedPaneWidth(5000, PANE_LIMITS.commits)).toBe(1000);
    });

    test("reads anything but a number as the usual width", () => {
        expect(savedPaneWidth(undefined, PANE_LIMITS.commits)).toBeUndefined();
        expect(savedPaneWidth(null, PANE_LIMITS.commits)).toBeUndefined();
        expect(savedPaneWidth("600", PANE_LIMITS.commits)).toBeUndefined();
        expect(savedPaneWidth({
            width: 600,
        }, PANE_LIMITS.commits)).toBeUndefined();
    });
});

describe("paneWidthStyle", () => {
    test("sets the width in pixels", () => {
        expect(paneWidthStyle(512)).toEqual({
            width: "512px",
        });
    });

    test("sets no style for the usual width", () => {
        expect(paneWidthStyle(undefined)).toBeUndefined();
    });
});
