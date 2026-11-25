//
// The "Commit details" pane: the column that opens to the right of the commit details pane, in the
// place a file's diff opens, when its "Commit details" row is opened, with the commit's full
// message, author, committer, dates, hash and parents.
//

import { JSX, ReactNode } from "react";
import { ICommit } from "../../../lib/commits";
import { formatDateTime, IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { CollapsedStrip } from "./collapse";
import { CloseButton, collapseHandler, MaximiseButton, PaneHeader } from "./pane-header";
import { paneWidthClass } from "./pane-width";

//
// What the "Commit details" pane is given and what it reports.
//
export interface ICommitInfoPaneProps {
    // The commit to show, as the commit details pane read it.
    commit: ICommit;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Whether the pane is maximised, filling the repo explorer, which its maximise button shows.
    isMaximised: boolean;

    // Called when the user clicks the pane's maximise button.
    onToggleMaximise(): void;

    // Whether the pane is collapsed into a narrow strip, which the pane draws in its place.
    isCollapsed: boolean;

    // Called when the user clicks the collapse button or the strip's restore button.
    onToggleCollapse(): void;

    // The locale and time zone the commit's dates are shown in.
    dateFormat: IDateFormatOptions;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Shows the commit in a rounded card headed "Commit details", with a button that maximises the pane and restores it and a button that closes the pane,
// as the style guide's full commit details pane lays it out: the commit's title in bold, its
// description muted under it when the message has more than a title, then its facts in a column
// of labels and a column of values: who wrote it and when, who made it and when, its hash and its
// parents. The card is as wide as the file pane's card, whose place it takes. Its border is in the
// style guide's active pane colour while the pane is active. The page's AnimatedPane column
// animates it as it opens and closes. While it is collapsed it draws the strip with "Commit
// details" down it in its place.
//
export function CommitInfoPane({ commit, isActive, isMaximised, onToggleMaximise, isCollapsed, onToggleCollapse, dateFormat, onClose }: ICommitInfoPaneProps): JSX.Element {
    if (isCollapsed) {
        return <CollapsedStrip paneLabel="Full commit details" title="Commit details" paneDataId="commit-info-pane" isActive={isActive} onRestore={onToggleCollapse} />;
    }
    return (
        <section data-id="commit-info-pane" aria-label="Full commit details" className={`flex ${paneWidthClass("w-[min(840px,calc(100cqw-var(--space-6)*2))]", isMaximised)} flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title="Commit details" titleDataId="commit-info-heading" collapseDataId="commit-info-pane-collapse" onCollapse={collapseHandler(isMaximised, onToggleCollapse)} action={(
                <>
                    <MaximiseButton isMaximised={isMaximised} dataId="commit-info-maximise" onToggleMaximise={onToggleMaximise} />
                    <CloseButton paneLabel="Full commit details" dataId="commit-info-close" onClose={onClose} />
                </>
            )} />
            <div className="min-h-0 flex-1 overflow-auto">
                <div className="flex flex-col gap-4 p-4">
                    <div className="flex flex-col gap-2">
                        <h3 data-id="commit-details-title" className="text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">{commit.title}</h3>
                        {commit.description !== "" && (
                            <p data-id="commit-details-description" className="whitespace-pre-wrap text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.description}</p>
                        )}
                    </div>
                    <dl className="grid grid-cols-[auto_minmax(0,1fr)] items-baseline gap-x-4 gap-y-2">
                        <Fact label="Authored" dataId="commit-details-author">
                            <PersonAndDate name={commit.authorName} email={commit.authorEmail} date={formatDateTime(commit.authorDate, dateFormat)} />
                        </Fact>
                        <Fact label="Committed" dataId="commit-details-committer">
                            <PersonAndDate name={commit.committerName} email={commit.committerEmail} date={formatDateTime(commit.committerDate, dateFormat)} />
                        </Fact>
                        <Fact label="Hash" dataId="commit-details-hash">
                            <code className="break-all font-[family-name:var(--font-mono)]">{commit.hash}</code>
                        </Fact>
                        <Fact label={parentsLabel(commit.parentHashes)} dataId="commit-details-parents">
                            <Parents parentHashes={commit.parentHashes} />
                        </Fact>
                    </dl>
                </div>
            </div>
        </section>
    );
}

//
// What one of the commit's facts shows.
//
export interface IFactProps {
    // The fact's label, as in "Hash".
    label: string;

    // The data-id of the fact's value, so a smoke test can read it.
    dataId: string;

    // The fact's value.
    children: ReactNode;
}

//
// Shows one labelled fact of the commit: the label small and muted in the column of labels, the
// value beside it, as the style guide's commit details do.
//
export function Fact({ label, dataId, children }: IFactProps): JSX.Element {
    return (
        <>
            <dt className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{label}</dt>
            <dd data-id={dataId} className="min-w-0 text-[length:var(--text-sm)] text-[var(--color-text)]">{children}</dd>
        </>
    );
}

//
// What a person and date fact shows.
//
export interface IPersonAndDateProps {
    // The person's name.
    name: string;

    // The person's email address.
    email: string;

    // When they acted, already formatted.
    date: string;
}

//
// Shows a person and when they acted: the name, the email address muted after it and the date
// muted on the line below, as the style guide's commit details do.
//
export function PersonAndDate({ name, email, date }: IPersonAndDateProps): JSX.Element {
    return (
        <div className="flex flex-col">
            <span className="truncate">
                {name} <span className="text-[var(--color-text-muted)]">&lt;{email}&gt;</span>
            </span>
            <span className="text-[var(--color-text-muted)]">{date}</span>
        </div>
    );
}

//
// Picks the label of the parents fact: "Parent" for one parent and "Parents" for none or several.
//
export function parentsLabel(parentHashes: string[]): string {
    if (parentHashes.length === 1) {
        return "Parent";
    }
    return "Parents";
}

//
// What the parents fact shows.
//
export interface IParentsProps {
    // The full hashes of the commit's parents.
    parentHashes: string[];
}

//
// Shows the commit's parents as their short hashes in the code font, or says in muted text that
// the commit is the first, which has none.
//
export function Parents({ parentHashes }: IParentsProps): JSX.Element {
    if (parentHashes.length === 0) {
        return <span className="text-[var(--color-text-muted)]">None, this is the first commit</span>;
    }
    return <code className="whitespace-pre font-[family-name:var(--font-mono)]">{parentsText(parentHashes)}</code>;
}

//
// Writes the commit's parents as their short hashes, two spaces apart, as the style guide's commit
// details write them.
//
export function parentsText(parentHashes: string[]): string {
    return parentHashes.map(parentHash => parentHash.slice(0, 7)).join("  ");
}
