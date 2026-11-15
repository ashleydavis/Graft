//
// Tests the Git commands panel: what it says when the page has run no commands, and that it shows
// the cd into the repo above the page's commands, the most recent first and marked, each with a
// copy button that copies it.
//

import { act, render } from "@testing-library/react";
import { createElement } from "react";
import { GitCommandsPanel } from "../../components/git-commands-panel";

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("GitCommandsPanel", () => {
    test("says the page has run no Git commands when it has none", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            pageCommands: undefined,
        }));
        expect(elementWithDataId(container, "git-commands-heading")?.textContent).toBe("Git commands");
        expect(elementWithDataId(container, "git-commands-empty")?.textContent).toBe("This page has run no Git commands.");
        expect(elementWithDataId(container, "git-commands-list")).toBeUndefined();
        expect(elementWithDataId(container, "git-commands-directory")).toBeUndefined();
    });

    test("shows the cd into the repo above the commands, the most recent first and marked", () => {
        const { container } = render(createElement(GitCommandsPanel, {
            pageCommands: {
                directoryCommand: "cd /repo",
                commands: ["git diff-tree abc", "git log --max-count=50"],
            },
        }));
        expect(elementWithDataId(container, "git-commands-empty")).toBeUndefined();
        expect(elementWithDataId(container, "git-commands-directory")?.textContent).toBe("cd /repo");
        expect(elementWithDataId(container, "git-command-0-text")?.textContent).toBe("git diff-tree abc");
        expect(elementWithDataId(container, "git-command-1-text")?.textContent).toBe("git log --max-count=50");
        expect(elementWithDataId(container, "git-command-2")).toBeUndefined();
        const mostRecent = elementWithDataId(container, "git-command-most-recent");
        expect(mostRecent?.textContent).toBe("Most recent");
        expect(elementWithDataId(container, "git-command-0")?.contains(mostRecent ?? null)).toBe(true);
        const directory = elementWithDataId(container, "git-commands-directory");
        const list = elementWithDataId(container, "git-commands-list");
        expect(list).toBeDefined();
        if (list) {
            expect(directory?.compareDocumentPosition(list)).toBe(Node.DOCUMENT_POSITION_FOLLOWING);
        }
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
            pageCommands: {
                directoryCommand: "cd /repo",
                commands: ["git diff-tree abc", "git log --max-count=50"],
            },
        }));
        await act(async () => {
            elementWithDataId(container, "git-commands-directory-copy")?.click();
            elementWithDataId(container, "git-command-1-copy")?.click();
            elementWithDataId(container, "git-command-0-copy")?.click();
        });
        expect(writeText.mock.calls).toEqual([["cd /repo"], ["git log --max-count=50"], ["git diff-tree abc"]]);
    });
});
