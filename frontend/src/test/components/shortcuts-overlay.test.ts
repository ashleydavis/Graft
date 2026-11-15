//
// Tests the keyboard shortcuts overlay: renders it with a fake window.ziggy that keeps the action
// handler it registers, runs the Keyboard Shortcuts action as Ziggy does for the `?` shortcut and
// presses Escape and clicks outside the overlay, then checks when the overlay shows with its
// placeholder text and when it has gone. It also checks the handler is removed when the overlay
// goes.
//

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ShortcutsOverlay, shortcutsOverlayAction } from "../../components/shortcuts-overlay";
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
// Puts a fake action window.ziggy on the window, renders the overlay and returns the fake.
//
function renderShortcutsOverlay(): IFakeActionZiggy {
    const ziggy = installFakeZiggy(makeFakeActionZiggy());
    render(createElement(ShortcutsOverlay));
    return ziggy;
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

    test("starts closed with the Keyboard Shortcuts action's handler registered", () => {
        const ziggy = renderShortcutsOverlay();
        expect(ziggy.hasRegisteredAction(shortcutsOverlayAction)).toBe(true);
        expect(overlayElement("shortcuts-overlay")).toBeUndefined();
    });

    test("the action shows the overlay with its title and placeholder text", async () => {
        const ziggy = renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay")).not.toBeUndefined();
        expect(overlayElement("shortcuts-overlay-title")?.textContent).toBe("Keyboard shortcuts");
        expect(overlayElement("shortcuts-overlay-placeholder")?.textContent).toBe("Placeholder: Graft's keyboard shortcuts are listed here.");
    });

    test("running the action again closes the overlay, and a third time shows it again", async () => {
        const ziggy = renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        await pressQuestionMark(ziggy);
        await waitForClosedOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-placeholder")).not.toBeUndefined();
    });

    test("Escape closes the overlay", async () => {
        const ziggy = renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        const placeholder = overlayElement("shortcuts-overlay-placeholder");
        expect(placeholder).not.toBeUndefined();
        act(() => {
            fireEvent.keyDown(placeholder ?? document.body, {
                key: "Escape",
            });
        });
        await waitForClosedOverlay();
    });

    test("a click outside the overlay leaves it open", async () => {
        const ziggy = renderShortcutsOverlay();
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
        expect(overlayElement("shortcuts-overlay-placeholder")).not.toBeUndefined();
    });

    test("removes the action's handler when the overlay goes", () => {
        const ziggy = installFakeZiggy(makeFakeActionZiggy());
        const { unmount } = render(createElement(ShortcutsOverlay));
        unmount();
        expect(ziggy.hasRegisteredAction(shortcutsOverlayAction)).toBe(false);
    });
});
