//
// Tests working out what the command palette lists: the commands made from an action list, the
// relevant commands put first for each pane and page, the search filter and the highlight moving
// with Up and Down.
//

import type { IActionInfo } from "ziggy";
import { commandGroups, ICommand, matchingGroups, movedHighlightIndex, paletteCommands, RELEVANT_ACTIONS, shownCommands } from "../../lib/command-palette";

//
// An action list like the one Ziggy gives Graft: its own actions, the palette's among them, then
// standard items of its menu, one with no shortcut.
//
const actions: IActionInfo[] = [
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
        name: "new-window",
        label: "New window",
        shortcut: "Ctrl+N",
    },
    {
        name: "copy",
        label: "Copy",
        shortcut: "Ctrl+C",
    },
    {
        name: "about",
        label: "About",
        shortcut: null,
    },
];

//
// The commands made from the action list.
//
const commands: ICommand[] = paletteCommands(actions, "show-command-palette");

describe("paletteCommands", () => {
    test("makes a command of every action but the palette's own, in Ziggy's order", () => {
        expect(commands).toEqual([
            {
                name: "open-repo",
                label: "Open repo",
                keys: "Ctrl+O",
            },
            {
                name: "new-window",
                label: "New window",
                keys: "Ctrl+N",
            },
            {
                name: "copy",
                label: "Copy",
                keys: "Ctrl+C",
            },
            {
                name: "about",
                label: "About",
                keys: undefined,
            },
        ]);
    });
});

describe("commandGroups", () => {
    test("lists the welcome page's commands first under its name, then every other command", () => {
        expect(commandGroups(commands, "welcome-page")).toEqual([
            {
                id: "relevant",
                title: "Welcome page",
                commands: [commands[0], commands[1]],
            },
            {
                id: "other",
                title: "Other commands",
                commands: [commands[2], commands[3]],
            },
        ]);
    });

    test("lists the relevant commands in the table's order and leaves out a name the list does not hold", () => {
        const groups = commandGroups(commands, "commit-pane");
        expect(groups[0].title).toBe("Commit pane");
        expect(groups[0].commands).toEqual([commands[2]]);
        expect(groups[1].commands).toEqual([commands[0], commands[1], commands[3]]);
    });

    test("leaves out the relevant group when the list holds none of its commands", () => {
        const groups = commandGroups(commands, "help-page");
        expect(groups.map(group => group.id)).toEqual(["other"]);
        expect(groups[0].commands).toEqual(commands);
    });

    test("lists every command in one group with no pane or page selected", () => {
        expect(commandGroups(commands, undefined)).toEqual([
            {
                id: "other",
                title: "Commands",
                commands,
            },
        ]);
    });

    test("gives no group for no commands", () => {
        expect(commandGroups([], "welcome-page")).toEqual([]);
    });

    test("the table names relevant commands for every pane and page", () => {
        for (const names of Object.values(RELEVANT_ACTIONS)) {
            expect(names.length).toBeGreaterThan(0);
        }
    });
});

describe("matchingGroups", () => {
    test("filters both groups by label, ignoring case", () => {
        const groups = matchingGroups(commandGroups(commands, "welcome-page"), "O");
        expect(shownCommands(groups).map(command => command.name)).toEqual(["open-repo", "new-window", "copy", "about"]);
        const narrowed = matchingGroups(commandGroups(commands, "welcome-page"), "co");
        expect(narrowed.map(group => group.id)).toEqual(["other"]);
        expect(shownCommands(narrowed).map(command => command.name)).toEqual(["copy"]);
    });

    test("leaves out the keys, matching labels only", () => {
        expect(matchingGroups(commandGroups(commands, "welcome-page"), "ctrl")).toEqual([]);
    });

    test("keeps every command for empty search text", () => {
        expect(shownCommands(matchingGroups(commandGroups(commands, "welcome-page"), ""))).toHaveLength(4);
    });
});

describe("shownCommands", () => {
    test("lists the groups' commands in order", () => {
        expect(shownCommands(commandGroups(commands, "commit-pane")).map(command => command.name)).toEqual(["copy", "open-repo", "new-window", "about"]);
    });
});

describe("movedHighlightIndex", () => {
    test("Down moves to the next command and stops at the last", () => {
        expect(movedHighlightIndex(0, "ArrowDown", 3)).toBe(1);
        expect(movedHighlightIndex(2, "ArrowDown", 3)).toBe(2);
    });

    test("Up moves to the command before and stops at the first", () => {
        expect(movedHighlightIndex(2, "ArrowUp", 3)).toBe(1);
        expect(movedHighlightIndex(0, "ArrowUp", 3)).toBe(0);
    });

    test("stays on the first place with no command shown", () => {
        expect(movedHighlightIndex(0, "ArrowDown", 0)).toBe(0);
    });

    test("leaves the highlight where it is for any other key", () => {
        expect(movedHighlightIndex(1, "a", 3)).toBe(1);
    });
});
