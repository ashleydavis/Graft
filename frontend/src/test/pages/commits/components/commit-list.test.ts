//
// Tests the commit list: renders it with commits, while they load and with an error, and checks
// what it shows in each case and that clicking a commit reports its hash.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { CommitList } from "../../../../pages/commits/components/commit-list";

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

describe("CommitList", () => {
    test("lists each commit with its title, author and short hash", () => {
        const { container } = render(createElement(CommitList, {
            commits: [commit],
            error: undefined,
            onSelectCommit: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"commit-list\"]")?.textContent).toBe("The first commit (Ada Author, 1111111)");
    });

    test("shows that the commits are loading until they are read", () => {
        render(createElement(CommitList, {
            commits: undefined,
            error: undefined,
            onSelectCommit: jest.fn(),
        }));
        expect(screen.getByText("Loading the commits.").getAttribute("data-id")).toBe("commits-loading");
    });

    test("shows why the commits could not be read", () => {
        render(createElement(CommitList, {
            commits: undefined,
            error: "It broke.",
            onSelectCommit: jest.fn(),
        }));
        expect(screen.getByText("It broke.").getAttribute("data-id")).toBe("commits-error");
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        render(createElement(CommitList, {
            commits: [commit],
            error: undefined,
            onSelectCommit,
        }));
        fireEvent.click(screen.getByText(/The first commit/));
        expect(onSelectCommit).toHaveBeenCalledWith(commit.hash);
    });
});
