//
// Tests opening a repo for the open-repo action: the folder picker is shown through the backend's
// pick-repo-folder message on a fake window.ziggy, the folder chosen is passed on, a cancelled
// picker opens nothing and a picker that could not be shown rejects.
//

import type { IZiggyBridge } from "ziggy";
import { openPickedRepo, openRepoActionName, pickRepoFolder } from "../../lib/open-repo";
import { installFakeZiggy } from "../fake-ziggy";

//
// Puts a fake on window.ziggy whose invoke settles as the test sets, and returns it.
//
function installInvokeZiggy(invoke: jest.Mock): Pick<IZiggyBridge, "invoke"> {
    return installFakeZiggy({
        invoke,
    });
}

describe("openRepoActionName", () => {
    test("is the name the backend declares the action under", () => {
        expect(openRepoActionName).toBe("open-repo");
    });
});

describe("pickRepoFolder", () => {
    test("sends the pick-repo-folder message and resolves with the folder chosen", async () => {
        const ziggy = installInvokeZiggy(jest.fn().mockResolvedValue("/repos/graft"));
        expect(await pickRepoFolder()).toBe("/repos/graft");
        expect(ziggy.invoke).toHaveBeenCalledWith("pick-repo-folder", null);
    });

    test("resolves with undefined when the user cancelled", async () => {
        installInvokeZiggy(jest.fn().mockResolvedValue(null));
        expect(await pickRepoFolder()).toBeUndefined();
    });

    test("rejects when the picker could not be shown", async () => {
        installInvokeZiggy(jest.fn().mockRejectedValue(new Error("NativeCallFailed")));
        await expect(pickRepoFolder()).rejects.toThrow("NativeCallFailed");
    });
});

describe("openPickedRepo", () => {
    test("opens the folder chosen", async () => {
        installInvokeZiggy(jest.fn().mockResolvedValue("/repos/graft"));
        const onOpen = jest.fn();
        await openPickedRepo(onOpen);
        expect(onOpen).toHaveBeenCalledWith("/repos/graft");
    });

    test("opens nothing when the user cancelled", async () => {
        installInvokeZiggy(jest.fn().mockResolvedValue(null));
        const onOpen = jest.fn();
        await openPickedRepo(onOpen);
        expect(onOpen).not.toHaveBeenCalled();
    });

    test("rejects when the picker could not be shown and opens nothing", async () => {
        installInvokeZiggy(jest.fn().mockRejectedValue(new Error("NativeCallFailed")));
        const onOpen = jest.fn();
        await expect(openPickedRepo(onOpen)).rejects.toThrow("NativeCallFailed");
        expect(onOpen).not.toHaveBeenCalled();
    });
});
