//
// The commit list: the commits page's list of commits, one row each, or what it shows in their
// place while they load or when they could not be read.
//

import { faCloud, faCodeBranch, faTag, IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Chip, List, ListItemButton, Tooltip } from "@mui/material";
import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { formatDate, IDateFormatOptions } from "../../../lib/date-format";

//
// What the commit list shows: the commits once they are read, or why they could not be and what
// it reports.
//
export interface ICommitListProps {
    // The commits, or undefined until they are read.
    commits: ICommit[] | undefined;

    // Why the commits could not be read, or undefined.
    error: string | undefined;

    // The hash of the selected commit, which the list shows as selected, or undefined.
    selectedHash: string | undefined;

    // The hash of the commit whose details are open, whose row the list marks with a bar at its
    // left edge and a bold title, or undefined.
    openHash: string | undefined;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
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
// Lists the commits, one row each with its title, refs, author, date and short hash, or shows that
// the commits are loading or why they could not be read. Each row is a MaterialUI ListItemButton,
// so the selected commit shows the selected background, and the open commit's row has a bar at its
// left edge and a bold title, as in the style guide's commit list. The refs keep a column of their
// own, so the author, date and hash line up from row to row. Clicking a commit reports its hash.
//
export function CommitList({ commits, error, selectedHash, openHash, dateFormat, onSelectCommit }: ICommitListProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commits-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (commits === undefined) {
        return <p data-id="commits-loading" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the commits.</p>;
    }
    return (
        <List data-id="commit-list" disablePadding={true} className="py-2">
            {commits.map(commit => {
                const isOpen = commit.hash === openHash;
                return (
                    <ListItemButton
                        key={commit.hash}
                        component="li"
                        data-id={`commit-${commit.hash}`}
                        selected={commit.hash === selectedHash}
                        aria-current={isOpen ? "true" : undefined}
                        onClick={() => onSelectCommit(commit.hash)}
                        className={`flex min-h-[calc(var(--space-8)+var(--space-1))] items-center gap-3 rounded-none px-3 py-0 ${openRowClass(isOpen)}`}
                    >
                        <Tooltip title={commit.title} enterDelay={500}>
                            <span className={`min-w-0 flex-1 truncate text-[var(--color-text)] ${titleWeightClass(isOpen)}`}>{commit.title}</span>
                        </Tooltip>
                        <span className="flex min-w-[calc(var(--space-8)*5)] flex-none items-center gap-1">
                            {commit.refs.map(ref => <RefBadge key={ref} gitRef={ref} />)}
                        </span>
                        <span className="w-[80px] flex-none truncate text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.authorName}</span>
                        <span className="w-[52px] flex-none text-right text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{formatDate(commit.authorDate, dateFormat)}</span>
                        <code className="flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.hash.slice(0, 7)}</code>
                    </ListItemButton>
                );
            })}
        </List>
    );
}

//
// The kinds of ref a badge marks, one Chip variant each.
//
export type RefBadgeKind = "current" | "branch" | "remote" | "tag";

//
// The kind of a ref and the name its badge shows.
//
export interface IRefBadge {
    // The kind of ref, which picks the badge's look and icon.
    kind: RefBadgeKind;

    // The name the badge shows, as in "main" or "v1.0".
    name: string;
}

//
// The icon of each kind of ref, as the style guide's badges have them.
//
export const refIcons: Record<RefBadgeKind, IconDefinition> = {
    current: faCodeBranch,
    branch: faCodeBranch,
    remote: faCloud,
    tag: faTag,
};

//
// Works out the kind and name of a ref as git log's %D names it: "HEAD -> main" is the checked-out
// branch, shown as "main", "tag: v1" a tag shown without its prefix, a name under origin/ a remote
// branch and any other name a local branch, as the style guide's commit list reads them.
//
export function refBadge(gitRef: string): IRefBadge {
    if (gitRef.startsWith("HEAD -> ")) {
        return {
            kind: "current",
            name: gitRef.slice("HEAD -> ".length),
        };
    }
    if (gitRef.startsWith("tag: ")) {
        return {
            kind: "tag",
            name: gitRef.slice("tag: ".length),
        };
    }
    if (gitRef.startsWith("origin/")) {
        return {
            kind: "remote",
            name: gitRef,
        };
    }
    return {
        kind: "branch",
        name: gitRef,
    };
}

//
// What a ref badge shows: one ref as git names it.
//
export interface IRefBadgeProps {
    // The ref as git log's %D names it: "HEAD -> main", "tag: v1.0" or a branch such as "main".
    gitRef: string;
}

//
// Shows one ref as a badge in the style guide's ref badge look (graft-theme.ts's Chip variants):
// the checked-out branch filled in the accent colour, every other ref outlined in the colour of its
// kind, each with its kind's icon before its name.
//
export function RefBadge({ gitRef }: IRefBadgeProps): JSX.Element {
    const badge = refBadge(gitRef);
    return <Chip variant={badge.kind} icon={<FontAwesomeIcon icon={refIcons[badge.kind]} />} label={badge.name} />;
}
