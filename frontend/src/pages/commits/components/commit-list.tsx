//
// The commit list: the commits page's list of commits, one row each, or what it shows in their
// place while they load or when they could not be read.
//

import { Chip, List, ListItemButton } from "@mui/material";
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

    // The hash of the commit whose details are open, whose title the list makes bold, or
    // undefined.
    openHash: string | undefined;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
}

//
// Lists the commits, one row each with its title, refs, author, date and short hash, or shows that
// the commits are loading or why they could not be read. Each row is a MaterialUI ListItemButton,
// so the selected commit shows MaterialUI's own selection styling, and the open commit's title is
// bold, as in the Graft UI mockup. Clicking a commit reports its hash.
//
export function CommitList({ commits, error, selectedHash, openHash, dateFormat, onSelectCommit }: ICommitListProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commits-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (commits === undefined) {
        return <p data-id="commits-loading" className="animate-pulse p-4 text-[var(--color-text-muted)]">Loading the commits.</p>;
    }
    return (
        <List data-id="commit-list" disablePadding={true}>
            {commits.map(commit => {
                const isOpen = commit.hash === openHash;
                return (
                    <ListItemButton
                        key={commit.hash}
                        component="li"
                        data-id={`commit-${commit.hash}`}
                        selected={commit.hash === selectedHash}
                        onClick={() => onSelectCommit(commit.hash)}
                        className={`flex h-[36px] items-center gap-3 px-4 ${isOpen ? "font-[var(--weight-bold)]" : ""}`}
                    >
                        <span title={commit.title} className="min-w-0 flex-1 truncate text-[length:var(--text-md)] text-[var(--color-text)]">{commit.title}</span>
                        {commit.refs.map(ref => <RefChip key={ref} gitRef={ref} />)}
                        <span className="w-28 flex-none truncate text-right text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{commit.authorName}</span>
                        <span className="w-20 flex-none text-right text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{formatDate(commit.authorDate, dateFormat)}</span>
                        <code className="w-16 flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{commit.hash.slice(0, 7)}</code>
                    </ListItemButton>
                );
            })}
        </List>
    );
}

//
// What a ref chip shows: one ref as git names it.
//
export interface IRefChipProps {
    // The ref as git log's %D names it: "HEAD -> main", "tag: v1.0" or a branch such as "main".
    gitRef: string;
}

//
// Shows one ref as a small chip in the style guide's ref badge colours (graft-theme.ts): HEAD
// filled in the accent colour, a tag outlined in the warning colour with its "tag: " prefix left
// off, a remote branch outlined in the info colour and any other branch outlined in the accent
// colour.
//
export function RefChip({ gitRef }: IRefChipProps): JSX.Element {
    if (gitRef.startsWith("HEAD")) {
        return <Chip size="small" label={gitRef} variant="current" />;
    }
    if (gitRef.startsWith("tag: ")) {
        return <Chip size="small" label={gitRef.slice("tag: ".length)} variant="tag" />;
    }
    if (gitRef.startsWith("origin/")) {
        return <Chip size="small" label={gitRef} variant="remote" />;
    }
    return <Chip size="small" label={gitRef} variant="branch" />;
}
