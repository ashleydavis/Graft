//
// Tests the commit list: renders it with commits, while a page loads and with an error, and checks
// what each row shows, that a header row above the scrolling area names the columns in line with
// them, that each row is a MaterialUI ListItemButton with the selected commit's set as selected,
// that the open commit's row has the open bar and a bold title, that the refs sit in their column
// after the title and that clicking a commit reports its hash. With the scrolling
// area given a height, it checks the virtual list draws only the rows in view and a few more, calls
// onNearEnd only once the last drawn row is near the last commit, and scrolls the selected commit's
// row into view.
//

import { act, fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { COMMIT_LIST_PADDING_PX, COMMIT_ROW_HEIGHT_PX, CommitList, hashColumnClasses, lastRowIndex, openRowClass, openRowClasses, titleWeightClass } from "../../../../pages/repo-explorer/components/commit-list";
import { FAKE_LIST_HEIGHT_PX, IFakeListLayout, installFakeListLayout } from "../../../fake-list-layout";

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
        isLoading: false,
        error: undefined,
        selectedHash,
        openHash,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit,
        onNearEnd: jest.fn(),
    }));
    return container;
}

//
// Makes the count of commits, newest first, each with a hash of its own made from its index and
// the title "Commit <index>".
//
function makeCommits(count: number): ICommit[] {
    return Array.from({
        length: count,
    }, (unusedValue, index) => ({
        ...secondCommit,
        hash: index.toString(16).padStart(40, "0"),
        title: `Commit ${index}`,
    }));
}

//
// The props of a list of the commits with nothing selected, open, loading or failed, in en-US and
// UTC, with the callbacks the test gives.
//
function listProps(commits: ICommit[], onNearEnd: jest.Mock): Parameters<typeof CommitList>[0] {
    return {
        commits,
        isLoading: false,
        error: undefined,
        selectedHash: undefined,
        openHash: undefined,
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit: jest.fn(),
        onNearEnd,
    };
}

//
// The fake layout each test runs with, so the virtual list has a height to draw rows in.
//
let layout: IFakeListLayout;

beforeEach(() => {
    layout = installFakeListLayout();
});

afterEach(() => {
    layout.uninstall();
});

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

    test("names the columns in a header row above the scrolling area, lined up with the rows", () => {
        const container = renderList(undefined, undefined, jest.fn());
        const header = container.querySelector("[data-id=\"commit-list-header\"]");
        expect(header?.nextElementSibling?.getAttribute("data-id")).toBe("commit-list-scroll");
        expect(header?.children[0].getAttribute("data-id")).toBe("commit-list-header-message");
        expect(header?.children[0].textContent).toBe("Message");
        expect(header?.children[1].textContent).toBe("");
        expect(header?.children[2].getAttribute("data-id")).toBe("commit-list-header-author");
        expect(header?.children[2].textContent).toBe("Author");
        expect(header?.children[3].getAttribute("data-id")).toBe("commit-list-header-date");
        expect(header?.children[3].textContent).toBe("Date");
        expect(header?.children[4].getAttribute("data-id")).toBe("commit-list-header-hash");
        expect(header?.children[4].textContent).toBe("Hash");
        const row = container.querySelector(`[data-id="commit-${commit.hash}"]`);
        expect(header?.children[1].className).toContain("w-[calc(var(--space-8)*5)]");
        expect(row?.children[1].className).toContain("w-[calc(var(--space-8)*5)]");
        expect(header?.children[2].className).toContain("w-[80px]");
        expect(row?.children[2].className).toContain("w-[80px]");
        expect(header?.children[3].className).toContain("w-[52px]");
        expect(row?.children[3].className).toContain("w-[52px]");
        expect(header?.children[4].className).toBe(hashColumnClasses);
        expect(row?.children[4].className).toContain(hashColumnClasses);
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

    test("shows a loading row under the commits while a page is read", () => {
        render(createElement(CommitList, {
            ...listProps([commit], jest.fn()),
            isLoading: true,
        }));
        expect(screen.getByText("The first commit")).toBeTruthy();
        expect(screen.getByText("Loading the commits.").getAttribute("data-id")).toBe("commits-loading");
        expect(screen.getByLabelText("Loading")).toBeTruthy();
    });

    test("shows only the loading row before the first page is read", () => {
        const { container } = render(createElement(CommitList, {
            ...listProps([], jest.fn()),
            isLoading: true,
        }));
        expect(container.querySelectorAll("[data-id^=\"commit-\"][data-id$=\"0\"]").length).toBe(0);
        expect(screen.getByText("Loading the commits.")).toBeTruthy();
    });

    test("shows an error row under the commits when a page could not be read", () => {
        render(createElement(CommitList, {
            ...listProps([commit], jest.fn()),
            error: "It broke.",
        }));
        expect(screen.getByText("The first commit")).toBeTruthy();
        expect(screen.getByText("It broke.").getAttribute("data-id")).toBe("commits-error");
        expect(screen.queryByText("Loading the commits.")).toBeNull();
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        renderList(undefined, undefined, onSelectCommit);
        fireEvent.click(screen.getByText("The second commit"));
        expect(onSelectCommit).toHaveBeenCalledWith(secondCommit.hash);
    });
});

