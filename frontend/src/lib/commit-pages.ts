//
// Keeps the pages of commits the commit pane has read so far, and works out when the next page is
// wanted, so the commit list can load every commit page by page as the user scrolls.
//

import { ICommit, ICommitPageStart, IReadCommitsError } from "./commits";
import { Result } from "./result";

//
// The most commits read in one page. It fills a tall window with room to spare, so the first page
// alone fills the commit pane and the next page is read only once the user scrolls.
//
export const COMMIT_PAGE_SIZE = 50;

//
// How close to the last commit read the commit list's last drawn row gets before the next page is
// read, in rows. It is under half a page, so the next page is read while the user still has rows
// to scroll through and usually arrives before they reach the end.
//
export const NEAR_END_ROW_COUNT = 20;

//
// The commits the commit pane has read so far and where the reading stands.
//
export interface ICommitPages {
    // Every commit read so far, newest first, the pages one after another.
    commits: ICommit[];

    // The id of the commits task reading the next page, or undefined while no page is being read.
    readTaskId: string | undefined;

    // Whether the last page read held the repo's first commit, so it was the last page.
    hasReadLastPage: boolean;

    // Why the last page could not be read, or undefined.
    error: string | undefined;
}

//
// The pages before any is read: no commits, no read under way and more to read. The commit pane
// starts from it each time it opens.
//
export const noCommitPages: ICommitPages = {
    commits: [],
    readTaskId: undefined,
    hasReadLastPage: false,
    error: undefined,
};

//
// Records that the commits task with the id is reading the next page, so the commit list shows its
// loading row and no other page is read until this one ends.
//
export function commitPagesReading(pages: ICommitPages, taskId: string): ICommitPages {
    return {
        ...pages,
        readTaskId: taskId,
    };
}

//
// Adds the page the commits task with the id read to the pages, or records why it could not be
// read. A page with fewer commits than the page size ends at the repo's first commit, so it is the
// last. The result of any other task, such as one queued before the commit pane closed and opened
// again, leaves the pages as they are, so the list holds only the pages read since the pane last
// opened.
//
export function commitPagesAfterRead(pages: ICommitPages, taskId: string, result: Result<ICommit[], IReadCommitsError>): ICommitPages {
    if (pages.readTaskId !== taskId) {
        return pages;
    }
    if (!result.ok) {
        return {
            ...pages,
            readTaskId: undefined,
            error: result.error.message,
        };
    }
    return {
        commits: [...pages.commits, ...result.value],
        readTaskId: undefined,
        hasReadLastPage: result.value.length < COMMIT_PAGE_SIZE,
        error: undefined,
    };
}

//
// Whether the next page can be read now: no page is being read, the last page has not been read
// and the last read did not fail. A failed read stays on screen until the commit pane opens again,
// so a broken repo runs git once each time the pane opens, however far the user scrolls.
//
export function canReadNextPage(pages: ICommitPages): boolean {
    if (pages.readTaskId !== undefined) {
        return false;
    }
    if (pages.hasReadLastPage) {
        return false;
    }
    return pages.error === undefined;
}

//
// Works out where the next page starts: from the first page's first commit, which the pane keeps
// as the start commit, skipping every commit read so far. Undefined before any commit is read, so
// the first page starts from HEAD.
//
export function nextPageStart(pages: ICommitPages): ICommitPageStart | undefined {
    if (pages.commits.length === 0) {
        return undefined;
    }
    return {
        hash: pages.commits[0].hash,
        skipCount: pages.commits.length,
    };
}

//
// Whether the commit list's last drawn row, at the index, is within NEAR_END_ROW_COUNT rows of the
// last commit read, so the next page is read before the user scrolls to the end.
//
export function isNearEnd(lastDrawnIndex: number, commitCount: number): boolean {
    return commitCount - lastDrawnIndex <= NEAR_END_ROW_COUNT;
}
