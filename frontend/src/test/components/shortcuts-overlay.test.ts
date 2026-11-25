//
// Tests the keyboard shortcuts overlay: renders it with a fake window.ziggy that keeps the action
// handler it registers and gives an action list, runs the Keyboard Shortcuts action as Ziggy does
// for the `?` shortcut, presses Escape, clicks outside the overlay and clicks its close button,
// then checks when the overlay shows and when it has gone. It checks the overlay lists the
// shortcuts of the action list in one column, that its search box has the focus and filters them
// and that a list Ziggy cannot read is reported. It presses Ctrl+/ on the page, in a text box and in the search box and checks
// it opens and closes the overlay without typing, and that Ctrl+Shift+/ leaves it closed. It holds
// Ctrl+/ with its repeats sent as keyups and keydowns with `repeat` false, as WebKitGTK sends
// them on some Linux desktops, and checks the overlay opens once and stays open, and that releasing
// Control, a key with Control up or the window losing the focus allow the next Ctrl+/. It also
// checks the handler and the Ctrl+/ listeners are removed when the overlay goes. With an active
// pane it checks the pane's keys come first under the pane's name, that the search filters both
// groups and hides an empty one and that another active pane puts its group first.
//

import { act, fireEvent, render, waitFor } from "@testing-library/react";
import { createElement, ReactElement } from "react";
import type { IActionInfo } from "ziggy";
import { ShortcutsOverlay, shortcutsOverlayAction } from "../../components/shortcuts-overlay";
import { PaneOrPage } from "../../lib/active-pane";
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
// error, on the window, renders the overlay with no selected pane or page and returns the fake once the list
// has been read.
//
async function renderShortcutsOverlayWith(actionList: IActionInfo[] | Error): Promise<IFakeActionZiggy> {
    const ziggy = installFakeZiggy(makeFakeActionZiggy(actionList));
    await act(async () => {
        render(createElement(ShortcutsOverlay, {
            paneOrPage: undefined,
        }));
    });
    return ziggy;
}

//
// The overlay rendered with an active pane, and how to change the pane.
//
interface IPaneOverlay {
    // The fake window.ziggy the overlay reads.
    ziggy: IFakeActionZiggy;

    // Renders the overlay again with the active pane.
    setPaneOrPage(pane: PaneOrPage | undefined): void;
}

//
// Puts a fake action window.ziggy with Graft's action list on the window and renders the overlay
// with the active pane. Returns the fake and a function that renders the overlay again with
// another active pane, as the layout does when the pane changes.
//
async function renderShortcutsOverlayForPane(paneOrPage: PaneOrPage): Promise<IPaneOverlay> {
    const ziggy = installFakeZiggy(makeFakeActionZiggy(graftActions));
    let rerender = (_element: ReactElement): void => {};
    await act(async () => {
        rerender = render(createElement(ShortcutsOverlay, {
            paneOrPage,
        })).rerender;
    });
    return {
        ziggy,
        setPaneOrPage: pane => {
            act(() => {
                rerender(createElement(ShortcutsOverlay, {
                    paneOrPage: pane,
                }));
            });
        },
    };
}

