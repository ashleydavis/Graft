//
// Tests the record of the Git commands each page has run: which task data is a Git command event,
// how a command is added to a page's commands, which page's commands the help panel shows, the
// total time of a page's commands and how a duration is written.
//

import { addGitCommand, formatDuration, IGitCommandEvent, IPageGitCommands, isGitCommandEvent, MAX_COMMANDS_PER_PAGE, pageGitCommands, totalDurationMs } from "../../lib/git-commands";

//
// Makes the event for the command run in /repo that took 5 ms.
//
function commandEvent(command: string): IGitCommandEvent {
    return {
        type: "git-command",
        directoryCommand: "cd /repo",
        command,
        durationMs: 5,
    };
}

//
// Lists the commands of the source's page in the history, the most recent first, without their
// durations, so a test that checks only the order compares plain strings.
//
function pageCommandTexts(history: ReadonlyMap<string, IPageGitCommands>, source: string): string[] | undefined {
    return history.get(source)?.commands.map(run => run.command);
}

describe("isGitCommandEvent", () => {
    test("accepts the event the Git interface function sends", () => {
        expect(isGitCommandEvent(commandEvent("git log --max-count=50"))).toBe(true);
    });

    test("refuses data that is not an object", () => {
        expect(isGitCommandEvent("git log")).toBe(false);
        expect(isGitCommandEvent(null)).toBe(false);
    });

    test("refuses an event of another type", () => {
        expect(isGitCommandEvent({
            type: "output",
            directoryCommand: "cd /repo",
            command: "git log",
            durationMs: 5,
        })).toBe(false);
    });

    test("refuses an event whose cd command or command is not text", () => {
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: 1,
            command: "git log",
            durationMs: 5,
        })).toBe(false);
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: "cd /repo",
            durationMs: 5,
        })).toBe(false);
    });

    test("refuses an event whose duration is not a number", () => {
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: "cd /repo",
            command: "git log",
        })).toBe(false);
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: "cd /repo",
            command: "git log",
            durationMs: "5",
        })).toBe(false);
    });
});

describe("addGitCommand", () => {
    test("starts a page's commands with the first one", () => {
        const history = addGitCommand(new Map(), "repo-explorer-page", commandEvent("git log --max-count=50"));
        expect(history.get("repo-explorer-page")).toEqual({
            directoryCommand: "cd /repo",
            commands: [
                {
                    command: "git log --max-count=50",
                    durationMs: 5,
                },
            ],
        });
    });

    test("puts the newest command first and leaves the old history as it was", () => {
        const first = addGitCommand(new Map(), "repo-explorer-page", commandEvent("git log"));
        const second = addGitCommand(first, "repo-explorer-page", commandEvent("git diff-tree abc"));
        expect(pageCommandTexts(second, "repo-explorer-page")).toEqual(["git diff-tree abc", "git log"]);
        expect(pageCommandTexts(first, "repo-explorer-page")).toEqual(["git log"]);
    });

    test("moves a command run again to the front rather than showing it twice", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git log"));
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git diff-tree abc"));
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git log"));
        expect(pageCommandTexts(history, "repo-explorer-page")).toEqual(["git log", "git diff-tree abc"]);
    });

    test("keeps the duration of a command's most recent run", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git log"));
        history = addGitCommand(history, "repo-explorer-page", {
            type: "git-command",
            directoryCommand: "cd /repo",
            command: "git log",
            durationMs: 40,
        });
        expect(history.get("repo-explorer-page")?.commands).toEqual([
            {
                command: "git log",
                durationMs: 40,
            },
        ]);
    });

    test("keeps each source's commands apart", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git log"));
        history = addGitCommand(history, "other-page", commandEvent("git status"));
        expect(pageCommandTexts(history, "repo-explorer-page")).toEqual(["git log"]);
        expect(pageCommandTexts(history, "other-page")).toEqual(["git status"]);
    });

    test("takes the cd command of the most recent command", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "repo-explorer-page", commandEvent("git log"));
        history = addGitCommand(history, "repo-explorer-page", {
            type: "git-command",
            directoryCommand: "cd /other",
            command: "git log",
            durationMs: 5,
        });
        expect(history.get("repo-explorer-page")?.directoryCommand).toBe("cd /other");
    });

    test("drops the oldest command once a page has more than the most it keeps", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        for (let index = 0; index <= MAX_COMMANDS_PER_PAGE; index++) {
            history = addGitCommand(history, "repo-explorer-page", commandEvent(`git show ${index}`));
        }
        const commands = pageCommandTexts(history, "repo-explorer-page");
        expect(commands?.length).toBe(MAX_COMMANDS_PER_PAGE);
        expect(commands?.[0]).toBe(`git show ${MAX_COMMANDS_PER_PAGE}`);
        expect(commands).not.toContain("git show 0");
    });
});

describe("pageGitCommands", () => {
    test("gives the repo explorer page the commands its tasks ran", () => {
        const history = addGitCommand(new Map(), "repo-explorer-page", commandEvent("git log"));
        expect(pageGitCommands(history, "/repo-explorer")?.commands.map(run => run.command)).toEqual(["git log"]);
    });

    test("gives undefined for the repo explorer page before it has run a command", () => {
        expect(pageGitCommands(new Map(), "/repo-explorer")).toBeUndefined();
    });

    test("gives undefined for a page that runs no Git commands", () => {
        const history = addGitCommand(new Map(), "repo-explorer-page", commandEvent("git log"));
        expect(pageGitCommands(history, "/")).toBeUndefined();
        expect(pageGitCommands(history, "/help")).toBeUndefined();
    });
});

describe("totalDurationMs", () => {
    test("adds up the durations of every command the page ran", () => {
        expect(totalDurationMs({
            directoryCommand: "cd /repo",
            commands: [
                {
                    command: "git diff-tree abc",
                    durationMs: 12,
                },
                {
                    command: "git log",
                    durationMs: 1388,
                },
            ],
        })).toBe(1400);
    });

    test("gives 0 for a page with no commands", () => {
        expect(totalDurationMs({
            directoryCommand: "cd /repo",
            commands: [],
        })).toBe(0);
    });
});

describe("formatDuration", () => {
    test("writes a duration under a second in whole milliseconds", () => {
        expect(formatDuration(0)).toBe("0 ms");
        expect(formatDuration(12)).toBe("12 ms");
        expect(formatDuration(999)).toBe("999 ms");
    });

    test("writes a duration under a minute in seconds to one decimal place, rounded down", () => {
        expect(formatDuration(1000)).toBe("1.0 s");
        expect(formatDuration(1400)).toBe("1.4 s");
        expect(formatDuration(1499)).toBe("1.4 s");
        expect(formatDuration(59999)).toBe("59.9 s");
    });

    test("writes a duration from a minute up in whole minutes and seconds", () => {
        expect(formatDuration(60000)).toBe("1 min 0 s");
        expect(formatDuration(125999)).toBe("2 min 5 s");
    });
});
