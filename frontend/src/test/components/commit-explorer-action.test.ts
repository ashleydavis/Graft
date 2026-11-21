//
// Tests the Commit Explorer action's hook through the layout that calls it: it names the backend's
// action, its handler opens the commits page from any page and it is removed with the layout.
//

import { act, screen } from "@testing-library/react";
import { commitExplorerAction } from "../../components/commit-explorer-action";
import { makeFakeActionZiggy } from "../fake-action-ziggy";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { elementWithDataId, renderAppLayoutWithZiggy, renderFakedAppLayout } from "../render-app-layout";

describe("useCommitExplorerAction", () => {
    test("names the backend's Commit Explorer action", () => {
        expect(commitExplorerAction).toBe("open-commit-explorer");
    });

    test("the Commit Explorer action opens the commits page", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        expect(ziggy.hasRegisteredAction(commitExplorerAction)).toBe(true);
        await act(async () => {
            await ziggy.runRegisteredAction(commitExplorerAction);
        });
        expect(await screen.findByText("The commits page")).toBeTruthy();
    });

    test("the Commit Explorer action opens the commits page from another page", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-help-link")?.click();
        });
        await screen.findByText("The Help page");
        await act(async () => {
            await ziggy.runRegisteredAction(commitExplorerAction);
        });
        expect(await screen.findByText("The commits page")).toBeTruthy();
    });

    test("removes the Commit Explorer action's handler when the layout goes", async () => {
        const ziggy = makeFakeActionZiggy([]);
        const rendered = await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...ziggy,
        }, "/repos/graft");
        rendered.unmount();
        expect(ziggy.hasRegisteredAction(commitExplorerAction)).toBe(false);
    });
});
