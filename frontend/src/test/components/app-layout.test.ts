//
// Tests the app's layout: renders it as the root of a router with a mock page and checks it
// lays out the top bar, the left sidebar, the main content area holding the page and the right
// sidebar, that the Keyboard Shortcuts action and the top bar's keyboard shortcuts button show the
// keyboard shortcuts overlay over it, that the overlay lists the keys of the pane the page makes
// active first, that the left sidebar starts expanded and the right sidebar
// closed, that the top bar's buttons minimise and expand the left sidebar and slide the right
// sidebar in and out, that both sidebars
// are saved in Graft's state file and restored from it, that the top bar's breadcrumb trail
// follows the page shown and its drop-down opens another page and that the right sidebar shows the
// Git commands the page shown has run. It checks the trail ends with the pane steps the repo
// explorer page sets, and that the Command Palette action shows the command palette with the
// commands of the page shown, or of the active pane the repo explorer page sets, first. It checks
// the right sidebar shows the Git commands of the active pane, or of the page shown while the page
// has no active pane. It also
// checks that with no repo open the trail has no repo
// step and the Repo explorer link is hidden. The actions of the feature hooks the layout calls are
// tested beside each hook.
//

import { act, cleanup, screen, waitFor } from "@testing-library/react";
import { leftSidebarMinimisedStateKey, rightSidebarOpenStateKey } from "../../components/app-layout";
import { commandPaletteAction } from "../../components/command-palette";
import { shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { makeFakeThemeZiggy } from "../fake-theme-ziggy";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
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

    test("the keyboard shortcuts overlay lists the keys of the pane the page makes active first", async () => {
        const [container, ziggy] = await renderAppLayoutWithZiggy("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-repo-explorer-link")?.click();
        });
        await screen.findByText("The repo explorer page");
        act(() => {
            elementWithDataId(container, "mock-activate-pane")?.click();
        });
        await act(async () => {
            await ziggy.runRegisteredAction(shortcutsOverlayAction);
        });
        const groups = elementWithDataId(document.body, "shortcuts-overlay-columns")?.querySelectorAll("ul");
        expect(groups?.[0]?.getAttribute("data-id")).toBe("shortcut-group-commit-pane");
        expect(elementWithDataId(document.body, "shortcut-group-commit-pane-title")?.textContent).toBe("Commit pane");
    });

    test("the top bar's keyboard shortcuts button shows the keyboard shortcuts overlay over the layout", async () => {
        const actionZiggy = makeFakeActionZiggy([]);
        const { container } = await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...actionZiggy,
            runAction: jest.fn((name: string) => actionZiggy.runRegisteredAction(name)),
        }, "/repos/graft");
        expect(elementWithDataId(document.body, "shortcuts-overlay")).toBeUndefined();
        await act(async () => {
            elementWithDataId(container, "shortcuts-button")?.click();
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
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).not.toBeUndefined();
        expect(elementWithDataId(container, "right-sidebar-content")).toBeUndefined();
    });

    test("the top bar's menu button minimises the left sidebar and expands it again", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-16")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).toBeUndefined();
        expect(elementWithDataId(container, "left-sidebar-toggle")?.getAttribute("aria-label")).toBe("Expand the left sidebar");
        act(() => {
            elementWithDataId(container, "left-sidebar-toggle")?.click();
        });
        expect(elementWithDataId(container, "left-sidebar")?.classList.contains("w-[260px]")).toBe(true);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).not.toBeUndefined();
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
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).not.toBeUndefined();
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
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link-label")).toBeUndefined();
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

describe("AppLayout's pane steps", () => {
    test("the trail ends with the pane steps the repo explorer page sets, after its own step", async () => {
        const container = await renderAppLayout("/repos/graft");
        act(() => {
            elementWithDataId(container, "left-sidebar-repo-explorer-link")?.click();
        });
        await screen.findByText("The repo explorer page");
        expect(elementWithDataId(container, "breadcrumb-trail")?.textContent).toBe("graftRepo explorer");
        act(() => {
            elementWithDataId(container, "mock-open-pane")?.click();
        });
        expect(elementWithDataId(container, "breadcrumb-trail")?.textContent).toBe("graftRepo explorerCommits");
        expect(elementWithDataId(container, "breadcrumb-pane-commits")?.textContent).toBe("Commits");
    });
});

describe("AppLayout's command palette", () => {
    //
    // Renders the layout with an action list holding Open repo and Copy, so the About page's
    // group and the commit pane's group each have a command, and returns the container and the
    // fake that runs the Command Palette action.
    //
    async function renderWithCommands(): Promise<[HTMLElement, IFakeActionZiggy]> {
        const actionZiggy = makeFakeActionZiggy([
            {
                name: "open-repo",
                label: "Open repo",
                shortcut: "Ctrl+O",
            },
            {
                name: "copy",
                label: "Copy",
                shortcut: "Ctrl+C",
            },
        ]);
        const { container } = await renderFakedAppLayout({
            ...makeFakeThemeZiggy({
                systemTheme: "light",
            }),
            ...actionZiggy,
        }, "/repos/graft");
        return [container, actionZiggy];
    }

    //
    // Runs the Command Palette action and returns the heading of the palette's first group.
    //
    async function firstGroupTitle(ziggy: IFakeActionZiggy): Promise<string | null | undefined> {
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        return elementWithDataId(document.body, "command-palette-list")?.querySelector("[data-id$=\"-title\"]")?.textContent;
    }

    test("the Command Palette action shows the palette with the page's commands first", async () => {
        const [, ziggy] = await renderWithCommands();
        expect(await firstGroupTitle(ziggy)).toBe("About page");
        expect(elementWithDataId(document.body, "command-palette-group-relevant")?.textContent).toContain("Copy");
    });

    test("lists the commands of the active pane the repo explorer page sets first", async () => {
        const [container, ziggy] = await renderWithCommands();
        act(() => {
            elementWithDataId(container, "left-sidebar-repo-explorer-link")?.click();
        });
        await screen.findByText("The repo explorer page");
        act(() => {
            elementWithDataId(container, "mock-activate-pane")?.click();
        });
        expect(await firstGroupTitle(ziggy)).toBe("Commit pane");
    });
});

