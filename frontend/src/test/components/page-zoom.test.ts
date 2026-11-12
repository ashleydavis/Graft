//
// Tests Graft's zoom: that the zoom actions' handlers have the backend zoom the window and save the
// zoom level in Graft's state file, that they stop at the limits, that the saved level is brought
// back as Graft starts and that the handlers are removed with the component. Each test puts a fake
// window.ziggy whose state file holds what the test gives and whose invoke records the zoom
// messages.
//

import { cleanup, renderHook, waitFor } from "@testing-library/react";
import type { IJsonValue, IZiggyBridge } from "ziggy";
import { runZoomActions, saveZoomLevel, usePageZoom, zoomActualSizeActionName, zoomInActionName, zoomLevelStateKey, zoomOutActionName } from "../../components/page-zoom";
import { ZOOM_STEP_COUNT_MAX, ZOOM_STEP_COUNT_MIN, zoomLevel } from "../../lib/zoom";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
import { installFakeZiggy } from "../fake-ziggy";

//
// The fake window.ziggy the zoom code uses, with what it was asked to do.
//
interface IFakeZoomZiggy extends IFakeActionZiggy, Pick<IZiggyBridge, "getState" | "setState" | "invoke"> {
    // The zoom actions the zoom messages named, in order.
    zoomActions: string[];

    // Every value setState was asked to write, as [key path, value], in order.
    stateWrites: [string, IJsonValue | undefined][];
}

//
// How the fake starts: what the state file holds at zoom.level and the calls that fail.
//
interface IFakeZoomZiggyOptions {
    // The zoom level the state file holds, or undefined for none.
    savedLevel?: IJsonValue;

    // When given, getState fails with it.
    getStateError?: Error;

    // When given, setState fails with it.
    setStateError?: Error;

    // When given, invoke fails with it.
    invokeError?: Error;
}

//
// Puts the fake on window.ziggy and returns it.
//
function installFakeZoomZiggy(options: IFakeZoomZiggyOptions): IFakeZoomZiggy {
    const fake: IFakeZoomZiggy = {
        ...makeFakeActionZiggy([]),
        zoomActions: [],
        stateWrites: [],
        getState<TValue extends IJsonValue>(path: string): Promise<TValue | undefined> {
            expect(path).toBe(zoomLevelStateKey);
            if (options.getStateError !== undefined) {
                return Promise.reject(options.getStateError);
            }
            //
            // The caller picks TValue, so a guard cannot narrow the saved level to it. The fake
            // returns whatever the test saved, as the real state file does.
            //
            return Promise.resolve(options.savedLevel as TValue | undefined);
        },
        setState(path: string, value: IJsonValue | undefined): Promise<void> {
            fake.stateWrites.push([path, value]);
            if (options.setStateError !== undefined) {
                return Promise.reject(options.setStateError);
            }
            return Promise.resolve();
        },
        invoke<TResponse>(name: string, data: IJsonValue): Promise<TResponse> {
            expect(name).toBe("zoom");
            if (options.invokeError !== undefined) {
                return Promise.reject(options.invokeError);
            }
            if (data === null) {
                return Promise.reject(new Error("The zoom message's data is null."));
            }
            if (typeof data !== "object") {
                return Promise.reject(new Error("The zoom message's data is a plain value."));
            }
            if (Array.isArray(data)) {
                return Promise.reject(new Error("The zoom message's data is a list."));
            }
            fake.zoomActions.push(String(data.action));

            //
            // The caller picks TResponse, so a guard cannot narrow null to it. The zoom message's
            // response is null, as the backend sends.
            //
            return Promise.resolve(null as TResponse);
        },
    };
    return installFakeZiggy(fake);
}

//
// Waits until the promises the hook started have settled, so the state file has been read and any
// restore has run before a test's own actions.
//
async function waitForRestore(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 0));
}

beforeEach(() => {
    jest.spyOn(console, "error").mockImplementation(() => {
    });
});

afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
});

