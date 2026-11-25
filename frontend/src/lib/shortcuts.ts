//
// Works out what the keyboard shortcuts overlay lists from Ziggy's action list and the active
// pane's keys: the groups of shortcuts and those a search matches.
//

import type { IActionInfo } from "ziggy";
import { PaneOrPage, PANE_OR_PAGE_NAMES } from "./active-pane";
import { PANE_KEYS } from "./pane-keys";

//
// One keyboard shortcut the overlay lists: an action of Graft's, or a standard item of its menu,
// that has a shortcut.
//
export interface IShortcut {
    // The name the action is run by, which the overlay builds the row's data-id from.
    name: string;

    // The action's label, such as "Open repo".
    label: string;

    // The keys as the platform shows them, such as "Ctrl+O" on Linux and Windows or "⌘O" on
    // macOS.
    keys: string;
}

//
// Picks the actions from window.ziggy.listActions that have a shortcut, in the order Ziggy lists
// them, so the overlay lists only actions a key runs. Ziggy lists the app's own actions first, so
// Open repo's Ctrl+O comes first.
//
export function actionShortcuts(actions: IActionInfo[]): IShortcut[] {
    const shortcuts: IShortcut[] = [];
    for (const action of actions) {
        if (action.shortcut) {
            shortcuts.push({
                name: action.name,
                label: action.label,
                keys: action.shortcut,
            });
        }
    }
    return shortcuts;
}

//
// Picks the shortcuts whose label or keys contain the search text, ignoring case, in their order,
// so the overlay's search box filters the list. Empty search text matches every shortcut.
//
export function matchingShortcuts(shortcuts: IShortcut[], searchText: string): IShortcut[] {
    const wanted = searchText.toLowerCase();
    return shortcuts.filter(shortcut => {
        if (shortcut.label.toLowerCase().includes(wanted)) {
            return true;
        }
        return shortcut.keys.toLowerCase().includes(wanted);
    });
}

//
// Splits a shortcut's keys, as the platform shows them, into the keys pressed together, so the
// overlay draws each one as a key cap: "Ctrl+Shift+P" gives Ctrl, Shift and P. A shortcut whose
// last key is the plus key, such as "Ctrl++", keeps it as a key of its own, and "+" alone is the
// plus key. Keys with no "+" between them, such as macOS's "⌘O", are one key cap.
//
export function shortcutKeyNames(keys: string): string[] {
    if (keys === "+") {
        return ["+"];
    }
    if (keys.endsWith("++")) {
        return [...keys.slice(0, -2).split("+"), "+"];
    }
    return keys.split("+");
}

//
// The keys of the second shortcut that shows and closes the keyboard shortcuts overlay, as Graft
// writes them on every platform. Ziggy's shortcut syntax refuses `/` as a key, so Graft matches
// this one itself, and the overlay and the top bar's reminder show it from here.
//
export const shortcutsOverlayCtrlKeys = "Ctrl+/";

//
// The parts of a key press that decide whether it is Ctrl+/.
//
export interface IKeyPress {
    // The character the key gives, such as "/".
    key: string;

    // Whether Control is held.
    ctrlKey: boolean;

    // Whether Alt (Option on macOS) is held.
    altKey: boolean;

    // Whether Command on macOS, or the Windows or Super key elsewhere, is held.
    metaKey: boolean;

    // Whether the press is the key repeating while it is held down.
    repeat: boolean;
}

//
// Works out whether a key press is Ctrl+/, for the shortcuts overlay's keydown listener: the key
// gives `/` with Control held and neither Alt nor Command. Shift may be up or down, because whether
// `/` needs Shift depends on the keyboard layout. Only the first press counts and its repeats are
// left alone, so holding the keys opens or closes the overlay once.
//
export function isShortcutsOverlayCtrlKey(press: IKeyPress): boolean {
    if (press.key === "/") {
        if (press.ctrlKey) {
            if (press.altKey) {
                return false;
            }
            if (press.metaKey) {
                return false;
            }
            return !press.repeat;
        }
    }
    return false;
}