describe("AppLayout with no repo open", () => {
    test("hides the left sidebar's Repo explorer link and starts the trail with the page", async () => {
        const container = await renderAppLayout(undefined);
        expect(elementWithDataId(container, "left-sidebar-repo-explorer-link")).toBeUndefined();
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
    // Sends the event the Git interface function sends for the command, from a task queued under
    // the source, a pane's name or a page's path.
    //
    function sendCommand(source: string, command: string): void {
        sendTaskEvent({
            taskId: "t1",
            source,
            data: {
                type: "git-command",
                directoryCommand: "cd /repos/graft",
                command,
                durationMs: 4,
            },
        });
    }

    //
    // Selects the pane in the mock repo explorer page, as the page does when the pane becomes
    // active.
    //
    function selectPane(container: HTMLElement, pane: string): void {
        act(() => {
            elementWithDataId(container, `mock-select-${pane}`)?.click();
        });
    }

    test("the right sidebar says the About page has run no Git commands", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This page has run no Git commands.");
    });

    test("the right sidebar shows the selected pane's commands, kept while the sidebar is closed and while another page is open", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendCommand("commit-pane", "git log --max-count=50");
        await openPage(container, "repo-explorer", "The repo explorer page");
        selectPane(container, "commit-pane");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-directory")?.textContent).toBe("cd /repos/graft");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50");

        openRightSidebar(container);
        sendCommand("commit-pane", "git log --max-count=50 abc");
        await openPage(container, "help", "The Help page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This page has run no Git commands.");

        await openPage(container, "repo-explorer", "The repo explorer page");
        selectPane(container, "commit-pane");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50 abc");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git log --max-count=50");
    });

    test("the right sidebar shows the commands of each pane as it becomes selected", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendCommand("commit-pane", "git log --max-count=50");
        sendCommand("commit-details-pane", "git diff-tree abc");
        await openPage(container, "repo-explorer", "The repo explorer page");
        openRightSidebar(container);
        selectPane(container, "commit-pane");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50");
        expect(elementWithDataId(container, "git-command-1")).toBeUndefined();

        selectPane(container, "commit-details-pane");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree abc");
        expect(elementWithDataId(container, "git-command-1")).toBeUndefined();

        selectPane(container, "repo-details-pane");
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This pane has run no Git commands.");
    });

    test("the right sidebar shows the page's commands while the page has no selected pane", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendCommand("/help", "git status");
        await openPage(container, "help", "The Help page");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git status");
    });

    test("ignores a task event that is not a Git command", async () => {
        const container = await renderAppLayout("/repos/graft");
        sendTaskEvent({
            taskId: "t1",
            source: "commit-pane",
            data: {
                type: "output",
            },
        });
        await openPage(container, "repo-explorer", "The repo explorer page");
        selectPane(container, "commit-pane");
        openRightSidebar(container);
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This pane has run no Git commands.");
    });

    test("stops listening for task events when it is removed", async () => {
        await renderAppLayout("/repos/graft");
        expect(taskEventListeners().length).toBe(1);
        cleanup();
        expect(taskEventListeners().length).toBe(0);
    });
});

describe("AppLayout's Help pane", () => {
    //
    // Opens the right sidebar.
    //
    function openRightSidebar(container: HTMLElement): void {
        act(() => {
            elementWithDataId(container, "right-sidebar-toggle")?.click();
        });
    }

    test("the right sidebar shows the Help pane under the Git commands panel", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        const content = elementWithDataId(container, "right-sidebar-content");
        expect(content?.children[0]).toBe(elementWithDataId(container, "git-commands-panel"));
        expect(content?.children[1]).toBe(elementWithDataId(container, "help-pane"));
        expect(elementWithDataId(container, "help-pane-heading")?.textContent).toBe("Help");
    });

    test("the Help pane shows the help of the page shown", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("About");
        act(() => {
            elementWithDataId(container, "left-sidebar-help-link")?.click();
        });
        await screen.findByText("The Help page");
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("Help");
        expect(elementWithDataId(container, "help-pane-description")?.textContent).toBe("This page.");
    });

    test("the Help pane follows the repo explorer page's active pane, and the page once it closes", async () => {
        const container = await renderAppLayout("/repos/graft");
        openRightSidebar(container);
        act(() => {
            elementWithDataId(container, "left-sidebar-repo-explorer-link")?.click();
        });
        await screen.findByText("The repo explorer page");
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("Repo explorer");
        act(() => {
            elementWithDataId(container, "mock-activate-pane")?.click();
        });
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("Commit pane");
        act(() => {
            elementWithDataId(container, "left-sidebar-about-link")?.click();
        });
        await waitFor(() => {
            expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("About");
        });
    });
});
