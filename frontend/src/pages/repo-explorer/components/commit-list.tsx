//
// The commit list: the commit pane's scrolling list of commits, one row each, with a row under them
// while the next page loads or when it could not be read.
//

import { CircularProgress, List, ListItemButton, Tooltip } from "@mui/material";
import { useVirtualizer, VirtualItem } from "@tanstack/react-virtual";
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

    // Whether a page of commits is being read, which the loading row under the commits shows.
    isLoading: boolean;

    // Why the last page of commits could not be read, which the error row under the commits
    // shows, or undefined.
    error: string | undefined;

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
// Lists the commits in a virtual list built with TanStack Virtual, which draws only the rows in
// view and a few either side, so a repo with any number of commits scrolls smoothly. Each row shows
// the commit's title, refs, author, date and short hash. Each row is a MaterialUI ListItemButton,
// so the selected commit shows the selected background, and the open commit's row has a bar at its
// left edge and a bold title, as in the style guide's commit list. The refs keep a narrow column of
// their own after the title, which shows only the badges that fit, so the title always keeps its
// room and the author, date and hash line up from row to row. Clicking a commit calls
// onSelectCommit with its hash. Under the commits it shows a loading row while a page is read and
// an error row when one could not be read. When the last row drawn comes near the last commit read
// it calls onNearEnd, so the next page is read as the user scrolls. When the selected commit
// changes, it scrolls the least amount that brings the commit's row into view, so the selected row
// stays in sight as the arrow keys move it.
//
export function CommitList({ commits, isLoading, error, selectedHash, openHash, dateFormat, onSelectCommit, onNearEnd }: ICommitListProps): JSX.Element {
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
        <div ref={scrollRef} data-id="commit-list-scroll" className="min-h-0 flex-1 overflow-auto">
            <List data-id="commit-list" disablePadding={true} className="relative w-full" style={{
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
                            <code className="flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.hash.slice(0, 7)}</code>
                        </ListItemButton>
                    );
                })}
            </List>
            {isLoading && (
                <p data-id="commits-loading" className="flex h-[calc(var(--space-8)+var(--space-1))] items-center gap-2 px-4 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    <CircularProgress size={16} color="inherit" aria-label="Loading" />
                    Loading the commits.
                </p>
            )}
            {error !== undefined && (
                <p data-id="commits-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>
            )}
        </div>
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
