//
// Keeps the Git commands each pane and page has run and how long each took, from the events the
// backend's Git interface function sends as each `git` ends, so the help panel in the right sidebar
// can show those of the selected pane or page.
//

//
// The most commands kept for one pane or page. A pane that runs more, such as the commit details
// pane as many commits are opened, keeps the most recent ones. The panel's total time adds up every
// command kept, and the panel lists the most recent COMMANDS_SHOWN_MAX of them.
//
export const MAX_COMMANDS_PER_PAGE = 20;

//
// The most commands the panel shows for one pane or page. Its most recent commands are the ones
// that read what the user opened last, such as a file's diff or a commit's changed files, so two
// of them show where its newest content came from without filling the sidebar.
//
export const COMMANDS_SHOWN_MAX = 2;

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
// One command a pane or page ran and how long its most recent run took.
//
export interface IGitCommandRun {
    // The Git command, as it runs in a terminal in the repo.
    command: string;

    // How long the command's most recent run took, in whole milliseconds.
    durationMs: number;
}

//
// The Git commands one pane or page has run.
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
// Adds the command a task of the source ran to the source's commands, as the most recent one, and
// returns the new history, leaving the old one as it was so React sees the change. The source is
// the pane or page that queued the task. A command the source ran before moves to the front with
// its new duration rather than showing twice, because the pane or page shows what its latest run
// read. The oldest is dropped once the source has more than MAX_COMMANDS_PER_PAGE.
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
// Reads the commands the active pane has run, or, while the page shown has no active pane, those
// kept under the page's path, or undefined when it has run none. A pane queues its tasks under its
// name (lib/panes.ts), so the Git commands panel follows the pane the keys act on, and while no
// pane is active it shows the page's own commands.
//
export function selectedGitCommands(history: ReadonlyMap<string, IPageGitCommands>, pagePath: string, activePane: string | undefined): IPageGitCommands | undefined {
    if (activePane !== undefined) {
        return history.get(activePane);
    }
    return history.get(pagePath);
}

//
// Picks the commands the panel shows for the pane or page: its most recent ones, up to
// COMMANDS_SHOWN_MAX, the most recent first. The rest stay in its commands so the total time covers
// them too.
//
export function shownGitCommands(pageCommands: IPageGitCommands): IGitCommandRun[] {
    return pageCommands.commands.slice(0, COMMANDS_SHOWN_MAX);
}

//
// Adds up how long the pane's or page's commands took, so the help panel shows the total time of
// the Git commands behind it.
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
