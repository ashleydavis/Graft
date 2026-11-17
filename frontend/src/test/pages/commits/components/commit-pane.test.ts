//
// Tests the commit pane: renders it with commits and checks that it holds the commit list in a
// card headed "Commits" that never shrinks, passes the selected and open commits on to the list,
// marks the pane active with a border in the style guide's active pane colour and that clicking a
// commit reports its hash.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { activePaneClasses } from "../../../../pages/commits/components/active-pane-style";
import { openRowClasses } from "../../../../pages/commits/components/commit-list";
import { CommitPane } from "../../../../pages/commits/components/commit-pane";

//
// A commit to list.
//
const commit: ICommit = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: [],
    refs: ["HEAD -> main"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: new Date("2026-01-01T12:00:00Z"),
    committerName: "Ada Author",
    committerEmail: "ada@example.com",
    committerDate: new Date("2026-01-01T12:00:00Z"),
    title: "The first commit",
    description: "",
};

//
// Renders the pane with the commit selected and open, active or not, with the callback, in en-US
// and UTC.
//
function renderPane(isActive: boolean, onSelectCommit: jest.Mock): HTMLElement {
    const { container } = render(createElement(CommitPane, {
        commits: [commit],
        error: undefined,
        selectedHash: commit.hash,
        openHash: commit.hash,
        isActive,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit,
    }));
    return container;
}

describe("CommitPane", () => {
    test("holds the commit list in a card headed Commits that never shrinks", () => {
        const container = renderPane(false, jest.fn());
        const pane = container.querySelector("[data-id=\"commit-pane\"]");
        expect(pane?.className).toContain("flex-none");
        expect(pane?.className).toContain("rounded-[var(--radius-lg)]");
        expect(pane?.querySelector("[data-id=\"commit-pane-heading\"]")?.textContent).toBe("Commits");
        expect(pane?.querySelector("[data-id=\"commit-list\"]")?.textContent).toBe("The first commitmainAda AuthorJan 11111111");
    });

    test("shows the selected commit as selected and the open commit as open", () => {
        const container = renderPane(false, jest.fn());
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain("Mui-selected");
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain(openRowClasses);
    });

    test("draws its border in the style guide's active pane colour while it is active", () => {
        const container = renderPane(true, jest.fn());
        expect(container.querySelector<HTMLElement>("[data-id=\"commit-pane\"]")?.className).toContain(activePaneClasses);
    });

    test("keeps its grey border while it is not active", () => {
        const container = renderPane(false, jest.fn());
        expect(container.querySelector<HTMLElement>("[data-id=\"commit-pane\"]")?.className).not.toContain(activePaneClasses);
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        renderPane(false, onSelectCommit);
        fireEvent.click(screen.getByText("The first commit"));
        expect(onSelectCommit).toHaveBeenCalledWith(commit.hash);
    });
});
