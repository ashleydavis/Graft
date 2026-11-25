//
// Tests the changes pane: renders it with changes and checks that it shows the header's summary,
// the unstaged list above the staged list with their counts and rows, the stage and unstage
// buttons, what it shows while the changes load, when they could not be read, when a stage failed
// and when there are none, that each row and button reports its file, that a button's click does
// not select its row and that the pane marks the selected and open rows and its active border. It
// checks the stage button's tooltip shows what the button does and what that means. It checks the
// commit section under the lists: the message box reports each change, the Commit button counts
// the staged files, is disabled while the message is empty, no file is staged or a commit is being
// made, reports its click once enabled and shows why the last commit failed with git's line breaks.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { changeKey } from "../../../../lib/repo-explorer";
import { IWorkingChanges } from "../../../../lib/working-changes";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { ChangesPane, changesSummary, stageButtonClasses, StageTip, unstageButtonClasses } from "../../../../pages/repo-explorer/components/changes-pane";
import { openRowClasses } from "../../../../pages/repo-explorer/components/commit-list";

//
// A working tree with a modified file and an untracked file unstaged, a deleted file staged, and
// the modified file's other changes staged.
//
const changes: IWorkingChanges = {
    unstaged: [
        {
            status: "M",
            path: "notes.txt",
        },
        {
            status: "?",
            path: "docs/new.txt",
        },
    ],
    staged: [
        {
            status: "D",
            path: "old.txt",
        },
        {
            status: "M",
            path: "notes.txt",
        },
    ],
};

//
// What a test renders the pane with, each left out taking a value of nothing selected or open,
// no errors, an inactive pane, an empty commit message and no commit being made.
//
interface IRenderOptions {
    changes: IWorkingChanges | undefined;
    error?: string;
    stageError?: string;
    selectedKey?: string;
    openKey?: string;
    isActive?: boolean;
    onSelectChange?: jest.Mock;
    onToggleStaged?: jest.Mock;
    commitMessage?: string;
    commitError?: string;
    isCommitting?: boolean;
    onCommitMessageChange?: jest.Mock;
    onCommit?: jest.Mock;
}

//
// Renders the pane with the options.
//
function renderPane(options: IRenderOptions): void {
    render(createElement(ChangesPane, {
        repoPath: "/repo",
        changes: options.changes,
        error: options.error,
        stageError: options.stageError,
        selectedKey: options.selectedKey,
        openKey: options.openKey,
        isActive: options.isActive ?? false,
        onSelectChange: options.onSelectChange ?? jest.fn(),
        onToggleStaged: options.onToggleStaged ?? jest.fn(),
        commitMessage: options.commitMessage ?? "",
        commitError: options.commitError,
        isCommitting: options.isCommitting ?? false,
        onCommitMessageChange: options.onCommitMessageChange ?? jest.fn(),
        onCommit: options.onCommit ?? jest.fn(),
    }));
}

//
// Finds the element with the data-id, failing the test when the pane does not show it.
//
function elementWithDataId(dataId: string): HTMLElement {
    const element = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as HTMLElement;
}

//
// Reads the data-ids of the rows in the list, in order.
//
function rowIds(listDataId: string): (string | null)[] {
    return Array.from(elementWithDataId(listDataId).children).map(row => row.getAttribute("data-id"));
}

