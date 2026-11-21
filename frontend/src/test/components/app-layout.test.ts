//
// Tests the app's layout: renders it as the root of a router with a mock page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the Keyboard Shortcuts action shows the keyboard shortcuts overlay over it, that
// the left sidebar starts expanded and the right sidebar closed, that the top bar's buttons
// minimise and expand the left sidebar and slide the right sidebar in and out, that both sidebars
// are saved in Graft's state file and restored from it, that the top bar's breadcrumb trail
// follows the page shown and its drop-down opens another page and that the right sidebar shows the
// Git commands the page shown has run. It also checks that with no repo open the trail has no repo
// step and the Commits link is hidden. The actions of the feature hooks the layout calls are tested
// beside each hook.
//

import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { leftSidebarMinimisedStateKey, rightSidebarOpenStateKey } from "../../components/app-layout";
import { shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { elementWithDataId, renderAppLayout, renderAppLayoutWithZiggy, renderFakedAppLayout, sendTaskEvent, taskEventListeners } from "../render-app-layout";

describe("AppLayout", () => {
    test("puts the top bar above the left sidebar, the main content area and the right sidebar, in that order", async () => {
        const container = await renderAppLayout("/repos/graft");
        const layout = elementWithDataId(container, "app-layout");
        expect(layout?.children[0]).toBe(elementWithDataId(container, "top-bar"));
        const row = layout?.children[1];
        expect(row?.children[0]).toBe(elementWithDataId(container, "left-sidebar"));
        expect(row?.children[1]).toBe(elementWithDataId(container, "main-content"));
        expect(row?.children[2]).toBe(elementWithDataId(container, "right-sidebar"));
    });

    test("the Keyboard Shortcuts action shows the keyboard shortcuts overlay over the layout", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        expect(elementWithDataId(document.body, "shortcuts-overlay")).toBeUndefined();
        await act(async () => {
            await ziggy.runRegisteredAction(shortcutsOverlayAction);
        });
        expect(elementWithDataId(document.body, "shortcuts-overlay-search")).not.toBeUndefined();
        expect(elementWithDataId(container, "main-content")).not.toBeUndefined();
    });

    test("shows the page in the main content area", async () => {
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "main-content")?.contains(elementWithDataId(container, "mock-page") ?? null)).toBe(true);
    });

    test("starts with the left sidebar expanded and the right sidebar closed", async () => {
        const container = await renderAppLayout("/repos/graft");
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's menu button minimises the left sidebar and expands it again", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's right sidebar button slides the right sidebar in and out again", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-toggle")?.getAttribute("aria-label")).toBe("Close the right sidebar");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).not.toBeUndefined();
    });

    test("saves each click of the sidebar buttons in Graft's state file", async () => {
        const fake = makeFakeThemeZiggy({
            systemTheme: "light",
        });
        const { container } = await renderFakedAppLayout(fake, "/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(fake.stateWrites).toEqual([
            [leftSidebarMinimisedStateKey, true],
            [rightSidebarOpenStateKey, true],
            [leftSidebarMinimisedStateKey, false],
        ]);
    });

    test("starts with the sidebars as they were left when Graft last closed", async () => {
        const firstRun = makeFakeThemeZiggy({
            systemTheme: "light",
        });
        const first = await renderFakedAppLayout(firstRun, "/repos/graft");
        act(() => {
            elementWithDataId(first.container, "left-sidebar-toggle")?.click();
        });
        act(() => {
            elementWithDataId(first.container, "right-sidebar-toggle")?.click();
        });
        first.unmount();

        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: Object.fromEntries(firstRun.stateWrites),
        }), "/repos/graft");
        await waitFor(() => {
            expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        });
        expect(elementWithDataId(container, "left-sidebar-commits-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        expect(elementWithDataId(container, "right-sidebar-toggle")?.getAttribute("aria-label")).toBe("Close the right sidebar");
    });

    test("starts with the left sidebar expanded and the right sidebar closed when the state file holds false", async () => {
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: {
                [leftSidebarMinimisedStateKey]: false,
                [rightSidebarOpenStateKey]: false,
            },
        }), "/repos/graft");
        await act(async () => {
            await Promise.resolve();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("treats a value in the state file other than true as off", async () => {
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            savedState: {
                [leftSidebarMinimisedStateKey]: "yes",
                [rightSidebarOpenStateKey]: 1,
            },
        }), "/repos/graft");
        await act(async () => {
            await Promise.resolve();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("reports a state file it cannot read and starts with the left sidebar expanded and the right sidebar closed", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            getStateError: new Error("the disk is gone"),
        }), "/repos/graft");
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(`Graft could not read whether the left sidebar is minimised from its state file at ${leftSidebarMinimisedStateKey}: Error: the disk is gone. Graft starts with the default until it is changed.`);
        });
        expect(consoleError).toHaveBeenCalledWith(`Graft could not read whether the right sidebar is open from its state file at ${rightSidebarOpenStateKey}: Error: the disk is gone. Graft starts with the default until it is changed.`);
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
        consoleError.mockRestore();
    });

    test("reports a sidebar it cannot save and still changes the sidebar", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const { container } = await renderFakedAppLayout(makeFakeThemeZiggy({
            systemTheme: "light",
            setStateError: new Error("the disk is full"),
        }), "/repos/graft");
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "right-sidebar-content")).not.toBeUndefined();
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith(`Graft could not save whether the right sidebar is open in its state file at ${rightSidebarOpenStateKey}: Error: the disk is full. The sidebar stays as it is until Graft closes, and the next run starts as the file holds.`);
        });
        consoleError.mockRestore();
    });

    test("the top bar's theme menu changes the theme to the one chosen", async () => {
        const container = await renderAppLayout("/repos/graft");
        const themeButton = (): HTMLElement | undefined => elementWithDataId(container, "theme-button");

        //
        // Opens the theme menu, which draws outside the layout, and chooses the setting.
        //
        function chooseTheme(setting: string): void {
            act(() => {
                themeButton()?.click();
            });
            act(() => {
                document.querySelector<HTMLElement>(`[data-id="theme-option-${setting}"]`)?.click();
            });
        }

        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: System. Choose a theme");
        chooseTheme("dark");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: Dark. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(true);
        chooseTheme("light");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: Light. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
        chooseTheme("system");
        expect(themeButton()?.getAttribute("aria-label")).toBe("Theme: System. Choose a theme");
        expect(document.documentElement.classList.contains("dark")).toBe(false);
    });

    test("the top bar's trail starts with the repo and names the page shown", async () => {
        const container = await renderAppLayout("/repos/graft");
        const trailArea = elementWithDataId(container, "top-bar-trail");
        expect(elementWithDataId(container, "top-bar")?.contains(trailArea ?? null)).toBe(true);
        expect(elementWithDataId(container, "breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId(container, "breadcrumb-repo")?.getAttribute("aria-label")).toBe("/repos/graft");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });

    test("picking another page in the trail's drop-down opens it and the trail follows", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "breadcrumb-page")?.click();
        });
        act(() => {
            document.querySelector<HTMLElement>("[data-id=\"breadcrumb-option-help\"]")?.click();
        });
        await screen.findByText("The Help page");
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("Help");
    });
});

