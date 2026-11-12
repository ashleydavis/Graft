//
// Tests the record of the Git commands each page has run: which task data is a Git command event,
// how a command is added to a page's commands and which page's commands the help panel shows.
//

import { addGitCommand, IGitCommandEvent, IPageGitCommands, isGitCommandEvent, MAX_COMMANDS_PER_PAGE, pageGitCommands } from "../../lib/git-commands";

//
// Makes the event for the command run in /repo.
//
function commandEvent(command: string): IGitCommandEvent {
    return {
        type: "git-command",
        directoryCommand: "cd /repo",
        command,
    };
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
        })).toBe(false);
    });

    test("refuses an event whose cd command or command is not text", () => {
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: 1,
            command: "git log",
        })).toBe(false);
        expect(isGitCommandEvent({
            type: "git-command",
            directoryCommand: "cd /repo",
        })).toBe(false);
    });
});

describe("addGitCommand", () => {
    test("starts a page's commands with the first one", () => {
        const history = addGitCommand(new Map(), "commits-page", commandEvent("git log --max-count=50"));
        expect(history.get("commits-page")).toEqual({
            directoryCommand: "cd /repo",
            commands: ["git log --max-count=50"],
        });
    });

    test("puts the newest command first and leaves the old history as it was", () => {
        const first = addGitCommand(new Map(), "commits-page", commandEvent("git log"));
        const second = addGitCommand(first, "commits-page", commandEvent("git diff-tree abc"));
        expect(second.get("commits-page")?.commands).toEqual(["git diff-tree abc", "git log"]);
        expect(first.get("commits-page")?.commands).toEqual(["git log"]);
    });

    test("moves a command run again to the front rather than showing it twice", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "commits-page", commandEvent("git log"));
        history = addGitCommand(history, "commits-page", commandEvent("git diff-tree abc"));
        history = addGitCommand(history, "commits-page", commandEvent("git log"));
        expect(history.get("commits-page")?.commands).toEqual(["git log", "git diff-tree abc"]);
    });

    test("keeps each source's commands apart", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "commits-page", commandEvent("git log"));
        history = addGitCommand(history, "other-page", commandEvent("git status"));
        expect(history.get("commits-page")?.commands).toEqual(["git log"]);
        expect(history.get("other-page")?.commands).toEqual(["git status"]);
    });

    test("takes the cd command of the most recent command", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        history = addGitCommand(history, "commits-page", commandEvent("git log"));
        history = addGitCommand(history, "commits-page", {
            type: "git-command",
            directoryCommand: "cd /other",
            command: "git log",
        });
        expect(history.get("commits-page")?.directoryCommand).toBe("cd /other");
    });

    test("drops the oldest command once a page has more than the most it keeps", () => {
        let history: ReadonlyMap<string, IPageGitCommands> = new Map();
        for (let index = 0; index <= MAX_COMMANDS_PER_PAGE; index++) {
            history = addGitCommand(history, "commits-page", commandEvent(`git show ${index}`));
        }
        const commands = history.get("commits-page")?.commands;
        expect(commands?.length).toBe(MAX_COMMANDS_PER_PAGE);
        expect(commands?.[0]).toBe(`git show ${MAX_COMMANDS_PER_PAGE}`);
        expect(commands).not.toContain("git show 0");
    });
});

describe("pageGitCommands", () => {
    test("gives the commits page the commands its tasks ran", () => {
        const history = addGitCommand(new Map(), "commits-page", commandEvent("git log"));
        expect(pageGitCommands(history, "/commits")?.commands).toEqual(["git log"]);
    });

    test("gives undefined for the commits page before it has run a command", () => {
        expect(pageGitCommands(new Map(), "/commits")).toBeUndefined();
    });

    test("gives undefined for a page that runs no Git commands", () => {
        const history = addGitCommand(new Map(), "commits-page", commandEvent("git log"));
        expect(pageGitCommands(history, "/")).toBeUndefined();
        expect(pageGitCommands(history, "/help")).toBeUndefined();
    });
});
