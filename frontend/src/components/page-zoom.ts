//
// Graft's zoom: the handlers of the Zoom In, Zoom Out and Actual Size actions, which zoom the
// window through the backend and save the zoom level in Graft's state file, and the restore of the
// saved level as Graft starts.
//

import { useEffect } from "react";
import { savedZoomStepCount, ZoomAction, zoomInStepCount, zoomLevel, zoomOutStepCount, zoomRestoreActions } from "../lib/zoom";

//
// The key path in Graft's state file of the zoom level, such as 1.2. Each zoom action writes it and
// Graft reads it as it starts.
//
export const zoomLevelStateKey = "zoom.level";

//
// The name of the backend's Zoom In action (backend/src/lib/actions.zig), whose shortcut is
// CmdOrCtrl+Plus. Ziggy keeps the name "zoom-in" for the native app's standard action.
//
export const zoomInActionName = "zoom-in-step";

//
// The name of the backend's Zoom Out action, whose shortcut is CmdOrCtrl+Minus.
//
export const zoomOutActionName = "zoom-out-step";

//
// The name of the backend's Actual Size action, whose shortcut is CmdOrCtrl+0.
//
export const zoomActualSizeActionName = "zoom-actual-size";

//
// Has the native app run the zoom actions, one after another, through the backend's zoom message,
// because every access to the computer goes through the backend. Each waits for the one before, so
// the steps land in order. It rejects when the backend refuses one.
//
export async function runZoomActions(actions: ZoomAction[]): Promise<void> {
    for (const action of actions) {
        await window.ziggy.invoke<null>("zoom", {
            action,
        });
    }
}

//
// Saves the zoom level of the step count in Graft's state file, so the next run of Graft starts at
// it. A failed write is logged with what to expect, and the window keeps its zoom until it closes.
//
export function saveZoomLevel(stepCount: number): void {
    window.ziggy.setState(zoomLevelStateKey, zoomLevel(stepCount)).catch(error => {
        console.error(`Graft could not save the zoom level in its state file at ${zoomLevelStateKey}: ${String(error)}. The window keeps its zoom until it closes, and the next run starts at the level the file holds.`);
    });
}

//
// Registers the handlers of the Zoom In, Zoom Out and Actual Size actions for as long as the
// component that calls it is shown, and brings the window to the zoom level saved in Graft's state
// file when it is first shown. The window's step count is kept here, because Graft can only step
// the native app's zoom: each action works out the next step count, has the native app take the
// step and saves the new level. An action that would leave the step count where it is, at a limit
// or at the actual size, returns at once and leaves the zoom and the state file as they are. Each
// window keeps its own count, so another window of Graft zooming changes only what the next run
// starts at. A failed restore is logged with what to do. A handler whose zoom message fails
// rejects, and Ziggy logs it naming the action.
//
export function usePageZoom(): void {
    useEffect(() => {
        let stepCount = 0;
        let isRemoved = false;

        function zoomTo(nextStepCount: number, action: ZoomAction): Promise<void> {
            if (nextStepCount === stepCount) {
                return Promise.resolve();
            }
            stepCount = nextStepCount;
            saveZoomLevel(stepCount);
            return runZoomActions([action]);
        }

        window.ziggy.getState(zoomLevelStateKey)
            .then(value => {
                if (isRemoved) {
                    return;
                }
                stepCount = savedZoomStepCount(value);
                return runZoomActions(zoomRestoreActions(stepCount));
            })
            .catch(error => {
                console.error(`Graft could not bring the window to the zoom level saved in its state file at ${zoomLevelStateKey}: ${String(error)}. The window's zoom may not match that level, and Actual Size puts it back to the normal size.`);
            });

        window.ziggy.registerAction(zoomInActionName, () => zoomTo(zoomInStepCount(stepCount), "zoom-in"));
        window.ziggy.registerAction(zoomOutActionName, () => zoomTo(zoomOutStepCount(stepCount), "zoom-out"));
        window.ziggy.registerAction(zoomActualSizeActionName, () => zoomTo(0, "zoom-reset"));
        return () => {
            isRemoved = true;
            window.ziggy.removeAction(zoomInActionName);
            window.ziggy.removeAction(zoomOutActionName);
            window.ziggy.removeAction(zoomActualSizeActionName);
        };
    }, []);
}
