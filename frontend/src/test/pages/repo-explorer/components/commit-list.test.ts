//
// Tests the commit list: renders it with commits, while they load and with an error, and checks
// what each row shows, that each row is a MaterialUI ListItemButton with the selected commit's set
// as selected, that the open commit's row has the open bar and a bold title, that the refs sit in
// their column after the title and that clicking a commit reports its hash.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { CommitList, openRowClass, openRowClasses, titleWeightClass } from "../../../../pages/repo-explorer/components/commit-list";

//
// A commit to list, with HEAD, a branch and a tag pointing at it.
//
const commit: ICommit = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: [],
    refs: ["HEAD -> main", "origin/main", "tag: v1.0"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: new Date("2026-01-03T09:00:00Z"),
    committerName: "Cy Committer",
    committerEmail: "cy@example.com",
    committerDate: new Date("2026-01-03T09:00:00Z"),
    title: "The first commit",
    description: "",
};

//
// A second commit to list, with no refs.
//
const secondCommit: ICommit = {
    ...commit,
    hash: "2222222222222222222222222222222222222222",
    refs: [],
    title: "The second commit",
};

//
// Renders the list of both commits with the selected commit, the open commit and the callback, in
// en-US and UTC.
//
function renderList(selectedHash: string | undefined, openHash: string | undefined, onSelectCommit: jest.Mock): HTMLElement {
    const { container } = render(createElement(CommitList, {
        commits: [commit, secondCommit],
        error: undefined,
        selectedHash,
        openHash,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit,
    }));
    return container;
}

describe("CommitList", () => {
    test("shows each commit's title, then its refs' column, author, date and short hash", () => {
        const container = renderList(undefined, undefined, jest.fn());
        const row = container.querySelector(`[data-id="commit-${commit.hash}"]`);
        expect(row?.children[0].textContent).toBe("The first commit");
        expect(row?.children[1].getAttribute("data-id")).toBe(`commit-refs-${commit.hash}`);
        expect(row?.children[1].textContent).toContain("origin/main");
        expect(row?.children[2].textContent).toBe("Ada Author");
        expect(row?.children[3].textContent).toBe("Jan 3");
        expect(row?.children[4].textContent).toBe("1111111");
        expect(container.querySelector(`[data-id="commit-${secondCommit.hash}"]`)?.textContent).toBe("The second commitAda AuthorJan 32222222");
    });

    test("draws each row as a MaterialUI ListItemButton in a list item", () => {
        const container = renderList(undefined, undefined, jest.fn());
        const row = container.querySelector(`[data-id="commit-${commit.hash}"]`);
        expect(row?.tagName).toBe("LI");
        expect(row?.className).toContain("MuiListItemButton-root");
        expect(row?.className).not.toContain("Mui-selected");
        expect(container.querySelector("[data-id=\"commit-list\"]")?.className).toContain("MuiList-root");
    });

    test("shows the selected commit with MaterialUI's selection styling", () => {
        const container = renderList(secondCommit.hash, commit.hash, jest.fn());
        expect(container.querySelector(`[data-id="commit-${secondCommit.hash}"]`)?.className).toContain("Mui-selected");
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).not.toContain("Mui-selected");
    });

    test("marks the open commit's row with the open bar and its title in bold", () => {
        const container = renderList(secondCommit.hash, commit.hash, jest.fn());
        const openRow = container.querySelector(`[data-id="commit-${commit.hash}"]`);
        const otherRow = container.querySelector(`[data-id="commit-${secondCommit.hash}"]`);
        expect(openRow?.className).toContain(openRowClasses);
        expect(openRow?.getAttribute("aria-current")).toBe("true");
        expect(screen.getByText("The first commit").className).toContain("font-[var(--weight-bold)]");
        expect(otherRow?.className).not.toContain(openRowClasses);
        expect(otherRow?.getAttribute("aria-current")).toBeNull();
        expect(screen.getByText("The second commit").className).toContain("font-[var(--weight-normal)]");
    });

    test("shows that the commits are loading until they are read", () => {
        render(createElement(CommitList, {
            commits: undefined,
            error: undefined,
            selectedHash: undefined,
            openHash: undefined,
            dateFormat: {
                locale: "en-US",
                timeZone: "UTC",
            },
            onSelectCommit: jest.fn(),
        }));
        expect(screen.getByText("Loading the commits.").getAttribute("data-id")).toBe("commits-loading");
    });

    test("shows why the commits could not be read", () => {
        render(createElement(CommitList, {
            commits: undefined,
            error: "It broke.",
            selectedHash: undefined,
            openHash: undefined,
            dateFormat: {
                locale: "en-US",
                timeZone: "UTC",
            },
            onSelectCommit: jest.fn(),
        }));
        expect(screen.getByText("It broke.").getAttribute("data-id")).toBe("commits-error");
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        renderList(undefined, undefined, onSelectCommit);
        fireEvent.click(screen.getByText("The second commit"));
        expect(onSelectCommit).toHaveBeenCalledWith(secondCommit.hash);
    });
});

describe("openRowClass", () => {
    test("draws the open bar on an open row and no shadow on any other", () => {
        expect(openRowClass(true)).toBe(openRowClasses);
        expect(openRowClass(false)).toBe("shadow-none");
    });
});

describe("titleWeightClass", () => {
    test("makes the open commit's title bold and the rest normal", () => {
        expect(titleWeightClass(true)).toBe("font-[var(--weight-bold)]");
        expect(titleWeightClass(false)).toBe("font-[var(--weight-normal)]");
    });
});
