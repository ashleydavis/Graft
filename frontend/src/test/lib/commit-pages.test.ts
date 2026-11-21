//
// Tests the paging of the commit list: builds pages of commits, reads them in with the results of
// commits tasks and checks the next page is wanted only near the end of the commits read, never
// while a page is being read, after the last page or after a failed read, that a stale task's
// result is dropped and that each page starts after the last commit read.
//

import { canReadNextPage, COMMIT_PAGE_SIZE, commitPagesAfterRead, commitPagesReading, isNearEnd, NEAR_END_ROW_COUNT, nextPageAfterHash, noCommitPages } from "../../lib/commit-pages";
import { ICommit } from "../../lib/commits";

//
// Makes the count of commits, starting at the index, each with a hash of its own made from its
// index.
//
function makeCommits(firstIndex: number, count: number): ICommit[] {
    return Array.from({
        length: count,
    }, (unusedValue, offset) => ({
        hash: (firstIndex + offset).toString(16).padStart(40, "0"),
        parentHashes: [],
        refs: [],
        authorName: "Ada Author",
        authorEmail: "ada@example.com",
        authorDate: new Date("2026-01-01T00:00:00Z"),
        committerName: "Ada Author",
        committerEmail: "ada@example.com",
        committerDate: new Date("2026-01-01T00:00:00Z"),
        title: `Commit ${firstIndex + offset}`,
        description: "",
    }));
}

describe("commit pages", () => {
    test("start with no commits, no read under way and more to read", () => {
        expect(noCommitPages.commits).toEqual([]);
        expect(canReadNextPage(noCommitPages)).toBe(true);
        expect(nextPageAfterHash(noCommitPages)).toBeUndefined();
    });

    test("read no other page while one is being read", () => {
        const reading = commitPagesReading(noCommitPages, "t1");
        expect(reading.readTaskId).toBe("t1");
        expect(canReadNextPage(reading)).toBe(false);
    });

    test("add a full page and want the next one, which starts after its last commit", () => {
        const firstPage = makeCommits(0, COMMIT_PAGE_SIZE);
        const pages = commitPagesAfterRead(commitPagesReading(noCommitPages, "t1"), "t1", {
            ok: true,
            value: firstPage,
        });
        expect(pages.commits).toEqual(firstPage);
        expect(pages.readTaskId).toBeUndefined();
        expect(pages.hasReadLastPage).toBe(false);
        expect(canReadNextPage(pages)).toBe(true);
        expect(nextPageAfterHash(pages)).toBe(firstPage[COMMIT_PAGE_SIZE - 1].hash);
    });

    test("add the next page after the first and stop after a page shorter than the page size", () => {
        const firstPage = makeCommits(0, COMMIT_PAGE_SIZE);
        const lastPage = makeCommits(COMMIT_PAGE_SIZE, 3);
        const afterFirst = commitPagesAfterRead(commitPagesReading(noCommitPages, "t1"), "t1", {
            ok: true,
            value: firstPage,
        });
        const afterLast = commitPagesAfterRead(commitPagesReading(afterFirst, "t2"), "t2", {
            ok: true,
            value: lastPage,
        });
        expect(afterLast.commits).toEqual([...firstPage, ...lastPage]);
        expect(afterLast.hasReadLastPage).toBe(true);
        expect(canReadNextPage(afterLast)).toBe(false);
    });

    test("stop after an empty page, which follows a last page that was exactly full", () => {
        const pages = commitPagesAfterRead(commitPagesReading(noCommitPages, "t1"), "t1", {
            ok: true,
            value: [],
        });
        expect(pages.commits).toEqual([]);
        expect(pages.hasReadLastPage).toBe(true);
        expect(canReadNextPage(pages)).toBe(false);
    });

    test("keep the commits read and record why a page could not be read, and read no more", () => {
        const firstPage = makeCommits(0, COMMIT_PAGE_SIZE);
        const afterFirst = commitPagesAfterRead(commitPagesReading(noCommitPages, "t1"), "t1", {
            ok: true,
            value: firstPage,
        });
        const failed = commitPagesAfterRead(commitPagesReading(afterFirst, "t2"), "t2", {
            ok: false,
            error: {
                name: "TaskFailed",
                message: "Running git log failed.",
            },
        });
        expect(failed.commits).toEqual(firstPage);
        expect(failed.readTaskId).toBeUndefined();
        expect(failed.error).toBe("Running git log failed.");
        expect(canReadNextPage(failed)).toBe(false);
    });

    test("drop the result of a task other than the one reading", () => {
        const reading = commitPagesReading(noCommitPages, "t2");
        const pages = commitPagesAfterRead(reading, "t1", {
            ok: true,
            value: makeCommits(0, 3),
        });
        expect(pages).toBe(reading);
    });
});

describe("isNearEnd", () => {
    test("is true once the last drawn row is within NEAR_END_ROW_COUNT rows of the last commit", () => {
        expect(isNearEnd(100 - NEAR_END_ROW_COUNT - 1, 100)).toBe(false);
        expect(isNearEnd(100 - NEAR_END_ROW_COUNT, 100)).toBe(true);
        expect(isNearEnd(99, 100)).toBe(true);
        expect(isNearEnd(4, 5)).toBe(true);
    });
});