describe("AppLayout with no repo open", () => {
    test("hides the left sidebar's Commits link and starts the trail with the page", async () => {
        const container = await renderAppLayout(undefined);
        expect(elementWithDataId(container, "left-sidebar-commits-link")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-about-link")).not.toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-repo")).toBeUndefined();
        expect(elementWithDataId(container, "breadcrumb-page")?.textContent).toBe("About");
    });
});

describe("AppLayout's Git commands", () => {
    //
    // Opens the right sidebar.
    //
    function openRightSidebar(container: HTMLElement): void {
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
    }

    //
    // Opens the page with its link in the left sidebar and waits for its text.
    //
    async function openPage(container: HTMLElement, page: string, text: string): Promise<void> {
        act(() => {
            elementWithDataId(container, `left-sidebar-${page}-link`)?.click();
        });
        await screen.findByText(text);
    }

    //
    // Sends the event the Git interface function sends for the command, from a task of the
    // commits page.
    //
    function sendCommitsPageCommand(command: string): void {
        sendTaskEvent({
            taskId: "t1",
            source: "commits-page",
            data: {
                type: "git-command",
                directoryCommand: "cd /repos/graft",
                command,
                durationMs: 4,
            },
        });
    }

    test("the right sidebar says the About page has run no Git commands", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();
    });

    test("the right sidebar shows the commits page's commands, kept while the sidebar is closed and while another page is open", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendCommitsPageCommand("git log --max-count=50");
        await openPage(container, "commits", "The commits page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-directory")?.textContent).toBe("cd /repos/graft");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50");

        openRightSidebar(container);
        sendCommitsPageCommand("git diff-tree abc");
        await openPage(container, "help", "The Help page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();

        await openPage(container, "commits", "The commits page");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree abc");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git log --max-count=50");
    });

    test("ignores a task event that is not a Git command", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendTaskEvent({
            taskId: "t1",
            source: "commits-page",
            data: {
                type: "output",
            },
        });
        await openPage(container, "commits", "The commits page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")).not.toBeUndefined();
    });

    test("stops listening for task events when it is removed", async () => {
        await renderAppLayout("/repos/graft");
        expect(taskEventListeners().length).toBe(1);
        cleanup();
        expect(taskEventListeners().length).toBe(0);
    });
});
