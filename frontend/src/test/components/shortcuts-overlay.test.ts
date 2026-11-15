//
// Tests the keyboard shortcuts overlay: renders it with a fake window.ziggy that keeps the action
// handler it registers and gives an action list, runs the Keyboard Shortcuts action as Ziggy does
// for the `?` shortcut and presses Escape and clicks outside the overlay, then checks when the
// overlay shows and when it has gone. It checks the overlay lists the shortcuts of the action list
// in columns, that its search box has the focus and filters them, and that a list Ziggy cannot read
// is reported. It also checks the handler is removed when the overlay goes.
//

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import type { IActionInfo } from "ziggy";
import { ShortcutsOverlay, shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { SHORTCUT_COLUMN_ROW_COUNT_MAX } from "../../lib/shortcuts";
import { IFakeActionZiggy, makeFakeActionZiggy } from "../fake-action-ziggy";
import { installFakeZiggy } from "../fake-ziggy";

//
// Finds the overlay's element with the data-id in the whole document, because MaterialUI draws the
// overlay outside the rendered container. Returns undefined when the overlay is closed.
//
function overlayElement(dataId: string): HTMLElement | undefined {
    return document.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

//
// An action list like the one Ziggy gives Graft on Linux: Graft's own actions first, then standard
// items of its menu, one of them with no shortcut.
//
const graftActions: IActionInfo[] = [
    {
        name: "open-repo",
        label: "Open repo",
        shortcut: "Ctrl+O",
    },
    {
        name: "toggle-shortcuts-overlay",
        label: "Keyboard Shortcuts",
        shortcut: "?",
    },
    {
        name: "about",
        label: "About",
        shortcut: null,
    },
    {
        name: "quit",
        label: "Quit",
        shortcut: "Ctrl+Q",
    },
];

//
// Puts a fake action window.ziggy whose listActions gives the action list, or fails with the
// error, on the window, renders the overlay and returns the fake once the list has been read.
//
async function renderShortcutsOverlayWith(actionList: IActionInfo[] | Error): Promise<IFakeActionZiggy> {
    const ziggy = installFakeZiggy(makeFakeActionZiggy(actionList));
    await act(async () => {
        render(createElement(ShortcutsOverlay));
    });
    return ziggy;
}

//
// Renders the overlay with Graft's action list and returns the fake window.ziggy.
//
async function renderShortcutsOverlay(): Promise<IFakeActionZiggy> {
    return renderShortcutsOverlayWith(graftActions);
}

//
// Types the text into the overlay's search box, as a user typing replaces what it holds.
//
function typeSearch(text: string): void {
    const search = overlayElement("shortcuts-overlay-search");
    expect(search).not.toBeUndefined();
    act(() => {
        fireEvent.change(search ?? document.body, {
            target: {
                value: text,
            },
        });
    });
}

//
// The data-ids of the shortcuts in each of the overlay's columns, in order.
//
function shownColumns(): string[][] {
    const columns = overlayElement("shortcuts-overlay-columns");
    expect(columns).not.toBeUndefined();
    return Array.from(columns?.children ?? []).map(column => Array.from(column.children).map(row => row.getAttribute("data-id") ?? ""));
}

//
// Makes the number of actions given, each with a shortcut, named action-0, action-1 and so on.
//
function makeActions(count: number): IActionInfo[] {
    const actions: IActionInfo[] = [];
    for (let index = 0; index < count; index += 1) {
        actions.push({
            name: `action-${index}`,
            label: `Action ${index}`,
            shortcut: `Ctrl+${index}`,
        });
    }
    return actions;
}

//
// Runs the Keyboard Shortcuts action as Ziggy does when the user presses `?`.
//
async function pressQuestionMark(ziggy: IFakeActionZiggy): Promise<void> {
    await act(async () => {
        await ziggy.runRegisteredAction(shortcutsOverlayAction);
    });
}

//
// Waits until the overlay has gone from the page, once its closing transition has ended.
//
async function waitForClosedOverlay(): Promise<void> {
    await waitFor(() => {
        expect(overlayElement("shortcuts-overlay")).toBeUndefined();
    });
}

describe("ShortcutsOverlay", () => {
    test("names the backend's Keyboard Shortcuts action", () => {
        expect(shortcutsOverlayAction).toBe("toggle-shortcuts-overlay");
    });

    test("starts closed with the Keyboard Shortcuts action's handler registered", async () => {
        const ziggy = await renderShortcutsOverlay();
        expect(ziggy.hasRegisteredAction(shortcutsOverlayAction)).toBe(true);
        expect(overlayElement("shortcuts-overlay")).toBeUndefined();
    });

    test("the action shows the overlay with its title and the shortcuts of Ziggy's action list, starting with Ctrl+O", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay")).not.toBeUndefined();
        expect(overlayElement("shortcuts-overlay-title")?.textContent).toBe("Keyboard shortcuts");
        expect(shownColumns()).toEqual([["shortcut-open-repo", "shortcut-toggle-shortcuts-overlay", "shortcut-quit"]]);
        expect(overlayElement("shortcut-open-repo-label")?.textContent).toBe("Open repo");
        expect(overlayElement("shortcut-open-repo-keys")?.textContent).toBe("Ctrl+O");
        expect(overlayElement("shortcut-toggle-shortcuts-overlay-keys")?.textContent).toBe("?");
        expect(overlayElement("shortcut-quit-label")?.textContent).toBe("Quit");
        expect(overlayElement("shortcuts-overlay-no-match")).toBeUndefined();
        expect(overlayElement("shortcuts-overlay-error")).toBeUndefined();
    });

    test("shortcuts that fill a column carry on in the next column", async () => {
        const ziggy = await renderShortcutsOverlayWith(makeActions(SHORTCUT_COLUMN_ROW_COUNT_MAX + 2));
        await pressQuestionMark(ziggy);
        const columns = shownColumns();
        expect(columns.map(column => column.length)).toEqual([SHORTCUT_COLUMN_ROW_COUNT_MAX, 2]);
        expect(columns[1]).toEqual([`shortcut-action-${SHORTCUT_COLUMN_ROW_COUNT_MAX}`, `shortcut-action-${SHORTCUT_COLUMN_ROW_COUNT_MAX + 1}`]);
    });

    test("the search box has the focus when the overlay opens", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        expect(document.activeElement).toBe(overlayElement("shortcuts-overlay-search"));
    });

    test("the search box has spelling correction off", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        const search = overlayElement("shortcuts-overlay-search");
        expect(search?.getAttribute("spellcheck")).toBe("false");
        expect(search?.getAttribute("autocorrect")).toBe("off");
    });

    test("typing in the search box filters the shortcuts by label", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("open");
        expect(shownColumns()).toEqual([["shortcut-open-repo"]]);
    });

    test("typing in the search box filters the shortcuts by keys", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("ctrl+q");
        expect(shownColumns()).toEqual([["shortcut-quit"]]);
    });

    test("a ? typed in the search box is kept, filters to the ? shortcut and leaves the overlay open", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("?");
        expect((overlayElement("shortcuts-overlay-search") as HTMLInputElement | undefined)?.value).toBe("?");
        expect(shownColumns()).toEqual([["shortcut-toggle-shortcuts-overlay"]]);
        expect(overlayElement("shortcuts-overlay")).not.toBeUndefined();
    });

    test("a search that matches no shortcut says so", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("branch");
        expect(shownColumns()).toEqual([]);
        expect(overlayElement("shortcuts-overlay-no-match")?.textContent).toBe("No shortcut matches \"branch\".");
    });

    test("the search is cleared once the overlay has closed", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("open");
        await pressQuestionMark(ziggy);
        await waitForClosedOverlay();
        await pressQuestionMark(ziggy);
        expect((overlayElement("shortcuts-overlay-search") as HTMLInputElement | undefined)?.value).toBe("");
        expect(shownColumns()).toEqual([["shortcut-open-repo", "shortcut-toggle-shortcuts-overlay", "shortcut-quit"]]);
    });

    test("an action list Ziggy cannot read is reported in the overlay", async () => {
        const ziggy = await renderShortcutsOverlayWith(new Error("UnknownSystemMessage"));
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-error")?.textContent).toBe("Graft could not read its keyboard shortcuts from Ziggy: Error: UnknownSystemMessage. Ziggy's log has the details.");
        expect(overlayElement("shortcuts-overlay-no-match")).toBeUndefined();
        expect(shownColumns()).toEqual([]);
    });

    test("running the action again closes the overlay, and a third time shows it again", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        await pressQuestionMark(ziggy);
        await waitForClosedOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-search")).not.toBeUndefined();
    });

    test("Escape in the search box closes the overlay", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("?");
        const search = overlayElement("shortcuts-overlay-search");
        expect(search).not.toBeUndefined();
        act(() => {
            fireEvent.keyDown(search ?? document.body, {
                key: "Escape",
            });
        });
        await waitForClosedOverlay();
    });

    test("a click outside the overlay leaves it open", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        const backdrop = document.querySelector<HTMLElement>(".MuiBackdrop-root");
        expect(backdrop).not.toBeNull();
        act(() => {
            fireEvent.mouseDown(backdrop ?? document.body);
            fireEvent.click(backdrop ?? document.body);
        });

        //
        // A closing overlay stays on the page until its closing transition ends, which the Escape
        // test sees happen within waitFor's second, so the overlay is checked after that second.
        //
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 1000));
        });
        expect(overlayElement("shortcuts-overlay-search")).not.toBeUndefined();
    });

    test("removes the action's handler when the overlay goes", async () => {
        const ziggy = installFakeZiggy(makeFakeActionZiggy(graftActions));
        let unmount = (): void => {};
        await act(async () => {
            unmount = render(createElement(ShortcutsOverlay)).unmount;
        });
        unmount();
        expect(ziggy.hasRegisteredAction(shortcutsOverlayAction)).toBe(false);
    });
});
