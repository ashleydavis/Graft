//
// Tests the commit pane: renders it with commits and checks that it holds the commit list in a
// card that never shrinks, passes the open commit on to be highlighted and that clicking a commit
// reports its hash.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
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
// Renders the pane with the commit open and the callback, in en-US and UTC.
//
function renderPane(onSelectCommit: jest.Mock): HTMLElement {
    const { container } = render(createElement(CommitPane, {
        commits: [commit],
        error: undefined,
        selectedHash: commit.hash,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit,
    }));
    return container;
}

describe("CommitPane", () => {
    test("holds the commit list in a card that never shrinks", () => {
        const container = renderPane(jest.fn());
        const pane = container.querySelector("[data-id=\"commit-pane\"]");
        expect(pane?.className).toContain("flex-none");
        expect(pane?.className).toContain("rounded-xl");
        expect(pane?.querySelector("[data-id=\"commit-list\"]")?.textContent).toBe("The first commitHEAD -> mainAda Author1/1/20261111111");
    });

    test("highlights the open commit", () => {
        const container = renderPane(jest.fn());
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain("font-bold");
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        renderPane(onSelectCommit);
        fireEvent.click(screen.getByText("The first commit"));
        expect(onSelectCommit).toHaveBeenCalledWith(commit.hash);
    });
});