//
// The data-ids of the groups the overlay shows, in order.
//
function shownGroups(): string[] {
    const list = overlayElement("shortcuts-overlay-columns");
    expect(list).not.toBeUndefined();
    return Array.from(list?.querySelectorAll("ul") ?? []).map(group => group.getAttribute("data-id") ?? "");
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
// The data-ids of the shortcuts the overlay's list shows, in order.
//
function shownShortcuts(): string[] {
    const list = overlayElement("shortcuts-overlay-columns");
    expect(list).not.toBeUndefined();
    return Array.from(list?.querySelectorAll("li") ?? []).map(row => row.getAttribute("data-id") ?? "");
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
// Presses Ctrl+/ on the element as a user does, the key giving `/` with Control held, and returns
// whether the key was kept from doing anything else.
//
function pressCtrlSlash(target: Element): boolean {
    let wasNotPrevented = true;
    act(() => {
        wasNotPrevented = fireEvent.keyDown(target, {
            key: "/",
            ctrlKey: true,
        });
    });
    return !wasNotPrevented;
}

//
// Releases the slash key with Control still held, as WebKitGTK sends each repeat of a held
// Ctrl+/ on some Linux desktops: a keyup of `/`, then a keydown like a new press.
//
function releaseSlashKey(target: Element): void {
    act(() => {
        fireEvent.keyUp(target, {
            key: "/",
            ctrlKey: true,
        });
    });
}

//
// Releases Control, which ends one press of Ctrl+/. The keyup of Control still has Control held,
// as WebKitGTK sends it.
//
function releaseControl(target: Element): void {
    act(() => {
        fireEvent.keyUp(target, {
            key: "Control",
            ctrlKey: true,
        });
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
        expect(shownShortcuts()).toEqual(["shortcut-open-repo", "shortcut-toggle-shortcuts-overlay", "shortcut-toggle-shortcuts-overlay-ctrl", "shortcut-quit"]);
        expect(overlayElement("shortcut-open-repo-label")?.textContent).toBe("Open repo");
        expect(overlayElement("shortcut-open-repo-keys")?.textContent).toBe("Ctrl+O");
        expect(overlayElement("shortcut-toggle-shortcuts-overlay-keys")?.textContent).toBe("?");
        expect(overlayElement("shortcut-toggle-shortcuts-overlay-ctrl-label")?.textContent).toBe("Keyboard Shortcuts");
        expect(overlayElement("shortcut-toggle-shortcuts-overlay-ctrl-keys")?.textContent).toBe("Ctrl+/");
        expect(overlayElement("shortcut-quit-label")?.textContent).toBe("Quit");
        expect(overlayElement("shortcuts-overlay-no-match")).toBeUndefined();
        expect(overlayElement("shortcuts-overlay-error")).toBeUndefined();
    });

    test("lists every shortcut in one column, however many there are", async () => {
        const actions = makeActions(20);
        const ziggy = await renderShortcutsOverlayWith(actions);
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-columns")?.querySelectorAll("ul").length).toBe(1);
        expect(shownShortcuts()).toEqual(actions.map(action => `shortcut-${action.name}`));
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
        expect(shownShortcuts()).toEqual(["shortcut-open-repo"]);
    });

    test("typing in the search box filters the shortcuts by keys", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("ctrl+q");
        expect(shownShortcuts()).toEqual(["shortcut-quit"]);
    });

    test("a ? typed in the search box is kept, filters to the ? shortcut and leaves the overlay open", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("?");
        expect((overlayElement("shortcuts-overlay-search") as HTMLInputElement | undefined)?.value).toBe("?");
        expect(shownShortcuts()).toEqual(["shortcut-toggle-shortcuts-overlay"]);
        expect(overlayElement("shortcuts-overlay")).not.toBeUndefined();
    });

    test("a / typed in the search box filters to the Ctrl+/ shortcut", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("/");
        expect(shownShortcuts()).toEqual(["shortcut-toggle-shortcuts-overlay-ctrl"]);
    });

    test("a search that matches no shortcut says so", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("branch");
        expect(shownShortcuts()).toEqual([]);
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
        expect(shownShortcuts()).toEqual(["shortcut-open-repo", "shortcut-toggle-shortcuts-overlay", "shortcut-toggle-shortcuts-overlay-ctrl", "shortcut-quit"]);
    });

    test("an action list Ziggy cannot read is reported in the overlay", async () => {
        const ziggy = await renderShortcutsOverlayWith(new Error("UnknownSystemMessage"));
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-error")?.textContent).toBe("Graft could not read its keyboard shortcuts from Ziggy: Error: UnknownSystemMessage. Ziggy's log has the details.");
        expect(overlayElement("shortcuts-overlay-no-match")).toBeUndefined();
        expect(shownShortcuts()).toEqual([]);
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

    test("a click outside the overlay closes it and clears the search", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("open");
        const outside = overlayElement("shortcuts-overlay-outside");
        expect(outside).not.toBeUndefined();
        act(() => {
            fireEvent.mouseDown(outside ?? document.body);
            fireEvent.click(outside ?? document.body);
        });
        await waitForClosedOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-search")).toHaveProperty("value", "");
    });

    test("a click inside the overlay leaves it open", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        const list = overlayElement("shortcuts-overlay-columns");
        expect(list).not.toBeUndefined();
        act(() => {
            fireEvent.mouseDown(list ?? document.body);
            fireEvent.click(list ?? document.body);
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

    test("the title row has a close button at its right with a Close tooltip", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        const title = overlayElement("shortcuts-overlay-title");
        const close = overlayElement("shortcuts-overlay-close");
        expect(close).not.toBeUndefined();
        expect(title?.lastElementChild).toBe(close);
        expect(close?.getAttribute("aria-label")).toBe("Close");
        act(() => {
            fireEvent.mouseOver(close ?? document.body);
        });
        await waitFor(() => {
            expect(document.querySelector("[role=\"tooltip\"]")?.textContent).toBe("Close");
        });
    });

    test("a click on the close button closes the overlay and clears the search", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("open");
        const close = overlayElement("shortcuts-overlay-close");
        expect(close).not.toBeUndefined();
        act(() => {
            fireEvent.click(close ?? document.body);
        });
        await waitForClosedOverlay();
        await pressQuestionMark(ziggy);
        expect(overlayElement("shortcuts-overlay-search")).toHaveProperty("value", "");
        expect(shownShortcuts()).toEqual(["shortcut-open-repo", "shortcut-toggle-shortcuts-overlay", "shortcut-toggle-shortcuts-overlay-ctrl", "shortcut-quit"]);
    });

    test("Ctrl+/ on the page shows the overlay and keeps the key from doing anything else", async () => {
        await renderShortcutsOverlay();
        expect(pressCtrlSlash(document.body)).toBe(true);
        expect(overlayElement("shortcuts-overlay-search")).not.toBeUndefined();
    });

    test("Ctrl+/ again, after Control is released, closes the overlay", async () => {
        await renderShortcutsOverlay();
        pressCtrlSlash(document.body);
        releaseSlashKey(document.body);
        releaseControl(document.body);
        pressCtrlSlash(document.body);
        await waitForClosedOverlay();
    });

    test("a held Ctrl+/ whose repeats come as keyups and keydowns with repeat false opens the overlay once and leaves it open", async () => {
        await renderShortcutsOverlay();
        expect(pressCtrlSlash(document.body)).toBe(true);
        for (let repeatIndex = 0; repeatIndex < 5; repeatIndex += 1) {
            releaseSlashKey(document.body);
            expect(pressCtrlSlash(document.body)).toBe(true);
        }
        releaseSlashKey(document.body);
        releaseControl(document.body);
        //
        // A closed overlay stays on the page until MaterialUI's closing transition ends, so the
        // test waits longer than that transition before it checks the overlay is still there.
        //
        await act(async () => {
            await new Promise(resolve => setTimeout(resolve, 500));
        });
        expect(overlayElement("shortcuts-overlay-search")).not.toBeUndefined();
    });

    test("a key pressed with Control up allows the next Ctrl+/ to close the overlay", async () => {
        await renderShortcutsOverlay();
        pressCtrlSlash(document.body);
        act(() => {
            fireEvent.keyDown(document.body, {
                key: "a",
            });
        });
        pressCtrlSlash(document.body);
        await waitForClosedOverlay();
    });

    test("the window losing the focus allows the next Ctrl+/ to close the overlay", async () => {
        await renderShortcutsOverlay();
        pressCtrlSlash(document.body);
        act(() => {
            fireEvent.blur(window);
        });
        pressCtrlSlash(document.body);
        await waitForClosedOverlay();
    });

    test("Ctrl+/ with the focus in a text box shows the overlay and types nothing", async () => {
        await renderShortcutsOverlay();
        const textBox = document.createElement("input");
        textBox.type = "text";
        textBox.value = "abc";
        document.body.appendChild(textBox);
        textBox.focus();
        expect(pressCtrlSlash(textBox)).toBe(true);
        expect(textBox.value).toBe("abc");
        expect(overlayElement("shortcuts-overlay-search")).not.toBeUndefined();
        textBox.remove();
    });

    test("Ctrl+/ in the overlay's search box closes the overlay and types nothing", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        typeSearch("open");
        const search = overlayElement("shortcuts-overlay-search");
        expect(search).not.toBeUndefined();
        expect(pressCtrlSlash(search ?? document.body)).toBe(true);
        expect(search).toHaveProperty("value", "open");
        await waitForClosedOverlay();
    });

    test("Ctrl+Shift+/, which gives ? with Control held on a US layout, leaves the overlay closed and the key to its default", async () => {
        await renderShortcutsOverlay();
        let wasNotPrevented = false;
        act(() => {
            wasNotPrevented = fireEvent.keyDown(document.body, {
                key: "?",
                ctrlKey: true,
                shiftKey: true,
            });
        });
        expect(wasNotPrevented).toBe(true);
        expect(overlayElement("shortcuts-overlay")).toBeUndefined();
    });

    test("? without Control is left to Ziggy, so the overlay's own listener does nothing with it", async () => {
        await renderShortcutsOverlay();
        let wasNotPrevented = false;
        act(() => {
            wasNotPrevented = fireEvent.keyDown(document.body, {
                key: "?",
                shiftKey: true,
            });
        });
        expect(wasNotPrevented).toBe(true);
        expect(overlayElement("shortcuts-overlay")).toBeUndefined();
    });

    test("stops listening for Ctrl+/ when the overlay goes", async () => {
        installFakeZiggy(makeFakeActionZiggy(graftActions));
        let unmount = (): void => {};
        await act(async () => {
            unmount = render(createElement(ShortcutsOverlay, {
                paneOrPage: undefined,
            })).unmount;
        });
        unmount();
        expect(pressCtrlSlash(document.body)).toBe(false);
    });

    test("removes the action's handler when the overlay goes", async () => {
        const ziggy = installFakeZiggy(makeFakeActionZiggy(graftActions));
        let unmount = (): void => {};
        await act(async () => {
            unmount = render(createElement(ShortcutsOverlay, {
                paneOrPage: undefined,
            })).unmount;
        });
        unmount();
        expect(ziggy.hasRegisteredAction(shortcutsOverlayAction)).toBe(false);
    });

    test("with no active pane lists the shortcuts in one group headed General", async () => {
        const ziggy = await renderShortcutsOverlay();
        await pressQuestionMark(ziggy);
        expect(shownGroups()).toEqual(["shortcut-group-general"]);
        expect(overlayElement("shortcut-group-general-title")?.textContent).toBe("General");
        expect(overlayElement("shortcut-group-general")?.getAttribute("aria-label")).toBe("General");
    });

    test("lists the commit pane's keys first, under its name, then the General group", async () => {
        const { ziggy } = await renderShortcutsOverlayForPane("commit-pane");
        await pressQuestionMark(ziggy);
        expect(shownGroups()).toEqual(["shortcut-group-commit-pane", "shortcut-group-general"]);
        expect(overlayElement("shortcut-group-commit-pane-title")?.textContent).toBe("Commit pane");
        expect(shownShortcuts()).toEqual([
            "shortcut-commits-arrowup",
            "shortcut-commits-arrowdown",
            "shortcut-commits-arrowleft",
            "shortcut-commits-arrowright",
            "shortcut-commits-enter",
            "shortcut-commits-escape",
            "shortcut-open-repo",
            "shortcut-toggle-shortcuts-overlay",
            "shortcut-toggle-shortcuts-overlay-ctrl",
            "shortcut-quit",
        ]);
        expect(overlayElement("shortcut-commits-arrowup-label")?.textContent).toBe("Select the commit above");
        expect(overlayElement("shortcut-commits-arrowup-keys")?.textContent).toBe("Up");
        expect(overlayElement("shortcut-commits-enter-keys")?.textContent).toBe("Enter");
    });

    test("another active pane puts its group first", async () => {
        const { ziggy, setPaneOrPage } = await renderShortcutsOverlayForPane("commit-pane");
        setPaneOrPage("file-pane");
        await pressQuestionMark(ziggy);
        expect(shownGroups()).toEqual(["shortcut-group-file-pane", "shortcut-group-general"]);
        expect(overlayElement("shortcut-group-file-pane-title")?.textContent).toBe("File pane");
        expect(shownShortcuts().slice(0, 2)).toEqual(["shortcut-file-arrowleft", "shortcut-file-escape"]);
        setPaneOrPage(undefined);
        expect(shownGroups()).toEqual(["shortcut-group-general"]);
    });

    test("the search filters every group and hides a group with no match", async () => {
        const { ziggy } = await renderShortcutsOverlayForPane("commit-pane");
        await pressQuestionMark(ziggy);
        typeSearch("ENTER");
        expect(shownGroups()).toEqual(["shortcut-group-commit-pane"]);
        expect(shownShortcuts()).toEqual(["shortcut-commits-enter"]);
        typeSearch("o");
        expect(shownGroups()).toEqual(["shortcut-group-commit-pane", "shortcut-group-general"]);
        typeSearch("quit");
        expect(shownGroups()).toEqual(["shortcut-group-general"]);
        expect(shownShortcuts()).toEqual(["shortcut-quit"]);
    });

    test("a search that matches no shortcut in any group says so", async () => {
        const { ziggy } = await renderShortcutsOverlayForPane("commit-pane");
        await pressQuestionMark(ziggy);
        typeSearch("branch");
        expect(shownGroups()).toEqual([]);
        expect(overlayElement("shortcuts-overlay-no-match")?.textContent).toBe("No shortcut matches \"branch\".");
    });
});
