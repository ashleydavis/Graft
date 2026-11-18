//
// Tests what the keyboard shortcuts overlay lists: the actions with a shortcut picked from Ziggy's
// action list and the shortcuts a search matches by label or keys.
//

import type { IActionInfo } from "ziggy";
import { actionShortcuts, IShortcut, matchingShortcuts, shortcutKeyNames } from "../../lib/shortcuts";

//
// Makes a shortcut with the name, label and keys, so a test writes each on one line.
//
function makeShortcut(name: string, label: string, keys: string): IShortcut {
    return {
        name,
        label,
        keys,
    };
}

//
// Shortcuts like those Graft lists, for the search tests.
//
const listedShortcuts: IShortcut[] = [
    makeShortcut("open-repo", "Open repo", "Ctrl+O"),
    makeShortcut("toggle-shortcuts-overlay", "Keyboard Shortcuts", "?"),
    makeShortcut("quit", "Quit", "Ctrl+Q"),
    makeShortcut("zoom-in", "Zoom In", "Ctrl+Plus"),
];

describe("actionShortcuts", () => {
    test("keeps the actions with a shortcut, in Ziggy's order, with the keys as Ziggy shows them", () => {
        const actions: IActionInfo[] = [
            {
                name: "open-repo",
                label: "Open repo",
                shortcut: "Ctrl+O",
            },
            {
                name: "no-shortcut",
                label: "No shortcut",
                shortcut: null,
            },
            {
                name: "quit",
                label: "Quit",
                shortcut: "⌘Q",
            },
        ];
        expect(actionShortcuts(actions)).toEqual([
            makeShortcut("open-repo", "Open repo", "Ctrl+O"),
            makeShortcut("quit", "Quit", "⌘Q"),
        ]);
    });

    test("gives no shortcuts for no actions", () => {
        expect(actionShortcuts([])).toEqual([]);
    });
});

describe("matchingShortcuts", () => {
    test("empty search text matches every shortcut", () => {
        expect(matchingShortcuts(listedShortcuts, "")).toEqual(listedShortcuts);
    });

    test("matches by label, ignoring case", () => {
        expect(matchingShortcuts(listedShortcuts, "oPEn")).toEqual([listedShortcuts[0]]);
    });

    test("matches by keys, ignoring case", () => {
        expect(matchingShortcuts(listedShortcuts, "ctrl+q")).toEqual([listedShortcuts[2]]);
    });

    test("a question mark matches the shortcut whose keys are ?", () => {
        expect(matchingShortcuts(listedShortcuts, "?")).toEqual([listedShortcuts[1]]);
    });

    test("matches by label and by keys together, in the list's order", () => {
        expect(matchingShortcuts(listedShortcuts, "o")).toEqual([listedShortcuts[0], listedShortcuts[1], listedShortcuts[3]]);
    });

    test("text no label or keys contain matches no shortcut", () => {
        expect(matchingShortcuts(listedShortcuts, "branch")).toEqual([]);
    });
});

describe("shortcutKeyNames", () => {
    test("splits keys joined with + into one key each", () => {
        expect(shortcutKeyNames("Ctrl+Shift+P")).toEqual(["Ctrl", "Shift", "P"]);
    });

    test("keeps a key with no + as one key", () => {
        expect(shortcutKeyNames("?")).toEqual(["?"]);
        expect(shortcutKeyNames("⌘O")).toEqual(["⌘O"]);
    });

    test("keeps the plus key at the end as a key of its own", () => {
        expect(shortcutKeyNames("Ctrl++")).toEqual(["Ctrl", "+"]);
    });

    test("keeps the plus key alone as one key", () => {
        expect(shortcutKeyNames("+")).toEqual(["+"]);
    });
});