describe("usePageZoom", () => {
    test("registers the zoom actions and removes them with the component", () => {
        const ziggy = installFakeZoomZiggy({});
        const rendered = renderHook(() => usePageZoom());
        expect(ziggy.hasRegisteredAction(zoomInActionName)).toBe(true);
        expect(ziggy.hasRegisteredAction(zoomOutActionName)).toBe(true);
        expect(ziggy.hasRegisteredAction(zoomActualSizeActionName)).toBe(true);
        rendered.unmount();
        expect(ziggy.hasRegisteredAction(zoomInActionName)).toBe(false);
        expect(ziggy.hasRegisteredAction(zoomOutActionName)).toBe(false);
        expect(ziggy.hasRegisteredAction(zoomActualSizeActionName)).toBe(false);
    });

    test("with nothing saved, starts at the actual size and zooms nothing", async () => {
        const ziggy = installFakeZoomZiggy({});
        renderHook(() => usePageZoom());
        await waitForRestore();
        expect(ziggy.zoomActions).toEqual([]);
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("brings the window to the saved zoom level as it starts", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: 1.2,
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(ziggy.zoomActions).toEqual(["zoom-reset", "zoom-in", "zoom-in"]);
        });
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("Zoom In zooms in a step and saves the level", async () => {
        const ziggy = installFakeZoomZiggy({});
        renderHook(() => usePageZoom());
        await waitForRestore();
        await ziggy.runRegisteredAction(zoomInActionName);
        await ziggy.runRegisteredAction(zoomInActionName);
        expect(ziggy.zoomActions).toEqual(["zoom-in", "zoom-in"]);
        expect(ziggy.stateWrites).toEqual([
            [zoomLevelStateKey, 1.1],
            [zoomLevelStateKey, 1.2],
        ]);
    });

    test("Zoom Out zooms out a step from the saved level and saves the level", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: 1.2,
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(ziggy.zoomActions).toHaveLength(3);
        });
        await ziggy.runRegisteredAction(zoomOutActionName);
        expect(ziggy.zoomActions).toEqual(["zoom-reset", "zoom-in", "zoom-in", "zoom-out"]);
        expect(ziggy.stateWrites).toEqual([
            [zoomLevelStateKey, 1.1],
        ]);
    });

    test("Actual Size puts the zoom back and saves 1", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: 0.8,
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(ziggy.zoomActions).toHaveLength(3);
        });
        await ziggy.runRegisteredAction(zoomActualSizeActionName);
        expect(ziggy.zoomActions).toEqual(["zoom-reset", "zoom-out", "zoom-out", "zoom-reset"]);
        expect(ziggy.stateWrites).toEqual([
            [zoomLevelStateKey, 1],
        ]);
    });

    test("Actual Size at the actual size does nothing", async () => {
        const ziggy = installFakeZoomZiggy({});
        renderHook(() => usePageZoom());
        await waitForRestore();
        await ziggy.runRegisteredAction(zoomActualSizeActionName);
        expect(ziggy.zoomActions).toEqual([]);
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("Zoom In at the most steps does nothing", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: zoomLevel(ZOOM_STEP_COUNT_MAX),
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(ziggy.zoomActions).toHaveLength(ZOOM_STEP_COUNT_MAX + 1);
        });
        await ziggy.runRegisteredAction(zoomInActionName);
        expect(ziggy.zoomActions).toHaveLength(ZOOM_STEP_COUNT_MAX + 1);
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("Zoom Out at the fewest steps does nothing", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: zoomLevel(ZOOM_STEP_COUNT_MIN),
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(ziggy.zoomActions).toHaveLength(1 - ZOOM_STEP_COUNT_MIN);
        });
        await ziggy.runRegisteredAction(zoomOutActionName);
        expect(ziggy.zoomActions).toHaveLength(1 - ZOOM_STEP_COUNT_MIN);
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("a component removed before the state file is read restores nothing", async () => {
        const ziggy = installFakeZoomZiggy({
            savedLevel: 1.2,
        });
        const rendered = renderHook(() => usePageZoom());
        rendered.unmount();
        await waitForRestore();
        expect(ziggy.zoomActions).toEqual([]);
    });

    test("a failed read of the state file is logged and the window stays at the actual size", async () => {
        const ziggy = installFakeZoomZiggy({
            getStateError: new Error("StateFileUnreadable"),
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Graft could not bring the window to the zoom level saved in its state file at zoom.level: Error: StateFileUnreadable."));
        });
        expect(ziggy.zoomActions).toEqual([]);
    });

    test("a failed restore is logged", async () => {
        installFakeZoomZiggy({
            savedLevel: 1.1,
            invokeError: new Error("InvalidMessageData"),
        });
        renderHook(() => usePageZoom());
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Error: InvalidMessageData. The window's zoom may not match that level"));
        });
    });

    test("a zoom action whose zoom message fails rejects", async () => {
        const ziggy = installFakeZoomZiggy({
            invokeError: new Error("InvalidMessageData"),
        });
        renderHook(() => usePageZoom());
        await waitForRestore();
        await expect(ziggy.runRegisteredAction(zoomInActionName)).rejects.toThrow("InvalidMessageData");
    });
});

describe("runZoomActions", () => {
    test("sends one zoom message for each action, in order", async () => {
        const ziggy = installFakeZoomZiggy({});
        await runZoomActions(["zoom-reset", "zoom-out"]);
        expect(ziggy.zoomActions).toEqual(["zoom-reset", "zoom-out"]);
    });
});

describe("saveZoomLevel", () => {
    test("writes the level of the step count at zoom.level", () => {
        const ziggy = installFakeZoomZiggy({});
        saveZoomLevel(3);
        expect(ziggy.stateWrites).toEqual([
            [zoomLevelStateKey, 1.3],
        ]);
    });

    test("logs a failed write", async () => {
        installFakeZoomZiggy({
            setStateError: new Error("FileTooLarge"),
        });
        saveZoomLevel(1);
        await waitFor(() => {
            expect(console.error).toHaveBeenCalledWith(expect.stringContaining("Graft could not save the zoom level in its state file at zoom.level: Error: FileTooLarge."));
        });
    });
});
