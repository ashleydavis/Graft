//
// Tests the width of one of the repo explorer's panes that its resize handle sets: that it is read
// from Graft's state file as the pane first shows, that a change is saved at the pane's key path
// and a reset removes it, that a change made before the read ends is kept and that a failed read or
// save is logged. Each test puts a fake window.ziggy whose state file holds what the test gives.
//

import { act, cleanup, renderHook, waitFor } from "@testing-library/react";
import type { IJsonValue, IZiggyBridge } from "ziggy";
import { savePaneWidth, usePaneWidth } from "../../../../pages/repo-explorer/components/pane-width-state";
import { installFakeZiggy } from "../../../fake-ziggy";

//
// The fake window.ziggy the pane width code uses, with what it was asked to do.
//
interface IFakeStateZiggy extends Pick<IZiggyBridge, "getState" | "setState"> {
    // Every key path getState was asked to read, in order.
    stateReads: string[];

    // Every value setState was asked to write, as [key path, value], in order.
    stateWrites: [string, IJsonValue | undefined][];

    // Ends the read getState started, with the value the state file holds.
    endRead(value: IJsonValue | undefined): void;
}

//
// How the fake starts: the calls that fail.
//
interface IFakeStateZiggyOptions {
    // When given, getState fails with it.
    getStateError?: Error;

    // When given, setState fails with it.
    setStateError?: Error;
}

//
// Puts the fake on window.ziggy and returns it. Its getState read waits until the test ends it, so
// a test can change the width before the read ends.
//
function installFakeStateZiggy(options: IFakeStateZiggyOptions): IFakeStateZiggy {
    let endRead: (value: IJsonValue | undefined) => void = () => {
    };
    const fake: IFakeStateZiggy = {
        stateReads: [],
        stateWrites: [],
        endRead(value: IJsonValue | undefined): void {
            endRead(value);
        },
        getState<TValue extends IJsonValue>(path: string): Promise<TValue | undefined> {
            fake.stateReads.push(path);
            if (options.getStateError !== undefined) {
                return Promise.reject(options.getStateError);
            }
            return new Promise(resolve => {
                endRead = value => {
                    //
                    // The caller picks TValue, so a guard cannot narrow the saved value to it. The
                    // fake returns whatever the test gives, as the real state file does.
                    //
                    resolve(value as TValue | undefined);
                };
            });
        },
        setState(path: string, value: IJsonValue | undefined): Promise<void> {
            fake.stateWrites.push([path, value]);
            if (options.setStateError !== undefined) {
                return Promise.reject(options.setStateError);
            }
            return Promise.resolve();
        },
    };
    return installFakeZiggy(fake);
}

afterEach(() => {
    cleanup();
    jest.restoreAllMocks();
});

describe("savePaneWidth", () => {
    test("writes the width at the pane's key path", () => {
        const ziggy = installFakeStateZiggy({});
        savePaneWidth("commits", 600);
        expect(ziggy.stateWrites).toEqual([["paneWidths.commits", 600]]);
    });

    test("removes the key for undefined", () => {
        const ziggy = installFakeStateZiggy({});
        savePaneWidth("changes", undefined);
        expect(ziggy.stateWrites).toEqual([["paneWidths.changes", undefined]]);
    });

    test("logs a failed write with the key path and what to expect", async () => {
        installFakeStateZiggy({
            setStateError: new Error("disk full"),
        });
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        savePaneWidth("commitDetails", 500);
        await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
        expect(consoleError).toHaveBeenCalledWith("Graft could not save the width of the commitDetails pane in its state file at paneWidths.commitDetails: Error: disk full. The pane keeps its width until Graft closes, and the next run opens it at the width the file holds.");
    });
});

describe("usePaneWidth", () => {
    test("starts at the usual width and reads the pane's saved width", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("commits"));
        expect(result.current.width).toBeUndefined();
        expect(ziggy.stateReads).toEqual(["paneWidths.commits"]);
        await act(async () => {
            ziggy.endRead(640);
        });
        expect(result.current.width).toBe(640);
        expect(ziggy.stateWrites).toEqual([]);
    });

    test("keeps a saved width inside the pane's limits", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("commitDetails"));
        await act(async () => {
            ziggy.endRead(5000);
        });
        expect(result.current.width).toBe(800);
    });

    test("keeps the usual width when no width is saved", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("repoDetails"));
        await act(async () => {
            ziggy.endRead(undefined);
        });
        expect(result.current.width).toBeUndefined();
    });

    test("changes the width and saves it", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("changes"));
        await act(async () => {
            ziggy.endRead(undefined);
        });
        act(() => {
            result.current.changeWidth(512);
        });
        expect(result.current.width).toBe(512);
        expect(ziggy.stateWrites).toEqual([["paneWidths.changes", 512]]);
    });

    test("resets to the usual width and removes the saved width", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("commits"));
        await act(async () => {
            ziggy.endRead(700);
        });
        act(() => {
            result.current.resetWidth();
        });
        expect(result.current.width).toBeUndefined();
        expect(ziggy.stateWrites).toEqual([["paneWidths.commits", undefined]]);
    });

    test("keeps a width changed before the read ends, because it is newer than the saved one", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("commits"));
        act(() => {
            result.current.changeWidth(400);
        });
        await act(async () => {
            ziggy.endRead(900);
        });
        expect(result.current.width).toBe(400);
    });

    test("keeps a reset made before the read ends", async () => {
        const ziggy = installFakeStateZiggy({});
        const { result } = renderHook(() => usePaneWidth("commits"));
        act(() => {
            result.current.resetWidth();
        });
        await act(async () => {
            ziggy.endRead(900);
        });
        expect(result.current.width).toBeUndefined();
    });

    test("drops a read that ends after the component has gone", async () => {
        const ziggy = installFakeStateZiggy({});
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { result, unmount } = renderHook(() => usePaneWidth("commits"));
        unmount();
        await act(async () => {
            ziggy.endRead(900);
        });
        expect(result.current.width).toBeUndefined();
        expect(consoleError).not.toHaveBeenCalled();
    });

    test("logs a failed read with the key path and what to expect, and keeps the usual width", async () => {
        installFakeStateZiggy({
            getStateError: new Error("bad file"),
        });
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { result } = renderHook(() => usePaneWidth("repoDetails"));
        await waitFor(() => expect(consoleError).toHaveBeenCalledTimes(1));
        expect(consoleError).toHaveBeenCalledWith("Graft could not read the width of the repoDetails pane saved in its state file at paneWidths.repoDetails: Error: bad file. The pane opens at its usual width, and the resize handle beside it still sets and saves its width.");
        expect(result.current.width).toBeUndefined();
    });
});
