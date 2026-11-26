//
// Works out what the command palette lists from Ziggy's action list: the commands, the group of
// commands relevant to the selected pane or page listed first, the commands a search matches and
// which command the highlight is on.
//

import type { IActionInfo } from "ziggy";
import { PANE_OR_PAGE_NAMES, PaneOrPage } from "./active-pane";

//
// One command the palette lists: an action of Graft's or a standard item of its menu.
//
export interface ICommand {
    // The name the action is run by, which the palette builds the row's data-id from.
    name: string;

    // The action's label, such as "Open repo".
    label: string;

    // The keys as the platform shows them, such as "Ctrl+O", or undefined when it has none.
    keys: string | undefined;
}

//
// One group of commands the palette lists under a heading.
//
export interface ICommandGroup {
    // The group's name in data-ids: "relevant" for the selected pane or page's group and "other"
    // for the rest.
    id: string;

    // The group's heading.
    title: string;

    // The group's commands, in the order the palette lists them.
    commands: ICommand[];
}

//
// The actions relevant to each pane and page, by action name, in the order the palette lists them
// first. This one table decides which commands lead the palette, so changing what a pane or page
// offers first is one edit here. A name missing from Ziggy's action list is left out.
//
export const RELEVANT_ACTIONS: Record<PaneOrPage, string[]> = {
    "welcome-page": ["open-repo", "new-window"],
    "about-page": ["copy"],
    "help-page": ["toggle-shortcuts-overlay"],
    "repo-explorer-page": ["open-repo"],
    "repo-details-pane": ["open-repo", "new-window"],
    "commit-pane": ["copy", "select-all"],
    "commit-details-pane": ["copy", "select-all"],
    "file-pane": ["copy", "select-all", "zoom-in-step", "zoom-out-step", "zoom-actual-size"],
    "changes-pane": ["undo", "redo", "cut", "copy", "paste", "select-all"],
    "working-file-pane": ["copy", "select-all", "zoom-in-step", "zoom-out-step", "zoom-actual-size"],
    "tag-pane": ["copy", "select-all"],
};

//
// Makes the palette's commands from window.ziggy.listActions, in the order Ziggy lists them, with
// every action but the palette's own, which would only show the palette again.
//
export function paletteCommands(actions: IActionInfo[], paletteAction: string): ICommand[] {
    const commands: ICommand[] = [];
    for (const action of actions) {
        if (action.name !== paletteAction) {
            commands.push({
                name: action.name,
                label: action.label,
                keys: action.shortcut ?? undefined,
            });
        }
    }
    return commands;
}

//
// Splits the commands into the group relevant to the selected pane or page, headed by its name and
// in RELEVANT_ACTIONS's order, then every other command under "Other commands", so the palette
// lists the commands for what the user is working on first. With no pane or page selected, every
// command is in one group under "Commands". A group with no command is left out.
//
export function commandGroups(commands: ICommand[], paneOrPage: PaneOrPage | undefined): ICommandGroup[] {
    if (!paneOrPage) {
        return nonEmptyGroups([
            {
                id: "other",
                title: "Commands",
                commands,
            },
        ]);
    }
    const relevantNames = RELEVANT_ACTIONS[paneOrPage];
    const relevant: ICommand[] = [];
    for (const name of relevantNames) {
        const command = commands.find(candidate => candidate.name === name);
        if (command) {
            relevant.push(command);
        }
    }
    return nonEmptyGroups([
        {
            id: "relevant",
            title: PANE_OR_PAGE_NAMES[paneOrPage],
            commands: relevant,
        },
        {
            id: "other",
            title: "Other commands",
            commands: commands.filter(command => !relevantNames.includes(command.name)),
        },
    ]);
}

//
// Drops the groups that have no command, so the palette draws no heading over an empty list.
//
export function nonEmptyGroups(groups: ICommandGroup[]): ICommandGroup[] {
    return groups.filter(group => group.commands.length > 0);
}

//
// Picks, in each group, the commands whose label contains the search text, ignoring case, and
// drops the groups left with none, so the palette's search box filters both groups. Empty search
// text matches every command.
//
export function matchingGroups(groups: ICommandGroup[], searchText: string): ICommandGroup[] {
    const wanted = searchText.toLowerCase();
    return nonEmptyGroups(groups.map(group => ({
        ...group,
        commands: group.commands.filter(command => command.label.toLowerCase().includes(wanted)),
    })));
}

//
// Lists the commands of the groups in the order the palette shows them, so the highlight, which
// moves across the groups, is an index into this list.
//
export function shownCommands(groups: ICommandGroup[]): ICommand[] {
    return groups.flatMap(group => group.commands);
}

//
// Works out the index the highlight moves to after a key: Down moves it to the next command and Up to the
// one before, stopping at the first and the last. Any other key leaves it where it is. The count is
// the number of commands shown, and with none the highlight stays on the first place.
//
export function movedHighlightIndex(highlightIndex: number, key: string, commandCount: number): number {
    if (key === "ArrowDown") {
        return Math.max(Math.min(highlightIndex + 1, commandCount - 1), 0);
    }
    if (key === "ArrowUp") {
        return Math.max(highlightIndex - 1, 0);
    }
    return highlightIndex;
}
