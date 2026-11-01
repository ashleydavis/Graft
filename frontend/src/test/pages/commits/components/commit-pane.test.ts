//
// Tests the commit pane: renders it with commits and checks that it holds the commit list in a
// column that never shrinks and that clicking a commit reports its hash.
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
    authorDate: new Date("2026-01-01T00:00:00Z"),
    committerName: "Ada Author",
    committerEmail: "ada@example.com",
    committerDate: new Date("2026-01-01T00:00:00Z"),
    title: "The first commit",
    description: "",
};

describe("CommitPane", () => {
    test("holds the commit list in a column that never shrinks", () => {
        const { container } = render(createElement(CommitPane, {
            commits: [commit],
            error: undefined,
            onSelectCommit: jest.fn(),
        }));
        const pane = container.querySelector("[data-id=\"commit-pane\"]");
        expect(pane?.className).toBe("flex-none");
        expect(pane?.querySelector("[data-id=\"commit-list\"]")?.textContent).toBe("The first commit (Ada Author, 1111111)");
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        render(createElement(CommitPane, {
            commits: [commit],
            error: undefined,
            onSelectCommit,
        }));
        fireEvent.click(screen.getByText(/The first commit/));
        expect(onSelectCommit).toHaveBeenCalledWith(commit.hash);
    });
});
