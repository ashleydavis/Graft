//
// Tests the "Commit details" pane: renders it with a commit and checks that it is headed "Commit
// details" and shows the commit's title in bold, its description when there is one, its author,
// committer, dates, hash and parents, that the close button reports it and that its border is in
// the style guide's active pane colour while it is active. It also checks the parents' label and
// text.
//

import { fireEvent, render } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { CommitInfoPane, parentsLabel, parentsText } from "../../../../pages/repo-explorer/components/commit-info-pane";

//
// The hash of the commit the pane shows.
//
const commitHash = "1111111111111111111111111111111111111111";

//
// Builds the commit the pane shows, with the parents and the description.
//
function commitWith(parentHashes: string[], description: string): ICommit {
    return {
        hash: commitHash,
        parentHashes,
        refs: [],
        authorName: "Ada Author",
        authorEmail: "ada@example.com",
        authorDate: new Date("2026-01-03T09:00:00Z"),
        committerName: "Cy Committer",
        committerEmail: "cy@example.com",
        committerDate: new Date("2026-01-03T09:00:01Z"),
        title: "Change the note",
        description,
    };
}

//
// Renders the pane for the commit, active or not, with the close callback, in en-US and UTC.
//
function renderPane(commit: ICommit, isActive: boolean, onClose: jest.Mock): void {
    render(createElement(CommitInfoPane, {
        commit,
        isActive,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onClose,
    }));
}

//
// Finds the element with the data-id, failing the test when the pane does not show it.
//
function elementWithDataId(dataId: string): Element {
    const element = document.querySelector(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as Element;
}

//
// Turns every kind of space in the text into a plain space. Node's ICU puts a narrow no-break
// space before AM and PM where Bun's puts a plain one, so the tests compare times with this to get
// the same result whichever runs them.
//
function plainSpaces(text: string | null | undefined): string {
    return (text ?? "").replace(/\s/g, " ");
}

describe("CommitInfoPane", () => {
    test("is headed Commit details", () => {
        renderPane(commitWith([], ""), false, jest.fn());
        expect(elementWithDataId("commit-info-heading").textContent).toBe("Commit details");
        expect(elementWithDataId("commit-info-pane").getAttribute("aria-label")).toBe("Full commit details");
    });

    test("shows the commit's title in bold, its description, author, committer, dates, hash and parent", () => {
        renderPane(commitWith(["2222222222222222222222222222222222222222"], "The note now says\nwhat the second note is."), false, jest.fn());
        expect(elementWithDataId("commit-details-title").textContent).toBe("Change the note");
        expect(elementWithDataId("commit-details-title").className).toContain("font-[var(--weight-bold)]");
        expect(elementWithDataId("commit-details-description").textContent).toBe("The note now says\nwhat the second note is.");
        expect(plainSpaces(elementWithDataId("commit-details-author").textContent)).toBe("Ada Author <ada@example.com>Jan 3, 2026, 9:00 AM");
        expect(plainSpaces(elementWithDataId("commit-details-committer").textContent)).toBe("Cy Committer <cy@example.com>Jan 3, 2026, 9:00 AM");
        expect(elementWithDataId("commit-details-hash").textContent).toBe(commitHash);
        expect(elementWithDataId("commit-details-parents").textContent).toBe("2222222");
        expect(elementWithDataId("commit-details-parents").previousElementSibling?.textContent).toBe("Parent");
        expect(elementWithDataId("commit-details-author").previousElementSibling?.textContent).toBe("Authored");
        expect(elementWithDataId("commit-details-committer").previousElementSibling?.textContent).toBe("Committed");
        expect(elementWithDataId("commit-details-hash").previousElementSibling?.textContent).toBe("Hash");
    });

    test("shows no description when the message is only a title, and says the first commit has no parents", () => {
        renderPane(commitWith([], ""), false, jest.fn());
        expect(document.querySelector("[data-id=\"commit-details-description\"]")).toBeNull();
        expect(elementWithDataId("commit-details-parents").textContent).toBe("None, this is the first commit");
        expect(elementWithDataId("commit-details-parents").previousElementSibling?.textContent).toBe("Parents");
    });

    test("shows a merge commit's parents as their short hashes", () => {
        renderPane(commitWith(["2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"], ""), false, jest.fn());
        expect(elementWithDataId("commit-details-parents").textContent).toBe("2222222  3333333");
    });

    test("draws its border in the style guide's active pane colour while it is active", () => {
        renderPane(commitWith([], ""), true, jest.fn());
        expect(elementWithDataId("commit-info-pane").className).toContain(activePaneClasses);
    });

    test("keeps its grey border while it is not active", () => {
        renderPane(commitWith([], ""), false, jest.fn());
        expect(elementWithDataId("commit-info-pane").className).not.toContain(activePaneClasses);
    });

    test("reports that the user closed it", () => {
        const onClose = jest.fn();
        renderPane(commitWith([], ""), false, onClose);
        fireEvent.click(elementWithDataId("commit-info-close"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("parentsLabel", () => {
    test("labels one parent Parent and none or several Parents", () => {
        expect(parentsLabel([])).toBe("Parents");
        expect(parentsLabel(["2222222222222222222222222222222222222222"])).toBe("Parent");
        expect(parentsLabel(["2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"])).toBe("Parents");
    });
});

describe("parentsText", () => {
    test("writes each parent as its short hash, two spaces apart", () => {
        expect(parentsText(["2222222222222222222222222222222222222222"])).toBe("2222222");
        expect(parentsText(["2222222222222222222222222222222222222222", "3333333333333333333333333333333333333333"])).toBe("2222222  3333333");
    });
});
