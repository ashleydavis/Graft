//
// Tests the Repo Explorer action's hook through the layout that calls it: it names the backend's
// action, its handler opens the repo explorer page from any page and it is removed with the layout.
//

import { act, screen } from "@testing-library/react";
import { repoExplorerAction } from "../../components/repo-explorer-action";
import { makeFakeActionZiggy } from "../fake-action-ziggy";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { elementWithDataId, renderAppLayoutWithZiggy, renderFakedAppLayout } from "../render-app-layout";

describe("useRepoExplorerAction", () => {
    test("names the backend's Repo Explorer action", () => {
        expect(repoExplorerAction).toBe("open-repo-explorer");
    });

    test("the Repo Explorer action opens the repo explorer page", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        expect(ziggy.hasRegisteredAction(repoExplorerAction)).toBe(true);
        await act(async () => {
            await ziggy.runRegisteredAction(repoExplorerAction);
        });
        expect(await screen.findByText("The repo explorer page")).toBeTruthy();
    });

    test("the Repo Explorer action opens the repo explorer page from another page", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-help-link")?.click();
        });
        await screen.findByText("The Help page");
        await act(async () => {
            await ziggy.runRegisteredAction(repoExplorerAction);
        });
        expect(await screen.findByText("The repo explorer page")).toBeTruthy();
    });

    test("removes the Repo Explorer action's handler when the layout goes", async () => {
        const ziggy = makeFakeActionZiggy([]);
        const rendered = await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...ziggy,
        }, "/repos/graft");
        rendered.unmount();
        expect(ziggy.hasRegisteredAction(repoExplorerAction)).toBe(false);
    });
});
