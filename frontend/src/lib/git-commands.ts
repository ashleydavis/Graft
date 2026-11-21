//
// Keeps the Git commands each page has run and how long each took, from the events the backend's
// Git interface function sends as each `git` ends, so the help panel in the right sidebar can show
// them.
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
    "/repo-explorer": "repo-explorer-page",
};

//
// The event the backend's Git interface function sends for each `git` it ran. The backend writes
// both lines, ready to paste into a terminal, and measures how long git ran.
//
export interface IGitCommandEvent {
    // What the event is.
    type: "git-command";

    // The `cd` command that moves a terminal into the repo.
    directoryCommand: string;

    // The Git command, as it runs in a terminal in the repo.
    command: string;

    // How long git ran, in whole milliseconds.
    durationMs: number;
}

//
// One command a page ran and how long its most recent run took.
//
export interface IGitCommandRun {
    // The Git command, as it runs in a terminal in the repo.
    command: string;

    // How long the command's most recent run took, in whole milliseconds.
    durationMs: number;
}

//
// The Git commands one page has run.
//
export interface IPageGitCommands {
    // The `cd` command that moves a terminal into the repo the last command ran in.
    directoryCommand: string;

    // The commands, the most recent first, each once with the duration of its most recent run.
    commands: IGitCommandRun[];
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
    if (typeof Reflect.get(value, "command") !== "string") {
        return false;
    }
    return typeof Reflect.get(value, "durationMs") === "number";
}

//
// Adds the command a task of the source ran to the page's commands, as the most recent one, and
// returns the new history, leaving the old one as it was so React sees the change. A command the
// page ran before moves to the front with its new duration rather than showing twice, because the
// page shows what its latest run read. The oldest is dropped once the page has more than
// MAX_COMMANDS_PER_PAGE.
//
export function addGitCommand(history: ReadonlyMap<string, IPageGitCommands>, source: string, event: IGitCommandEvent): ReadonlyMap<string, IPageGitCommands> {
    const earlierCommands = history.get(source)?.commands ?? [];
    const otherCommands = earlierCommands.filter(run => run.command !== event.command);
    const newRun: IGitCommandRun = {
        command: event.command,
        durationMs: event.durationMs,
    };
    const newHistory = new Map(history);
    newHistory.set(source, {
        directoryCommand: event.directoryCommand,
        commands: [newRun, ...otherCommands].slice(0, MAX_COMMANDS_PER_PAGE),
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

//
// Adds up how long the page's commands took, so the help panel shows the total time of the Git
// commands behind the page.
//
export function totalDurationMs(pageCommands: IPageGitCommands): number {
    return pageCommands.commands.reduce((total, run) => total + run.durationMs, 0);
}

//
// The milliseconds in a second, for writing a duration in seconds.
//
const MS_PER_SECOND = 1000;

//
// The milliseconds in a minute, for writing a duration in minutes and seconds.
//
const MS_PER_MINUTE = 60 * MS_PER_SECOND;

//
// Writes a duration for a person to read: whole milliseconds under a second ("12 ms"), seconds to
// one decimal place under a minute ("1.4 s") and whole minutes and seconds from a minute up
// ("2 min 5 s"), so a quick command and a slow one both read at a glance. Each is rounded down, so
// a duration just under a unit never reads as a whole one.
//
export function formatDuration(durationMs: number): string {
    if (durationMs < MS_PER_SECOND) {
        return `${durationMs} ms`;
    }
    if (durationMs < MS_PER_MINUTE) {
        const tenthsOfSecond = Math.floor(durationMs / (MS_PER_SECOND / 10));
        return `${(tenthsOfSecond / 10).toFixed(1)} s`;
    }
    const minutes = Math.floor(durationMs / MS_PER_MINUTE);
    const seconds = Math.floor((durationMs % MS_PER_MINUTE) / MS_PER_SECOND);
    return `${minutes} min ${seconds} s`;
}
