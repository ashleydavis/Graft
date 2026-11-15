//
// Tests the zoom step counts, the zoom level saved for a step count, the step count read back from
// a saved level and the native zoom actions that bring a window to a saved level.
//

import { savedZoomStepCount, ZOOM_STEP_COUNT_MAX, ZOOM_STEP_COUNT_MIN, zoomInStepCount, zoomLevel, zoomOutStepCount, zoomRestoreActions } from "../../lib/zoom";

describe("zoomInStepCount", () => {
    test("adds a step", () => {
        expect(zoomInStepCount(0)).toBe(1);
        expect(zoomInStepCount(-3)).toBe(-2);
    });

    test("stays at the most steps", () => {
        expect(zoomInStepCount(ZOOM_STEP_COUNT_MAX)).toBe(ZOOM_STEP_COUNT_MAX);
    });
});

describe("zoomOutStepCount", () => {
    test("takes a step away", () => {
        expect(zoomOutStepCount(0)).toBe(-1);
        expect(zoomOutStepCount(3)).toBe(2);
    });

    test("stays at the fewest steps", () => {
        expect(zoomOutStepCount(ZOOM_STEP_COUNT_MIN)).toBe(ZOOM_STEP_COUNT_MIN);
    });
});

describe("zoomLevel", () => {
    test("is 1 at the actual size", () => {
        expect(zoomLevel(0)).toBe(1);
    });

    test("is a tenth more or less for each step", () => {
        expect(zoomLevel(2)).toBe(1.2);
        expect(zoomLevel(-3)).toBe(0.7);
    });

    test("is 0.3 at the fewest steps and 5 at the most", () => {
        expect(zoomLevel(ZOOM_STEP_COUNT_MIN)).toBe(0.3);
        expect(zoomLevel(ZOOM_STEP_COUNT_MAX)).toBe(5);
    });
});

describe("savedZoomStepCount", () => {
    test("reads back the step count of every saved level", () => {
        for (let stepCount = ZOOM_STEP_COUNT_MIN; stepCount <= ZOOM_STEP_COUNT_MAX; stepCount += 1) {
            expect(savedZoomStepCount(zoomLevel(stepCount))).toBe(stepCount);
        }
    });

    test("is the actual size for a missing value", () => {
        expect(savedZoomStepCount(undefined)).toBe(0);
    });

    test("is the actual size for a value that is not a number", () => {
        expect(savedZoomStepCount("1.2")).toBe(0);
        expect(savedZoomStepCount(null)).toBe(0);
        expect(savedZoomStepCount(true)).toBe(0);
    });

    test("goes to the nearest step for a level between two", () => {
        expect(savedZoomStepCount(1.23)).toBe(2);
        expect(savedZoomStepCount(0.87)).toBe(-1);
    });

    test("goes to the limit for a level past it", () => {
        expect(savedZoomStepCount(9)).toBe(ZOOM_STEP_COUNT_MAX);
        expect(savedZoomStepCount(0.1)).toBe(ZOOM_STEP_COUNT_MIN);
        expect(savedZoomStepCount(-2)).toBe(ZOOM_STEP_COUNT_MIN);
    });
});

describe("zoomRestoreActions", () => {
    test("is empty at the actual size", () => {
        expect(zoomRestoreActions(0)).toEqual([]);
    });

    test("puts the zoom back and steps in for each step in", () => {
        expect(zoomRestoreActions(2)).toEqual(["zoom-reset", "zoom-in", "zoom-in"]);
    });

    test("puts the zoom back and steps out for each step out", () => {
        expect(zoomRestoreActions(-3)).toEqual(["zoom-reset", "zoom-out", "zoom-out", "zoom-out"]);
    });
});