describe("ChangesPane", () => {
    test("shows the unstaged list above the staged list, each with its count and rows", () => {
        renderPane({
            changes,
        });
        expect(elementWithDataId("changes-heading").textContent).toBe("Changes3 files, 2 staged");
        expect(elementWithDataId("changes-pane").getAttribute("aria-label")).toBe("Changes");
        expect(elementWithDataId("changes-unstaged-heading").textContent).toBe("Unstaged (2)");
        expect(elementWithDataId("changes-staged-heading").textContent).toBe("Staged (2)");
        const sections = Array.from(document.querySelectorAll("section section")).map(section => section.getAttribute("data-id"));
        expect(sections).toEqual(["changes-unstaged", "changes-staged", "commit-section"]);
        expect(rowIds("changes-unstaged-list")).toEqual(["change-unstaged-notes.txt", "change-unstaged-docs/new.txt"]);
        expect(rowIds("changes-staged-list")).toEqual(["change-staged-old.txt", "change-staged-notes.txt"]);
        expect(elementWithDataId("change-unstaged-docs/new.txt").textContent).toBe("docs/new.txt");
    });

    test("gives unstaged rows a stage button and staged rows an unstage button, in their colours", () => {
        renderPane({
            changes,
        });
        const stage = elementWithDataId("stage-notes.txt");
        expect(stage.getAttribute("aria-label")).toBe("Stage this file");
        expect(stage.className).toContain(stageButtonClasses);
        expect(stage.querySelector("svg[data-icon=\"angles-right\"]")).not.toBeNull();
        const unstage = elementWithDataId("unstage-old.txt");
        expect(unstage.getAttribute("aria-label")).toBe("Unstage this file");
        expect(unstage.className).toContain(unstageButtonClasses);
        expect(unstage.querySelector("svg[data-icon=\"angles-left\"]")).not.toBeNull();
    });

    test("reports the file and its list when a button is clicked, without selecting the row", () => {
        const onToggleStaged = jest.fn();
        const onSelectChange = jest.fn();
        renderPane({
            changes,
            onToggleStaged,
            onSelectChange,
        });
        fireEvent.click(elementWithDataId("stage-docs/new.txt"));
        expect(onToggleStaged).toHaveBeenCalledWith(changes.unstaged[1], false);
        fireEvent.click(elementWithDataId("unstage-notes.txt"));
        expect(onToggleStaged).toHaveBeenCalledWith(changes.staged[1], true);
        expect(onSelectChange).not.toHaveBeenCalled();
    });

    test("reports the row's key when a row is clicked", () => {
        const onSelectChange = jest.fn();
        renderPane({
            changes,
            onSelectChange,
        });
        fireEvent.click(elementWithDataId("change-staged-notes.txt"));
        expect(onSelectChange).toHaveBeenCalledWith(changeKey(true, "notes.txt"));
    });

    test("marks the selected row and the open row, which may be in different lists", () => {
        renderPane({
            changes,
            selectedKey: changeKey(true, "notes.txt"),
            openKey: changeKey(false, "notes.txt"),
        });
        const staged = elementWithDataId("change-staged-notes.txt");
        expect(staged.className).toContain("Mui-selected");
        expect(staged.getAttribute("aria-current")).toBeNull();
        const unstaged = elementWithDataId("change-unstaged-notes.txt");
        expect(unstaged.className).not.toContain("Mui-selected");
        expect(unstaged.className).toContain(openRowClasses);
        expect(unstaged.getAttribute("aria-current")).toBe("true");
    });

    test("scrolls the selected row's list by the least amount that shows the row", () => {
        const edges: Record<string, number[]> = {
            "changes-staged-scroll": [100, 200],
            "change-staged-notes.txt": [210, 240],
        };
        const bounds = jest.spyOn(Element.prototype, "getBoundingClientRect").mockImplementation(function placedRect(this: Element): DOMRect {
            const [top, bottom] = edges[this.getAttribute("data-id") ?? ""] ?? [0, 0];
            return {
                x: 0,
                y: top,
                width: 0,
                height: bottom - top,
                top,
                right: 0,
                bottom,
                left: 0,
                toJSON: () => ({}),
            };
        });
        const scrollTop = jest.spyOn(Element.prototype, "scrollTop", "set");
        renderPane({
            changes,
            selectedKey: changeKey(true, "notes.txt"),
        });
        expect(scrollTop).toHaveBeenCalledWith(40);
        expect(scrollTop.mock.contexts).toEqual([elementWithDataId("changes-staged-scroll")]);
        scrollTop.mockRestore();
        bounds.mockRestore();
    });

    test("says what an empty list means", () => {
        renderPane({
            changes: {
                unstaged: [],
                staged: changes.staged,
            },
        });
        expect(elementWithDataId("changes-unstaged-empty").textContent).toBe("Everything is staged.");
        renderPane({
            changes: {
                unstaged: changes.unstaged,
                staged: [],
            },
        });
        expect(elementWithDataId("changes-staged-empty").textContent).toBe("Nothing staged yet.");
    });

    test("says the working tree has no changes when both lists are empty", () => {
        renderPane({
            changes: {
                unstaged: [],
                staged: [],
            },
        });
        expect(elementWithDataId("changes-none").textContent).toBe("No changes. The working tree matches the last commit.");
        expect(elementWithDataId("changes-summary").textContent).toBe("none");
    });

    test("shows that the changes are loading until they are read", () => {
        renderPane({
            changes: undefined,
        });
        expect(screen.getByText("Loading the changes.").getAttribute("data-id")).toBe("changes-loading");
        expect(elementWithDataId("changes-summary").textContent).toBe("");
    });

    test("shows why the changes could not be read", () => {
        renderPane({
            changes: undefined,
            error: "Running git status failed.",
        });
        expect(elementWithDataId("changes-error").textContent).toBe("Running git status failed.");
    });

    test("shows why the last stage or unstage did not happen above the lists", () => {
        renderPane({
            changes,
            stageError: "Running git add failed.",
        });
        expect(elementWithDataId("changes-stage-error").textContent).toBe("Running git add failed.");
        expect(elementWithDataId("changes-unstaged-list")).not.toBeNull();
    });

    test("draws its border in the style guide's active pane colour only while it is active", () => {
        renderPane({
            changes,
            isActive: true,
        });
        expect(elementWithDataId("changes-pane").className).toContain(activePaneClasses);
    });
});

