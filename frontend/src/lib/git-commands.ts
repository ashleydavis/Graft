//
// Keeps the Git commands each page has run, from the events the backend's Git interface function
// sends as it starts each `git`, so the help panel in the right sidebar can show them.
//

//
// The most commands kept for one page. A page that runs more, such as one where many commits are
// opened, keeps the most recent ones, which fill the sidebar with room to spare.
//
export const MAX_COMMANDS_PER_PAGE = 20;

//
// The source each page queues its tasks under, by the page's path, so the help panel shows the
// commands of the page that is open. Only the pages listed here run Git commands.
//
const PAGE_TASK_SOURCES: Record<string, string> = {
    "/commits": "commits-page",
};

//
// The event the backend's Git interface function sends for each `git` it starts. The backend
// writes both lines, ready to paste into a terminal.
//
export interface IGitCommandEvent {
    // What the event is.
    type: "git-command";

    // The `cd` command that moves a terminal into the repo.
    directoryCommand: string;

    // The Git command, as it runs in a terminal in the repo.
    command: string;
}

//
// The Git commands one page has run.
//
export interface IPageGitCommands {
    // The `cd` command that moves a terminal into the repo the last command ran in.
    directoryCommand: string;

    // The commands, the most recent first, each once.
    commands: string[];
}

//
// Whether the data a task sent is the event the Git interface function sends for a command.
//
export function isGitCommandEvent(value: unknown): value is IGitCommandEvent {
    if (typeof value !== "object") {
        return false;
    }
    if (value === null) {
        return false;
    }
    if (Reflect.get(value, "type") !== "git-command") {
        return false;
    }
    if (typeof Reflect.get(value, "directoryCommand") !== "string") {
        return false;
    }
    return typeof Reflect.get(value, "command") === "string";
}

//
// Adds the command a task of the source ran to the page's commands, as the most recent one, and
// returns the new history, leaving the old one as it was so React sees the change. A command the
// page ran before moves to the front rather than showing twice, and the oldest is dropped once the
// page has more than MAX_COMMANDS_PER_PAGE.
//
export function addGitCommand(history: ReadonlyMap<string, IPageGitCommands>, source: string, event: IGitCommandEvent): ReadonlyMap<string, IPageGitCommands> {
    const earlierCommands = history.get(source)?.commands ?? [];
    const otherCommands = earlierCommands.filter(command => command !== event.command);
    const newHistory = new Map(history);
    newHistory.set(source, {
        directoryCommand: event.directoryCommand,
        commands: [event.command, ...otherCommands].slice(0, MAX_COMMANDS_PER_PAGE),
    });
    return newHistory;
}

//
// Reads the commands the page at the path has run, or undefined when it has run none.
//
export function pageGitCommands(history: ReadonlyMap<string, IPageGitCommands>, pagePath: string): IPageGitCommands | undefined {
    const source = PAGE_TASK_SOURCES[pagePath];
    if (source === undefined) {
        return undefined;
    }
    return history.get(source);
}
