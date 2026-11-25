//
// Tests the Git commands panel: what it says when the pane or page has run no commands, that its
// text names a pane for a pane's commands, and that it shows the cd into the repo above the most
// recent commands, at most two, each with a copy button that copies it and how long it took, with
// the total time of every command the pane or page ran.
//

import { act, render } from "@testing-library/react";
import { createElement } from "react";
import { COMMAND_WORD_LENGTH_UNBROKEN_MAX, GitCommandsPanel } from "../../components/git-commands-panel";
import { IGitCommandRun } from "../../lib/git-commands";

//
// Makes the runs of the commands, each taking 3 ms, for a test that does not look at durations.
//
function commandRuns(commands: string[]): IGitCommandRun[] {
    return commands.map(command => ({
        command,
        durationMs: 3,
    }));
}

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("GitCommandsPanel", () => {
    test("says the pane has run no Git commands when the selected pane has none", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: true,
            commands: undefined,
        }));
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This pane has run no Git commands.");
        expect(container.textContent).toContain("The Git commands this pane ran. Copy one to run it in a terminal.");
    });

    test("names the pane in its line on what it shows for a pane's commands", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: true,
            commands: {
                directoryCommand: "cd /repo",
                commands: commandRuns(["git log --max-count=50"]),
            },
        }));
        expect(container.textContent).toContain("The Git commands this pane ran. Copy one to run it in a terminal.");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git log --max-count=50");
    });

    test("says the page has run no Git commands when it has none", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: undefined,
        }));
        expect(elementWithDataId(container, "git-commands-heading")?.textContent).toBe("Git commands");
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This page has run no Git commands.");
        expect(elementWithDataId(container, "git-commands-list")).toBeUndefined();
        expect(elementWithDataId(container, "git-commands-directory")).toBeUndefined();
    });

    test("shows the cd into the repo above the commands, the most recent first", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: commandRuns(["git diff-tree abc", "git log --max-count=50"]),
            },
        }));
        expect(elementWithDataId(container, "git-commands-empty")).toBeUndefined();
        expect(elementWithDataId(container, "git-commands-directory")?.textContent).toBe("cd /repo");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree abc");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git log --max-count=50");
        expect(elementWithDataId(container, "git-command-2")).toBeUndefined();
        const directory = elementWithDataId(container, "git-commands-directory");
        const list = elementWithDataId(container, "git-commands-list");
        expect(list).toBeDefined();
        if (list) {
            expect(directory?.compareDocumentPosition(list)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        }
    });

    test("shows how long each command took and the total time of them all", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: [
                    {
                        command: "git diff-tree abc",
                        durationMs: 12,
                    },
                    {
                        command: "git log --max-count=50",
                        durationMs: 1388,
                    },
                ],
            },
        }));
        expect(elementWithDataId(container, "git-command-0-duration")?.textContent).toBe("12 ms");
        expect(elementWithDataId(container, "git-command-1-duration")?.textContent).toBe("1.3 s");
        expect(elementWithDataId(container, "git-commands-total")?.textContent).toBe("1.4 s");
        expect(elementWithDataId(container, "git-commands-total")?.parentElement?.textContent).toBe("Total time: 1.4 s");
        expect(elementWithDataId(container, "git-command-0-duration")?.parentElement?.textContent).toBe("Took 12 ms");
    });

    test("lists only the two most recent commands and totals every command the page ran", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: [
                    {
                        command: "git diff-tree -p abc -- notes.txt",
                        durationMs: 10,
                    },
                    {
                        command: "git diff-tree --numstat abc",
                        durationMs: 20,
                    },
                    {
                        command: "git diff-tree --name-status abc",
                        durationMs: 30,
                    },
                    {
                        command: "git log --max-count=50",
                        durationMs: 40,
                    },
                ],
            },
        }));
        expect(container.querySelectorAll('[data-id="git-commands-list"] > li').length).toBe(2);
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree -p abc -- notes.txt");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git diff-tree --numstat abc");
        expect(elementWithDataId(container, "git-command-2")).toBeUndefined();
        expect(elementWithDataId(container, "git-commands-total")?.textContent).toBe("100 ms");
    });

    test("copies the cd and each command with its own button", async () => {
        const writeText = jest.fn().mockResolvedValue(undefined);
        Object.defineProperty(navigator, "clipboard", {
            value: {
                writeText,
            },
            configurable: true,
        });
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: commandRuns(["git diff-tree abc", "git log --max-count=50"]),
            },
        }));
        await act(async () => {
            elementWithDataId(container, "git-commands-directory-copy")?.click();
            elementWithDataId(container, "git-command-1-copy")?.click();
            elementWithDataId(container, "git-command-0-copy")?.click();
        });
        expect(writeText.mock.calls).toEqual([["cd /repo"], ["git log --max-count=50"], ["git diff-tree abc"]]);
    });

    test("keeps short words of a command whole and lets long ones break anywhere", () => {
        const longWord = "a".repeat(COMMAND_WORD_LENGTH_UNBROKEN_MAX + 1);
        const shortWord = "b".repeat(COMMAND_WORD_LENGTH_UNBROKEN_MAX);
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: commandRuns([`git ${shortWord} ${longWord}`]),
            },
        }));
        const words = Array.from(elementWithDataId(container, "git-command-0-text")?.querySelectorAll(":scope > span > span") ?? []);
        expect(words.map(word => word.textContent)).toEqual(["git", shortWord, longWord]);
        expect(words[1].classList.contains("whitespace-nowrap")).toBe(true);
        expect(words[2].classList.contains("[overflow-wrap:anywhere]")).toBe(true);
    });

    test("shows the commands beside a muted prompt that the command's text leaves out", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            isPane: false,
            commands: {
                directoryCommand: "cd /repo",
                commands: commandRuns(["git log"]),
            },
        }));
        const prompt = elementWithDataId(container, "git-command-0-text")?.previousElementSibling;
        expect(prompt?.textContent?.trim()).toBe("$");
        expect(prompt?.getAttribute("aria-hidden")).toBe("true");
        expect(elementWithDataId(container, "git-command-0-copy")?.getAttribute("aria-label")).toBe("Copy command");
    });
});
