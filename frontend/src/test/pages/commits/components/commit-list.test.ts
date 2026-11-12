//
// Tests the commit list: renders it with commits, while they load and with an error, and checks
// what each row shows, that each row is a MaterialUI ListItemButton with the selected commit's set
// as selected, that the open commit's title is bold, how each kind of ref is drawn and that
// clicking a commit reports its hash.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { CommitList, RefChip } from "../../../../pages/commits/components/commit-list";

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
    test("shows each commit's title, refs, author, date and short hash", () => {
        const container = renderList(undefined, undefined, jest.fn());
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.textContent).toBe("The first commitHEAD -> mainorigin/mainv1.0Ada Author1/3/20261111111");
        expect(container.querySelector(`[data-id="commit-${secondCommit.hash}"]`)?.textContent).toBe("The second commitAda Author1/3/20262222222");
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

    test("makes the open commit's title bold", () => {
        const container = renderList(secondCommit.hash, commit.hash, jest.fn());
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain("font-bold");
        expect(container.querySelector(`[data-id="commit-${secondCommit.hash}"]`)?.className).not.toContain("font-bold");
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

describe("RefChip", () => {
    test("fills HEAD in the primary colour", () => {
        const { container } = render(createElement(RefChip, {
            gitRef: "HEAD -> main",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("HEAD -> main");
        expect(chip?.className).toContain("MuiChip-filled MuiChip-sizeSmall MuiChip-colorPrimary");
    });

    test("outlines a tag in orange, without its tag prefix", () => {
        const { container } = render(createElement(RefChip, {
            gitRef: "tag: v1.0",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("v1.0");
        expect(chip?.className).toContain("MuiChip-outlined MuiChip-sizeSmall MuiChip-colorWarning");
    });

    test("outlines any other branch in grey", () => {
        const { container } = render(createElement(RefChip, {
            gitRef: "origin/main",
        }));
        const chip = container.firstElementChild;
        expect(chip?.textContent).toBe("origin/main");
        expect(chip?.className).toContain("MuiChip-outlined MuiChip-sizeSmall MuiChip-colorDefault");
    });
});