//
// The parts of a key event that decide whether it ends a hold of Control.
//
export interface IControlKeyEvent {
    // The character or name of the key, such as "/" or "Control".
    key: string;

    // Whether Control is held.
    ctrlKey: boolean;
}

//
// Works out whether a keydown or keyup shows that Control has been released since the last
// Ctrl+/: a keydown or keyup of Control itself, or any key event with Control up. The shortcuts
// overlay uses it to open or close once per hold of Control, because a held `/` repeats and on
// some Linux desktops each repeat reaches the page as a keyup and a keydown with `repeat` false,
// the same as a new press. Control sends one keydown when it goes down and one keyup when it comes
// up, so its events mark where one press of Ctrl+/ ends and the next begins.
//
export function isControlReleased(event: IControlKeyEvent): boolean {
    if (event.key === "Control") {
        return true;
    }
    return !event.ctrlKey;
}

//
// Works out the shortcuts the overlay lists: the shortcuts given, with Ctrl+/ in a row of its own
// straight after the row of the action it runs, with that row's label. Its name is the action's
// name with "-ctrl" added, so the row has a data-id of its own. A list without the action comes
// back with the same rows.
//
export function overlayShortcuts(shortcuts: IShortcut[], actionName: string): IShortcut[] {
    const result: IShortcut[] = [];
    for (const shortcut of shortcuts) {
        result.push(shortcut);
        if (shortcut.name === actionName) {
            result.push({
                name: `${actionName}-ctrl`,
                label: shortcut.label,
                keys: shortcutsOverlayCtrlKeys,
            });
        }
    }
    return result;
}

//
// One group of shortcuts the overlay lists under a heading, as the style guide's overlay groups
// them.
//
export interface IShortcutGroup {
    // The name the group's data-ids are built from: the pane's name, such as "commit-pane", or
    // "general" for the shortcuts that work everywhere.
    name: string;

    // The group's heading, such as "Commit pane".
    title: string;

    // The shortcuts in the group, in the order the overlay lists them.
    shortcuts: IShortcut[];
}

//
// Makes the shortcuts of the pane's keys from PANE_KEYS, each named after the pane and the key, so
// each row has a data-id of its own, such as "commit-pane-arrowup".
//
export function paneShortcuts(pane: PaneOrPage): IShortcut[] {
    return (PANE_KEYS[pane] ?? []).map(paneKey => {
        return {
            name: `${pane}-${paneKey.eventKey.toLowerCase()}`,
            label: paneKey.label,
            keys: paneKey.keys,
        };
    });
}

//
// Works out the overlay's groups: the selected pane or page's keys first, under its name, when it
// has keys of its own, then the shortcuts given, which work on every page, under "General". With
// no selected pane or page, or one with no keys of its own, the overlay lists the General group
// alone.
//
export function shortcutGroups(paneOrPage: PaneOrPage | undefined, shortcuts: IShortcut[]): IShortcutGroup[] {
    const general: IShortcutGroup = {
        name: "general",
        title: "General",
        shortcuts,
    };
    if (paneOrPage === undefined || PANE_KEYS[paneOrPage] === undefined) {
        return [general];
    }
    return [
        {
            name: paneOrPage,
            title: PANE_OR_PAGE_NAMES[paneOrPage],
            shortcuts: paneShortcuts(paneOrPage),
        },
        general,
    ];
}

//
// Filters each group to the shortcuts whose label or keys contain the search text, ignoring case,
// as matchingShortcuts does, and drops a group left with no shortcut, so the overlay hides it.
//
export function matchingGroups(groups: IShortcutGroup[], searchText: string): IShortcutGroup[] {
    const result: IShortcutGroup[] = [];
    for (const group of groups) {
        const shortcuts = matchingShortcuts(group.shortcuts, searchText);
        if (shortcuts.length > 0) {
            result.push({
                ...group,
                shortcuts,
            });
        }
    }
    return result;
}
