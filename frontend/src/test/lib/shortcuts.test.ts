//
// Tests what the keyboard shortcuts overlay lists: the actions with a shortcut picked from Ziggy's
// action list, the Ctrl+/ row added after the Keyboard Shortcuts action and the shortcuts a search
// matches by label or keys. Also tests which key presses are Ctrl+/ and which key events show
// Control released, the groups listed for each active pane and the search across the groups.
//

import type { IActionInfo } from "ziggy";
import { PaneOrPage } from "../../lib/active-pane";
import { PANE_KEYS } from "../../lib/pane-keys";
import { actionShortcuts, IKeyPress, isControlReleased, isShortcutsOverlayCtrlKey, IShortcut, matchingGroups, matchingShortcuts, overlayShortcuts, paneShortcuts, shortcutGroups, shortcutKeyNames, shortcutsOverlayCtrlKeys } from "../../lib/shortcuts";

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
    test("is Ctrl+/", () => {
        expect(shortcutsOverlayCtrlKeys).toBe("Ctrl+/");
    });
});

describe("isShortcutsOverlayCtrlKey", () => {
    test("/ with Control held is Ctrl+/", () => {
        expect(isShortcutsOverlayCtrlKey(makeCtrlPress("/"))).toBe(true);
    });

    test("/ without Control is not Ctrl+/", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("/"),
            ctrlKey: false,
        })).toBe(false);
    });

    test("? with Control held, as Ctrl+Shift+/ gives on a US layout, is not Ctrl+/", () => {
        expect(isShortcutsOverlayCtrlKey(makeCtrlPress("?"))).toBe(false);
    });

    test("/ with Control and Alt held is not Ctrl+/", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("/"),
            altKey: true,
        })).toBe(false);
    });

    test("/ with Control and Command held is not Ctrl+/", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("/"),
            metaKey: true,
        })).toBe(false);
    });

    test("a repeat of a held Ctrl+/ is not a new press", () => {
        expect(isShortcutsOverlayCtrlKey({
            ...makeCtrlPress("/"),
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

    test("a keyup or keydown of / with Control held, as a repeat of a held Ctrl+/ gives, leaves Control held", () => {
        expect(isControlReleased({
            key: "/",
            ctrlKey: true,
        })).toBe(false);
    });
});

describe("overlayShortcuts", () => {
    test("adds Ctrl+/ straight after the action's row, with its label", () => {
        expect(overlayShortcuts(listedShortcuts, "toggle-shortcuts-overlay")).toEqual([
            makeShortcut("open-repo", "Open repo", "Ctrl+O"),
            makeShortcut("toggle-shortcuts-overlay", "Keyboard Shortcuts", "?"),
            makeShortcut("toggle-shortcuts-overlay-ctrl", "Keyboard Shortcuts", "Ctrl+/"),
            makeShortcut("quit", "Quit", "Ctrl+Q"),
            makeShortcut("zoom-in", "Zoom In", "Ctrl+Plus"),
        ]);
    });

    test("leaves a list without the action as it is", () => {
        expect(overlayShortcuts(listedShortcuts, "not-listed")).toEqual(listedShortcuts);
    });
});

//
// Every pane, in the order PANE_KEYS lists them.
//
const everyPane: PaneOrPage[] = ["repo-details-pane", "commit-pane", "commit-details-pane", "file-pane", "changes-pane", "working-file-pane"];

describe("paneShortcuts", () => {
    test("makes no row for a page with no keys of its own", () => {
        expect(paneShortcuts("welcome-page")).toEqual([]);
    });

    test("makes a row for each of the file pane's keys, named after the pane and the key", () => {
        expect(paneShortcuts("file-pane")).toEqual([
            makeShortcut("file-pane-arrowleft", "Make the commit details pane active", "Left"),
            makeShortcut("file-pane-escape", "Close the file pane", "Escape"),
        ]);
    });

    test("makes a row for every key of every pane, with the key and label from PANE_KEYS", () => {
        for (const pane of everyPane) {
            const shortcuts = paneShortcuts(pane);
            expect(shortcuts.map(shortcut => shortcut.keys)).toEqual((PANE_KEYS[pane] ?? []).map(paneKey => paneKey.keys));
            expect(shortcuts.map(shortcut => shortcut.label)).toEqual((PANE_KEYS[pane] ?? []).map(paneKey => paneKey.label));
            expect(new Set(shortcuts.map(shortcut => shortcut.name)).size).toBe(shortcuts.length);
        }
    });
});

describe("shortcutGroups", () => {
    test("with a page that has no keys of its own gives the shortcuts alone", () => {
        expect(shortcutGroups("welcome-page", listedShortcuts).map(group => group.name)).toEqual(["general"]);
    });

    test("with no selected pane or page gives the shortcuts alone, in a group headed General", () => {
        expect(shortcutGroups(undefined, listedShortcuts)).toEqual([
            {
                name: "general",
                title: "General",
                shortcuts: listedShortcuts,
            },
        ]);
    });

    test("puts the selected pane's keys first, under the pane's name, then the General group", () => {
        expect(shortcutGroups("commit-pane", listedShortcuts)).toEqual([
            {
                name: "commit-pane",
                title: "Commit pane",
                shortcuts: paneShortcuts("commit-pane"),
            },
            {
                name: "general",
                title: "General",
                shortcuts: listedShortcuts,
            },
        ]);
    });

    test("names the group of each pane", () => {
        const titles = everyPane.map(pane => shortcutGroups(pane, listedShortcuts)[0].title);
        expect(titles).toEqual(["Repo details pane", "Commit pane", "Commit details pane", "File pane", "Changes pane", "File pane"]);
    });
});

describe("matchingGroups", () => {
    test("with empty search text keeps every group whole", () => {
        const groups = shortcutGroups("commit-pane", listedShortcuts);
        expect(matchingGroups(groups, "")).toEqual(groups);
    });

    test("filters each group by label or keys, ignoring case", () => {
        const groups = shortcutGroups("commit-pane", listedShortcuts);
        expect(matchingGroups(groups, "ESC")).toEqual([
            {
                name: "commit-pane",
                title: "Commit pane",
                shortcuts: [
                    makeShortcut("commit-pane-escape", "Close the rightmost pane", "Escape"),
                ],
            },
        ]);
        expect(matchingGroups(groups, "repo").map(group => group.shortcuts.map(shortcut => shortcut.name))).toEqual([
            ["commit-pane-arrowleft"],
            ["open-repo"],
        ]);
    });

    test("hides a group with no match", () => {
        const groups = shortcutGroups("commit-pane", listedShortcuts);
        expect(matchingGroups(groups, "quit").map(group => group.name)).toEqual(["general"]);
    });

    test("gives no group when nothing matches", () => {
        expect(matchingGroups(shortcutGroups("file-pane", listedShortcuts), "branch")).toEqual([]);
    });
});
