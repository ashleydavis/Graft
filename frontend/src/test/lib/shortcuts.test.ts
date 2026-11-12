//
// Tests what the keyboard shortcuts overlay lists: the actions with a shortcut picked from Ziggy's
// action list, the shortcuts a search matches by label or keys and the columns they fill.
//

import type { IActionInfo } from "ziggy";
import { actionShortcuts, IShortcut, matchingShortcuts, SHORTCUT_COLUMN_ROW_COUNT_MAX, shortcutColumns } from "../../lib/shortcuts";

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
// Makes the number of shortcuts given, named shortcut-0, shortcut-1 and so on, for the column
// tests.
//
function makeShortcuts(count: number): IShortcut[] {
    const shortcuts: IShortcut[] = [];
    for (let index = 0; index < count; index += 1) {
        shortcuts.push(makeShortcut(`shortcut-${index}`, `Shortcut ${index}`, `Ctrl+${index}`));
    }
    return shortcuts;
}

//
// The names of the shortcuts in each column, so a test checks the layout in one comparison.
//
function columnNames(columns: IShortcut[][]): string[][] {
    return columns.map(column => column.map(shortcut => shortcut.name));
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

describe("shortcutColumns", () => {
    test("a column holds eight shortcuts", () => {
        expect(SHORTCUT_COLUMN_ROW_COUNT_MAX).toBe(8);
    });

    test("no shortcuts give no columns", () => {
        expect(shortcutColumns([])).toEqual([]);
    });

    test("shortcuts that fit in one column fill one column", () => {
        expect(columnNames(shortcutColumns(makeShortcuts(3)))).toEqual([["shortcut-0", "shortcut-1", "shortcut-2"]]);
    });

    test("a full column holds every shortcut in one column", () => {
        const columns = shortcutColumns(makeShortcuts(SHORTCUT_COLUMN_ROW_COUNT_MAX));
        expect(columns.map(column => column.length)).toEqual([SHORTCUT_COLUMN_ROW_COUNT_MAX]);
    });

    test("when a column is full the list carries on in the next column", () => {
        const columns = shortcutColumns(makeShortcuts(SHORTCUT_COLUMN_ROW_COUNT_MAX * 2 + 1));
        expect(columns.map(column => column.length)).toEqual([SHORTCUT_COLUMN_ROW_COUNT_MAX, SHORTCUT_COLUMN_ROW_COUNT_MAX, 1]);
        expect(columnNames(columns).flat()).toEqual(columnNames([makeShortcuts(SHORTCUT_COLUMN_ROW_COUNT_MAX * 2 + 1)]).flat());
        expect(columnNames(columns)[1][0]).toBe(`shortcut-${SHORTCUT_COLUMN_ROW_COUNT_MAX}`);
        expect(columnNames(columns)[2]).toEqual([`shortcut-${SHORTCUT_COLUMN_ROW_COUNT_MAX * 2}`]);
    });
});