describe("CommitList virtual list", () => {
    test("draws only the rows in view and a few more, each placed below the one before", () => {
        const commits = makeCommits(200);
        const { container } = render(createElement(CommitList, listProps(commits, jest.fn())));
        expect(screen.getByText("Commit 0")).toBeTruthy();
        expect(screen.queryByText("Commit 199")).toBeNull();
        const rows = container.querySelectorAll("li");
        expect(rows.length).toBeGreaterThan(FAKE_LIST_HEIGHT_PX / COMMIT_ROW_HEIGHT_PX);
        expect(rows.length).toBeLessThan(30);
        expect((rows[1] as HTMLElement).style.transform).toBe(`translateY(${COMMIT_LIST_PADDING_PX + COMMIT_ROW_HEIGHT_PX}px)`);
        expect((container.querySelector("[data-id=\"commit-list\"]") as HTMLElement).style.height).toBe(`${COMMIT_LIST_PADDING_PX * 2 + COMMIT_ROW_HEIGHT_PX * 200}px`);
    });

    test("calls onNearEnd only once the last drawn row is near the last commit", () => {
        const onNearEnd = jest.fn();
        const commits = makeCommits(200);
        const { container } = render(createElement(CommitList, listProps(commits, onNearEnd)));
        expect(onNearEnd).not.toHaveBeenCalled();

        const scrollArea = container.querySelector("[data-id=\"commit-list-scroll\"]") as HTMLElement;
        act(() => {
            scrollArea.scrollTop = COMMIT_ROW_HEIGHT_PX * 190;
            scrollArea.dispatchEvent(new Event("scroll"));
        });
        expect(screen.getByText("Commit 199")).toBeTruthy();
        expect(onNearEnd).toHaveBeenCalled();
    });

    test("calls onNearEnd at once when the commits read do not fill the list", () => {
        const onNearEnd = jest.fn();
        render(createElement(CommitList, listProps(makeCommits(5), onNearEnd)));
        expect(onNearEnd).toHaveBeenCalledTimes(1);
    });

    test("calls onNearEnd for no rows, because the list draws none", () => {
        const onNearEnd = jest.fn();
        render(createElement(CommitList, listProps([], onNearEnd)));
        expect(onNearEnd).not.toHaveBeenCalled();
    });

    test("scrolls the selected commit's row into view by the least amount", () => {
        const commits = makeCommits(200);
        const props = listProps(commits, jest.fn());
        const { rerender } = render(createElement(CommitList, props));
        layout.scrollTo.mockClear();
        act(() => {
            rerender(createElement(CommitList, {
                ...props,
                selectedHash: commits[100].hash,
            }));
        });
        const rowEnd = COMMIT_LIST_PADDING_PX + COMMIT_ROW_HEIGHT_PX * 101;
        expect(layout.scrollTo).toHaveBeenCalledWith({
            top: rowEnd - FAKE_LIST_HEIGHT_PX,
            behavior: "auto",
        });
        expect(screen.getByText("Commit 100")).toBeTruthy();
    });

    test("scrolls nothing for a selected commit the list does not hold", () => {
        const props = listProps(makeCommits(200), jest.fn());
        const { rerender } = render(createElement(CommitList, props));
        layout.scrollTo.mockClear();
        rerender(createElement(CommitList, {
            ...props,
            selectedHash: "ffff",
        }));
        expect(layout.scrollTo).not.toHaveBeenCalled();
    });
});

describe("lastRowIndex", () => {
    test("picks the index of the last row drawn, or undefined when none is drawn", () => {
        expect(lastRowIndex([])).toBeUndefined();
        expect(lastRowIndex([{
            key: "a",
            index: 3,
            start: 0,
            end: 36,
            size: 36,
            lane: 0,
        }, {
            key: "b",
            index: 4,
            start: 36,
            end: 72,
            size: 36,
            lane: 0,
        }])).toBe(4);
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
