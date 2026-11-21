//
// Tests the open-repo action's hook through the layout that calls it: its handler opens the folder
// picked on the repo explorer page, in place of the repo open before, opens nothing when the picker
// is cancelled and is removed with the layout.
//

import { act, cleanup, screen } from "@testing-library/react";
import { elementWithDataId, renderAppLayoutWithZiggy } from "../render-app-layout";

describe("useOpenRepoAction", () => {
    test("opens the folder picked on the repo explorer page, with the trail and Repo explorer link following", async () => {
        const invoke = jest.fn().mockResolvedValue("/repos/picked");
        const [container, ziggy] = await renderAppLayoutWithZiggy(undefined, invoke);
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        expect(invoke).toHaveBeenCalledWith("pick-repo-folder", null);
        await screen.findByText("The repo explorer page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("picked");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("aria-label")).toBe("/repos/picked");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("Repo explorer");
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")).not.toBeUndefined();
    });

    test("opens the folder picked in place of the repo open before", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft", jest.fn().mockResolvedValue("/repos/other"));
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        await screen.findByText("The repo explorer page");
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("other");
    });

    test("opens nothing and stays on the page when the picker is cancelled", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy(undefined, jest.fn().mockResolvedValue(null));
        await act(async () => {
            await ziggy.runRegisteredAction("open-repo");
        });
        expect(screen.getByText("The page").getAttribute("data-id")).toBe("mock-page");
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")).toBeUndefined();
    });

    test("removes the action's handler when the layout goes", async () => {
        const [, ziggy] = await renderAppLayoutWithZiggy(undefined);
        expect(ziggy.hasRegisteredAction("open-repo")).toBe(true);
        cleanup();
        expect(ziggy.hasRegisteredAction("open-repo")).toBe(false);
    });
});
