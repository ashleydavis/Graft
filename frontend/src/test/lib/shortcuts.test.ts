//
// Tests what the keyboard shortcuts overlay lists: the actions with a shortcut picked from Ziggy's
// action list, the Ctrl+? row added after the Keyboard Shortcuts action and the shortcuts a search
// matches by label or keys. Also tests which key presses are Ctrl+? and which key events show
// Control released.
//

import type { IActionInfo } from "ziggy";
import { actionShortcuts, IKeyPress, isControlReleased, isShortcutsOverlayCtrlKey, IShortcut, matchingShortcuts, overlayShortcuts, shortcutKeyNames, shortcutsOverlayCtrlKeys } from "../../lib/shortcuts";

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

//
// Makes a key press of the key with Control held and no other modifier, not repeating, which a
// test then changes one part of.
//
function makeCtrlPress(key: string): IKeyPress {
    return {
        key,
        ctrlKey: true,
        altKey: false,
        metaKey: false,
        repeat: false,
    };
}

describe("shortcutsOverlayCtrlKeys", () => {
    test("is Ctrl+?", () => {
        expect(shortcutsOverlayCtrlKeys).toBe("Ctrl+?");
    });
});

describe("isShortcutsOverlayCtrlKey", () => {
    test("? with Control held is Ctrl+?", () => {
        expect(isShortcutsOverlayCtrlKey(makeCtrlPress("?"))).toBe(true);
    });

    test("? without Control is not Ctrl+?", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("?"),
            ctrlKey: false,
        })).toBe(false);
    });

    test("another key with Control held is not Ctrl+?", () => {
        expect(isShortcutsOverlayCtrlKey(makeCtrlPress("/"))).toBe(false);
    });

    test("? with Control and Alt held is not Ctrl+?", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("?"),
            altKey: true,
        })).toBe(false);
    });

    test("? with Control and Command held is not Ctrl+?", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("?"),
            metaKey: true,
        })).toBe(false);
    });

    test("a repeat of a held Ctrl+? is not a new press", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("?"),
            repeat: true,
        })).toBe(false);
    });
});

describe("isControlReleased", () => {
    test("the keyup of Control releases Control, though the event has Control held", () => {
        expect(isControlReleased({
            key: "Control",
            ctrlKey: true,
        })).toBe(true);
    });

    test("a key event with Control up shows Control released", () => {
        expect(isControlReleased({
            key: "a",
            ctrlKey: false,
        })).toBe(true);
    });

    test("a keyup or keydown of ? with Control held, as a repeat of a held Ctrl+? gives, leaves Control held", () => {
        expect(isControlReleased({
            key: "?",
            ctrlKey: true,
        })).toBe(false);
    });
});

describe("overlayShortcuts", () => {
    test("adds Ctrl+? straight after the action's row, with its label", () => {
        expect(overlayShortcuts(listedShortcuts, "toggle-shortcuts-overlay")).toEqual([
            makeShortcut("open-repo", "Open repo", "Ctrl+O"),
            makeShortcut("toggle-shortcuts-overlay", "Keyboard Shortcuts", "?"),
            makeShortcut("toggle-shortcuts-overlay-ctrl", "Keyboard Shortcuts", "Ctrl+?"),
            makeShortcut("quit", "Quit", "Ctrl+Q"),
            makeShortcut("zoom-in", "Zoom In", "Ctrl+Plus"),
        ]);
    });

    test("leaves a list without the action as it is", () => {
        expect(overlayShortcuts(listedShortcuts, "not-listed")).toEqual(listedShortcuts);
    });
});
