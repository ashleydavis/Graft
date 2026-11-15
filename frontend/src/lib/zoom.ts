//
// Works out Graft's zoom: the zoom step counts the Zoom In, Zoom Out and Actual Size actions move
// to, the zoom level saved in Graft's state file for a step count and the native zoom actions that
// bring a window that has just started to a saved level.
//

import type { IJsonValue } from "ziggy";

//
// One of the native app's zoom actions, as the backend's zoom message names them
// (backend/src/lib/zoom.zig): a step in, a step out or back to the actual size.
//
export type ZoomAction = "zoom-in" | "zoom-out" | "zoom-reset";

//
// The fewest zoom steps from the actual size, each a step out. Ziggy's native apps step the zoom by
// 0.1, so -7 is a zoom level of 0.3, the least macOS allows. Linux and Windows allow 0.25, so every
// step Graft counts is one the native app takes.
//
export const ZOOM_STEP_COUNT_MIN = -7;

//
// The most zoom steps from the actual size, each a step in. 40 steps of 0.1 is a zoom level of 5,
// the most every native app allows, so every step Graft counts is one the native app takes.
//
export const ZOOM_STEP_COUNT_MAX = 40;

//
// Works out the step count one step in from the step count, for the Zoom In action. At the most
// steps it stays where it is, as the native app's zoom does.
//
export function zoomInStepCount(stepCount: number): number {
    return Math.min(ZOOM_STEP_COUNT_MAX, stepCount + 1);
}

//
// Works out the step count one step out from the step count, for the Zoom Out action. At the
// fewest steps it stays where it is, as the native app's zoom does.
//
export function zoomOutStepCount(stepCount: number): number {
    return Math.max(ZOOM_STEP_COUNT_MIN, stepCount - 1);
}

//
// Works out the zoom level of the step count, such as 1.2 for two steps in, which Graft saves in
// its state file. It divides whole tenths, so the level is the shortest number for its tenths and
// the state file holds exactly 1.2.
//
export function zoomLevel(stepCount: number): number {
    return (10 + stepCount) / 10;
}

//
// Works out the step count of the zoom level read from Graft's state file, so a window that has
// just started goes back to the zoom it was left at. A level between two steps goes to the nearest
// one and a level past the fewest or most steps goes to that limit. Any other value, such as a
// string or a missing value, is the actual size.
//
export function savedZoomStepCount(value: IJsonValue | undefined): number {
    if (typeof value !== "number") {
        return 0;
    }
    const stepCount = Math.round((value - 1) * 10);
    return Math.min(ZOOM_STEP_COUNT_MAX, Math.max(ZOOM_STEP_COUNT_MIN, stepCount));
}

//
// Lists the native zoom actions, in order, that bring a window from any zoom to the step count:
// back to the actual size, then one step in or out for each step. It starts from the actual size,
// because Graft can only step the native app's zoom, and a reload keeps the zoom the window had. At
// the actual size the list is empty, because a window starts there.
//
export function zoomRestoreActions(stepCount: number): ZoomAction[] {
    const actions: ZoomAction[] = [];
    if (stepCount === 0) {
        return actions;
    }
    actions.push("zoom-reset");
    const step: ZoomAction = stepCount > 0 ? "zoom-in" : "zoom-out";
    for (let index = 0; index < Math.abs(stepCount); index += 1) {
        actions.push(step);
    }
    return actions;
}
