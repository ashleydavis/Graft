//
// Works out what the keyboard shortcuts overlay lists from Ziggy's action list: the actions that
// have a shortcut and those a search matches.
//

import type { IActionInfo } from "ziggy";

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
