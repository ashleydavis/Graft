//
// Tests opening a new window for the new-window action: Ziggy's newWindow is called on a fake
// window.ziggy with no arguments. A window that could not be started rejects.
//

import { newWindowActionName, openNewWindow } from "../../lib/new-window";
import { installFakeZiggy } from "../fake-ziggy";

describe("newWindowActionName", () => {
    test("is the name the backend declares the action under", () => {
        expect(newWindowActionName).toBe("new-window");
    });
});

describe("openNewWindow", () => {
    test("calls Ziggy's newWindow with no arguments and resolves once it has started", async () => {
        const newWindow = jest.fn().mockResolvedValue(undefined);
        installFakeZiggy({
            newWindow,
        });
        await openNewWindow();
        expect(newWindow).toHaveBeenCalledWith([]);
    });

    test("rejects when the window could not be started", async () => {
        installFakeZiggy({
            newWindow: jest.fn().mockRejectedValue(new Error("NewWindowUnavailable")),
        });
        await expect(openNewWindow()).rejects.toThrow("NewWindowUnavailable");
    });
});
