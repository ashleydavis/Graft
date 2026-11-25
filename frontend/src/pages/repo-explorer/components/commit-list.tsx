//
// The commit list: the commit pane's scrolling list of commits, one row each, under a header row
// naming the columns, with grey placeholder rows under them while the next page loads, an error row
// when it could not be read and a row once every commit has been read.
//

import { List, ListItemButton, Skeleton, Tooltip } from "@mui/material";
import { Rect, useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
import { JSX, useEffect, useRef } from "react";
import { isNearEnd } from "../../../lib/commit-pages";
import { ICommit } from "../../../lib/commits";
import { formatDate, IDateFormatOptions } from "../../../lib/date-format";
import { RefBadges } from "./ref-badges";

//
// What the commit list shows: the commits read so far, whether the next page is being read and
// why the last page could not be read, and what it reports.
//
export interface ICommitListProps {
    // The commits read so far, newest first.
    commits: ICommit[];

    // Whether a page of commits is being read, which the placeholder rows under the commits show.
    isLoading: boolean;

    // Why the last page of commits could not be read, which the error row under the commits
    // shows, or undefined.
    error: string | undefined;

    // Whether the last page of commits has been read, so the list holds every commit and the end
    // of list row under them shows.
    hasReadLastPage: boolean;

    // The hash of the selected commit, which the list shows as selected and scrolls into view, or
    // undefined.
    selectedHash: string | undefined;

    // The hash of the commit whose details are open, whose row the list marks with a bar at its
    // left edge and a bold title, or undefined.
    openHash: string | undefined;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;

    // Called when the last row drawn is near the last commit read, so the next page is read.
    onNearEnd(): void;
}

//
// The height of a commit row in pixels: --space-8 (32px) plus --space-1 (4px), the height the row's
// own classes give it, so the virtual list places each row where the one above it ends.
//
export const COMMIT_ROW_HEIGHT_PX = 36;

//
// The room above the first row and below the last, in pixels: --space-2, the padding the style
// guide's lists have.
//
export const COMMIT_LIST_PADDING_PX = 8;

//
// How many rows the virtual list draws beyond each edge of the visible ones, so a quick scroll or a
// key press shows rows that are already drawn.
//
export const COMMIT_ROW_OVERSCAN_COUNT = 5;

//
// How many placeholder rows show under the commits while a later page is read: enough to show that
// more commits are on the way, as the style guide's loading placeholder does with its rows.
//
export const LATER_PAGE_PLACEHOLDER_ROW_COUNT = 3;

//
// The widths of the title's placeholder in successive placeholder rows, in percent of the title's
// room, taken from the style guide's loading placeholder so the rows look like titles of different
// lengths.
//
export const PLACEHOLDER_TITLE_WIDTHS_PERCENT = [80, 65, 72];

//
// Works out how many placeholder rows to show while a page is read: enough to fill the visible
// part of the list, which is viewHeightPx tall, before the first page arrives, and
// LATER_PAGE_PLACEHOLDER_ROW_COUNT under the commits while a later page is read. Before the list's
// height is measured it shows LATER_PAGE_PLACEHOLDER_ROW_COUNT rows, so a placeholder shows from the
// first paint.
//
export function placeholderRowCount(commitCount: number, viewHeightPx: number): number {
    if (commitCount > 0) {
        return LATER_PAGE_PLACEHOLDER_ROW_COUNT;
    }
    return Math.max(LATER_PAGE_PLACEHOLDER_ROW_COUNT, Math.ceil(viewHeightPx / COMMIT_ROW_HEIGHT_PX));
}

//
// Reads the height in pixels of the list's scrolling area from the size the virtual list measured,
// so placeholderRowCount can fill it, or 0 while the virtual list has measured no size.
//
export function scrollAreaHeightPx(scrollRect: Rect | null): number {
    if (!scrollRect) {
        return 0;
    }
    return scrollRect.height;
}

//
// Picks the width of the title's placeholder in the placeholder row at the index, cycling through
// PLACEHOLDER_TITLE_WIDTHS_PERCENT.
//
export function placeholderTitleWidth(rowIndex: number): string {
    return `${PLACEHOLDER_TITLE_WIDTHS_PERCENT[rowIndex % PLACEHOLDER_TITLE_WIDTHS_PERCENT.length]}%`;
}

//
// The Tailwind classes of the bar a row draws at its left edge while what it stands for is open in
// the pane to its right, in the colour of a selection, as the style guide marks an open row.
//
export const openRowClasses = "shadow-[inset_2px_0_0_var(--color-select-item)]";

//
// Picks the Tailwind classes of a row's left edge: the open bar for an open row and no shadow for
// any other, so the commit list and the changed files mark the open row the same way.
//
export function openRowClass(isOpen: boolean): string {
    if (isOpen) {
        return openRowClasses;
    }
    return "shadow-none";
}

//
// The Tailwind classes of the hash column, which the header row's "Hash" and each row's short hash
// share: seven characters of the monospace font wide, so the header's name starts where the hashes
// do.
//
export const hashColumnClasses = "w-[7ch] flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)]";

//
// Picks the Tailwind class of the commit title's weight: bold for the open commit, normal for the
// rest.
//
export function titleWeightClass(isOpen: boolean): string {
    if (isOpen) {
        return "font-[var(--weight-bold)]";
    }
    return "font-[var(--weight-normal)]";
}

//
// The end of list row: its data-id and its text.
//
export interface IListEndRow {
    // The row's data-id.
    dataId: string;

    // The row's text.
    text: string;
}

//
// Picks the row the commit list shows under the commits once every commit has been read: "There
// are no commits." for a repo with none and "That is every commit." for any other, as the style
// guide's commit pane shows them. It is undefined while a page is being read, after a read failed
// and before the last page has been read, so the row never shows while more commits may come.
//
export function listEndRow(commitCount: number, isLoading: boolean, error: string | undefined, hasReadLastPage: boolean): IListEndRow | undefined {
    if (isLoading) {
        return undefined;
    }
    if (error !== undefined) {
        return undefined;
    }
    if (!hasReadLastPage) {
        return undefined;
    }
    if (commitCount === 0) {
        return {
            dataId: "commits-none",
            text: "There are no commits.",
        };
    }
    return {
        dataId: "commits-end",
        text: "That is every commit.",
    };
}

//
// Lists the commits in a virtual list built with TanStack Virtual, which draws only the rows in
// view and a few either side, so a repo with any number of commits scrolls smoothly. Each row shows
// the commit's title, refs, author, date and short hash. Each row is a MaterialUI ListItemButton,
// so the selected commit shows the selected background, and the open commit's row has a bar at its
// left edge and a bold title, as in the style guide's commit list. The refs keep a narrow column of
// their own after the title, which shows only the badges that fit, so the title always keeps its
// room and the author, date and hash line up from row to row. Clicking a commit calls
// onSelectCommit with its hash. While a page is read it shows grey placeholder rows under the
// commits, built from MaterialUI's Skeleton as the style guide's loading placeholder is, each the
// height of a commit row with grey blocks where the title, author, date and hash go. Before the
// first page they fill the visible part of the list. The list is marked busy for assistive
// technology while a page is read, and the placeholder rows are hidden from it. It shows an error
// row when a page could not be read, and once the last page has been read it shows the end of list
// row that listEndRow picks, in muted text as in the style guide. When the last row drawn comes near
// the last commit read it calls onNearEnd, so the next page is read as the user scrolls. When the
// selected commit changes, it scrolls the least amount that brings the commit's row into view, so
// the selected row stays in sight as the arrow keys move it. Above the scrolling area a header row
// names the columns, Message, Author, Date and Hash, each lined up with its column in the rows and
// styled as the style guide's table header, so it stays in view as the list scrolls. Over the
// badges' column it leaves a blank space of the same width.
//
export function CommitList({ commits, isLoading, error, hasReadLastPage, selectedHash, openHash, dateFormat, onSelectCommit, onNearEnd }: ICommitListProps): JSX.Element {
    const scrollRef = useRef<HTMLDivElement>(null);
    const virtualizer = useVirtualizer({
        count: commits.length,
        getScrollElement: () => scrollRef.current,
        estimateSize: () => COMMIT_ROW_HEIGHT_PX,
        getItemKey: index => commits[index].hash,
        overscan: COMMIT_ROW_OVERSCAN_COUNT,
        paddingStart: COMMIT_LIST_PADDING_PX,
        paddingEnd: COMMIT_LIST_PADDING_PX,
        useFlushSync: false,
    });
    const rows = virtualizer.getVirtualItems();
    const lastDrawnIndex = lastRowIndex(rows);
    const endRow = listEndRow(commits.length, isLoading, error, hasReadLastPage);

    useEffect(() => {
        if (lastDrawnIndex === undefined) {
            return;
        }
        if (isNearEnd(lastDrawnIndex, commits.length)) {
            onNearEnd();
        }
    }, [lastDrawnIndex, commits.length, isLoading, error]);

    useEffect(() => {
        const selectedIndex = commits.findIndex(commit => commit.hash === selectedHash);
        if (selectedIndex < 0) {
            return;
        }
        virtualizer.scrollToIndex(selectedIndex, {
            align: "auto",
            behavior: "auto",
        });
    }, [selectedHash]);

    return (
        <>
            <div data-id="commit-list-header" className="flex flex-none items-center gap-3 border-b border-[var(--color-border)] px-3 py-[var(--space-1)] text-[length:var(--text-sm)] leading-[var(--leading-normal)] font-[var(--weight-medium)] text-[var(--color-text-muted)] [scrollbar-gutter:stable] overflow-y-hidden">
                <span data-id="commit-list-header-message" className="min-w-0 flex-1 truncate">Message</span>
                <span className="w-[calc(var(--space-8)*5)] flex-none" />
                <span data-id="commit-list-header-author" className="w-[80px] flex-none truncate">Author</span>
                <span data-id="commit-list-header-date" className="w-[52px] flex-none text-right">Date</span>
                <span data-id="commit-list-header-hash" className={hashColumnClasses}>
                    <span className="font-[family-name:var(--font-sans)]">Hash</span>
                </span>
            </div>
            <div ref={scrollRef} data-id="commit-list-scroll" className="min-h-0 flex-1 overflow-auto [scrollbar-gutter:stable]">
                <List data-id="commit-list" aria-busy={isLoading} disablePadding={true} className="relative w-full" style={{
                    height: `${virtualizer.getTotalSize()}px`,
                }}>
                    {rows.map(row => {
                        const commit = commits[row.index];
                        const isOpen = commit.hash === openHash;
                        return (
                            <ListItemButton
                                key={row.key}
                                component="li"
                                data-id={`commit-${commit.hash}`}
                                selected={commit.hash === selectedHash}
                                aria-current={isOpen ? "true" : undefined}
                                onClick={() => onSelectCommit(commit.hash)}
                                className={`absolute left-0 top-0 flex h-[calc(var(--space-8)+var(--space-1))] w-full items-center gap-3 rounded-none px-3 py-0 ${openRowClass(isOpen)}`}
                                style={{
                                    transform: `translateY(${row.start}px)`,
                                }}
                            >
                                <Tooltip title={commit.title} enterDelay={500}>
                                    <span data-id={`commit-title-${commit.hash}`} className={`min-w-0 flex-1 truncate text-[var(--color-text)] ${titleWeightClass(isOpen)}`}>{commit.title}</span>
                                </Tooltip>
                                <RefBadges hash={commit.hash} refs={commit.refs} />
                                <span className="w-[80px] flex-none truncate text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.authorName}</span>
                                <span className="w-[52px] flex-none text-right text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{formatDate(commit.authorDate, dateFormat)}</span>
                                <code className={`${hashColumnClasses} text-[var(--color-text-muted)]`}>{commit.hash.slice(0, 7)}</code>
                            </ListItemButton>
                        );
                    })}
                </List>
                {isLoading && (
                    <div data-id="commits-placeholder" aria-hidden="true">
                        {Array.from({
                            length: placeholderRowCount(commits.length, scrollAreaHeightPx(virtualizer.scrollRect)),
                        }, (unusedValue, rowIndex) => (
                            <div key={rowIndex} data-id="commits-placeholder-row" className="flex h-[calc(var(--space-8)+var(--space-1))] w-full items-center gap-3 px-3">
                                <span className="min-w-0 flex-1">
                                    <Skeleton variant="text" width={placeholderTitleWidth(rowIndex)} />
                                </span>
                                <span className="w-[calc(var(--space-8)*5)] flex-none" />
                                <Skeleton variant="text" className="w-[80px] flex-none text-[length:var(--text-sm)]" />
                                <Skeleton variant="text" className="w-[52px] flex-none text-[length:var(--text-sm)]" />
                                <Skeleton variant="text" className="w-[7ch] flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)]" />
                            </div>
                        ))}
                    </div>
                )}
                {error !== undefined && (
                    <p data-id="commits-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>
                )}
                {endRow !== undefined && (
                    <p data-id={endRow.dataId} aria-live="polite" className="m-0 min-h-[var(--space-8)] px-[var(--space-4)] py-[var(--space-2)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{endRow.text}</p>
                )}
            </div>
        </>
    );
}

//
// Picks the index of the last row the virtual list draws, or undefined when it draws none, so the
// commit list can tell when the user has scrolled near the last commit read.
//
export function lastRowIndex(rows: VirtualItem[]): number | undefined {
    if (rows.length === 0) {
        return undefined;
    }
    return rows[rows.length - 1].index;
}
