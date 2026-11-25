//
// Tests the command palette: renders it with a fake window.ziggy that keeps the action handler it
// registers, gives an action list and runs actions, runs the Command Palette action as Ziggy does
// for Ctrl+Shift+P and checks the palette shows the search box with the focus, the selected pane
// or page's commands first and the rest after. It types in the search box and checks the list
// narrows or shows that no command matches, moves the highlight with Up and Down, runs a command with
// Enter and with a click and checks the palette closes, closes it with Escape and checks the search
// is cleared, and checks a list Ziggy cannot read and an action Ziggy cannot run are reported. It
// also checks the handler is removed when the palette goes.
//

import { act, fireEvent, render, RenderResult, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { IActionInfo } from "ziggy";
import { CommandPalette, commandPaletteAction } from "../../components/command-palette";
import { PaneOrPage } from "../../lib/active-pane";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
import { installFakeZiggy } from "../fake-ziggy";

//
// The fake window.ziggy the palette runs with: the action calls and a runAction mock.
//
interface IPaletteZiggy extends IFakeActionZiggy {
    // Records each action the palette runs, resolving or rejecting as the test sets it.
    runAction: jest.Mock;
}

//
// Finds the palette's element with the data-id in the whole document, because MaterialUI draws the
// palette outside the rendered container. Returns undefined when the palette is closed.
//
function paletteElement(dataId: string): HTMLElement | undefined {
    return document.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

//
// An action list like the one Ziggy gives Graft: its own actions, the palette's among them, then a
// standard item of its menu with no shortcut.
//
const graftActions: IActionInfo[] = [
    {
        name: "open-repo",
        label: "Open repo",
        shortcut: "Ctrl+O",
    },
    {
        name: "show-command-palette",
        label: "Command Palette",
        shortcut: "Ctrl+Shift+P",
    },
    {
        name: "toggle-shortcuts-overlay",
        label: "Keyboard Shortcuts",
        shortcut: "?",
    },
    {
        name: "copy",
        label: "Copy",
        shortcut: null,
    },
];

//
// Puts a fake window.ziggy whose listActions gives the action list, or fails with the error, and
// whose runAction resolves, on the window, renders the palette for the pane or page and returns
// the fake and the render once the list has been read.
//
async function renderPaletteWith(actionList: IActionInfo[] | Error, paneOrPage: PaneOrPage | undefined): Promise<[IPaletteZiggy, RenderResult]> {
    const ziggy = installFakeZiggy({
        ...makeFakeActionZiggy(actionList),
        runAction: jest.fn().mockResolvedValue(undefined),
    });
    const rendered = render(createElement(CommandPalette, {
        paneOrPage,
    }));
    //
    // Lets listActions's promise resolve, so the palette has read the list.
    //
    await act(async () => {
    });
    return [ziggy, rendered];
}

//
// Renders the palette on the welcome page with Graft's action list, opens it and returns the fake.
//
async function openPalette(): Promise<IPaletteZiggy> {
    const [ziggy] = await renderPaletteWith(graftActions, "welcome-page");
    await act(async () => {
        await ziggy.runRegisteredAction(commandPaletteAction);
    });
    return ziggy;
}

//
// Types the text into the search box, as a user typing replaces what it holds.
//
function typeSearch(text: string): void {
    const search = paletteElement("command-palette-search");
    expect(search).not.toBeUndefined();
    fireEvent.change(search!, {
        target: {
            value: text,
        },
    });
}

//
// Presses the key in the search box.
//
function pressKey(key: string): void {
    fireEvent.keyDown(paletteElement("command-palette-search")!, {
        key,
    });
}

//
// The names of the highlighted commands.
//
function highlightedNames(): string[] {
    return Array.from(document.querySelectorAll("[role=\"option\"][aria-selected=\"true\"]")).map(row => row.getAttribute("data-id") ?? "");
}

describe("CommandPalette", () => {
    test("is closed until the Command Palette action runs, then shows the search box with the focus", async () => {
        const [ziggy] = await renderPaletteWith(graftActions, "welcome-page");
        expect(paletteElement("command-palette")).toBeUndefined();
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        const search = paletteElement("command-palette-search");
        expect(search?.getAttribute("placeholder")).toBe("Type a command");
        expect(document.activeElement).toBe(search);
    });

    test("lists the page's commands first under its name, then the rest, without its own action", async () => {
        await openPalette();
        expect(paletteElement("command-palette-group-relevant-title")?.textContent).toBe("Welcome page");
        expect(paletteElement("command-palette-group-relevant")?.textContent).toContain("Open repo");
        expect(paletteElement("command-palette-group-other-title")?.textContent).toBe("Other commands");
        expect(paletteElement("command-palette-group-other")?.textContent).toContain("Keyboard Shortcuts");
        expect(paletteElement("command-show-command-palette")).toBeUndefined();
        expect(paletteElement("command-open-repo-keys")?.textContent).toBe("Ctrl+O");
        expect(paletteElement("command-copy-keys")).toBeUndefined();
    });

    test("typing filters the list and shows when no command matches", async () => {
        await openPalette();
        typeSearch("KEY");
        expect(paletteElement("command-toggle-shortcuts-overlay")).not.toBeUndefined();
        expect(paletteElement("command-open-repo")).toBeUndefined();
        expect(paletteElement("command-palette-group-relevant")).toBeUndefined();
        typeSearch("branch");
        expect(paletteElement("command-palette-no-match")?.textContent).toBe("No command matches \"branch\".");
        expect(paletteElement("command-palette-list")).toBeUndefined();
        pressKey("Enter");
        expect(paletteElement("command-palette")).not.toBeUndefined();
    });

    test("highlights the first command, moves the highlight with Up, Down and the mouse and runs it with Enter", async () => {
        const ziggy = await openPalette();
        expect(highlightedNames()).toEqual(["command-open-repo"]);
        pressKey("ArrowDown");
        expect(highlightedNames()).toEqual(["command-toggle-shortcuts-overlay"]);
        pressKey("ArrowDown");
        pressKey("ArrowDown");
        expect(highlightedNames()).toEqual(["command-copy"]);
        pressKey("ArrowUp");
        expect(highlightedNames()).toEqual(["command-toggle-shortcuts-overlay"]);
        pressKey("a");
        expect(highlightedNames()).toEqual(["command-toggle-shortcuts-overlay"]);
        fireEvent.mouseMove(paletteElement("command-copy")!);
        expect(highlightedNames()).toEqual(["command-copy"]);
        fireEvent.mouseMove(paletteElement("command-toggle-shortcuts-overlay")!);
        await act(async () => {
            pressKey("Enter");
        });
        expect(ziggy.runAction).toHaveBeenCalledWith("toggle-shortcuts-overlay");
        await waitFor(() => expect(paletteElement("command-palette")).toBeUndefined());
    });

    test("typing moves the highlight back to the first command shown", async () => {
        await openPalette();
        pressKey("ArrowDown");
        typeSearch("o");
        expect(highlightedNames()).toEqual(["command-open-repo"]);
    });

    test("a click runs the clicked command and closes the palette", async () => {
        const ziggy = await openPalette();
        await act(async () => {
            paletteElement("command-copy")?.click();
        });
        expect(ziggy.runAction).toHaveBeenCalledWith("copy");
        await waitFor(() => expect(paletteElement("command-palette")).toBeUndefined());
    });

    test("Escape closes the palette, runs no command and clears the search", async () => {
        const ziggy = await openPalette();
        typeSearch("copy");
        fireEvent.keyDown(paletteElement("command-palette-search")!, {
            key: "Escape",
        });
        await waitFor(() => expect(paletteElement("command-palette")).toBeUndefined());
        expect(ziggy.runAction).not.toHaveBeenCalled();
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        const search = paletteElement("command-palette-search");
        expect(search instanceof HTMLInputElement && search.value).toBe("");
        expect(highlightedNames()).toEqual(["command-open-repo"]);
    });

    test("shows why an action could not be run, and clears it when opened again", async () => {
        const ziggy = await openPalette();
        ziggy.runAction.mockRejectedValue(new Error("UnknownAction"));
        await act(async () => {
            paletteElement("command-copy")?.click();
        });
        await waitFor(() => expect(paletteElement("command-palette-run-error")?.textContent).toBe("Graft could not run \"Copy\": Error: UnknownAction. Ziggy's log has the details."));
        fireEvent.keyDown(paletteElement("command-palette-search")!, {
            key: "Escape",
        });
        await waitFor(() => expect(paletteElement("command-palette")).toBeUndefined());
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        expect(paletteElement("command-palette-run-error")).toBeUndefined();
    });

    test("shows why the list could not be read in its place", async () => {
        const [ziggy] = await renderPaletteWith(new Error("the bridge is down"), "welcome-page");
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        expect(paletteElement("command-palette-error")?.textContent).toBe("Graft could not read its commands from Ziggy: Error: the bridge is down. Ziggy's log has the details.");
        expect(paletteElement("command-palette-list")).toBeUndefined();
        expect(paletteElement("command-palette-no-match")).toBeUndefined();
    });

    test("lists every command under one heading with no pane or page selected", async () => {
        const [ziggy] = await renderPaletteWith(graftActions, undefined);
        await act(async () => {
            await ziggy.runRegisteredAction(commandPaletteAction);
        });
        expect(paletteElement("command-palette-group-relevant")).toBeUndefined();
        expect(paletteElement("command-palette-group-other-title")?.textContent).toBe("Commands");
    });

    test("removes its action handler when it goes", async () => {
        const [ziggy, rendered] = await renderPaletteWith(graftActions, "welcome-page");
        expect(ziggy.hasRegisteredAction(commandPaletteAction)).toBe(true);
        rendered.unmount();
        expect(ziggy.hasRegisteredAction(commandPaletteAction)).toBe(false);
    });
});