//
// Reads the Commit button, failing the test when the pane does not show it.
//
function commitButton(): HTMLButtonElement {
    const button = elementWithDataId("commit-button");
    expect(button).toBeInstanceOf(HTMLButtonElement);

    //
    // The cast is safe because the expect above fails the test for any other element, and a type
    // guard cannot narrow it because Jest's expect does not narrow the type.
    //
    return button as HTMLButtonElement;
}

describe("ChangesPane commit section", () => {
    test("shows the message box and the Commit button under the lists", () => {
        renderPane({
            changes,
            commitMessage: "Add the notes",
        });
        const pane = elementWithDataId("changes-pane");
        expect(pane.lastElementChild?.getAttribute("data-id")).toBe("commit-section");
        expect(screen.getByLabelText("Commit message")).toBe(elementWithDataId("commit-message"));
        expect(elementWithDataId("commit-message")).toHaveProperty("value", "Add the notes");
        expect(commitButton().textContent).toBe("Commit 2 files");
        expect(commitButton().disabled).toBe(false);
    });

    test("reports each change to the message", () => {
        const onCommitMessageChange = jest.fn();
        renderPane({
            changes,
            onCommitMessageChange,
        });
        fireEvent.change(elementWithDataId("commit-message"), {
            target: {
                value: "Fix the notes",
            },
        });
        expect(onCommitMessageChange).toHaveBeenCalledWith("Fix the notes");
    });

    test("reports a click on the Commit button once it is enabled", () => {
        const onCommit = jest.fn();
        renderPane({
            changes,
            commitMessage: "Add the notes",
            onCommit,
        });
        fireEvent.click(commitButton());
        expect(onCommit).toHaveBeenCalledTimes(1);
    });

    test("disables the Commit button while the message is empty or only white space", () => {
        renderPane({
            changes,
            commitMessage: " \n ",
        });
        expect(commitButton().disabled).toBe(true);
        expect(commitButton().textContent).toBe("Commit 2 files");
    });

    test("disables the Commit button and shows 'Nothing to commit' while no file is staged", () => {
        renderPane({
            changes: {
                unstaged: changes.unstaged,
                staged: [],
            },
            commitMessage: "Add the notes",
        });
        expect(commitButton().disabled).toBe(true);
        expect(commitButton().textContent).toBe("Nothing to commit");
    });

    test("disables the Commit button while the changes are read", () => {
        renderPane({
            changes: undefined,
            commitMessage: "Add the notes",
        });
        expect(commitButton().disabled).toBe(true);
        expect(commitButton().textContent).toBe("Nothing to commit");
    });

    test("disables the Commit button while a commit is being made", () => {
        renderPane({
            changes,
            commitMessage: "Add the notes",
            isCommitting: true,
        });
        expect(commitButton().disabled).toBe(true);
    });

    test("shows why the last commit failed with git's line breaks, above the Commit button", () => {
        renderPane({
            changes,
            commitMessage: "Add the notes",
            commitError: "Git did not make the commit:\nThe pre-commit hook found a problem.",
        });
        const error = elementWithDataId("commit-error");
        expect(error.textContent).toBe("Git did not make the commit:\nThe pre-commit hook found a problem.");
        expect(error.className).toContain("whitespace-pre-wrap");
        expect(error.nextElementSibling?.contains(commitButton())).toBe(true);
    });

    test("shows no error while the last commit has not failed", () => {
        renderPane({
            changes,
        });
        expect(document.querySelector("[data-id=\"commit-error\"]")).toBeNull();
    });
});

describe("changesSummary", () => {
    test("counts the files and the staged files, naming one file in the singular", () => {
        expect(changesSummary({
            unstaged: [{
                status: "M",
                path: "notes.txt",
            }],
            staged: [],
        })).toBe("1 file, 0 staged");
        expect(changesSummary(changes)).toBe("3 files, 2 staged");
    });
});

describe("StageTip", () => {
    test("shows what the button does in bold above what that means for the file", () => {
        const { container } = render(createElement(StageTip, {
            title: "Stage this file",
            detail: "Adds the file's changes to the next commit.",
        }));
        const lines = container.firstElementChild?.children;
        expect(lines?.[0].textContent).toBe("Stage this file");
        expect(lines?.[0].className).toContain("font-[var(--weight-bold)]");
        expect(lines?.[1].textContent).toBe("Adds the file's changes to the next commit.");
    });
});
