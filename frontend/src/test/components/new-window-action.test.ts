//
// Tests the new-window action's hook through the layout that calls it: its handler calls Ziggy's
// newWindow and it is removed with the layout.
//

import { act, cleanup } from "@testing-library/react";
import { makeFakeActionZiggy } from "../fake-action-ziggy";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { renderAppLayoutWithZiggy, renderFakedAppLayout } from "../render-app-layout";

describe("useNewWindowAction", () => {
    test("calls Ziggy's newWindow with no arguments", async () => {
        const ziggy = makeFakeActionZiggy([]);
        const newWindow = jest.fn().mockResolvedValue(undefined);
        await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...ziggy,
            newWindow,
        }, undefined);
        await act(async () => {
            await ziggy.runRegisteredAction("new-window");
        });
        expect(newWindow).toHaveBeenCalledWith([]);
    });

    test("removes the action's handler when the layout goes", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy(undefined);
        expect(ziggy.hasRegisteredAction("new-window")).toBe(true);
        cleanup();
        expect(ziggy.hasRegisteredAction("new-window")).toBe(false);
    });
});
