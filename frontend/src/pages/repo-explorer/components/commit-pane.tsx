//
// The commit pane: the repo explorer's column to the right of the repo details pane, a card headed
// "Commits" that holds the commit list, with a button that closes it. It never shrinks, so the
// panes that open to its right never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { CommitList } from "./commit-list";
import { CloseButton, PaneHeader } from "./pane-header";

//
// What the commit pane shows and what it reports.
//
export interface ICommitPaneProps {
    // The commits read so far, newest first.
    commits: ICommit[];

    // Whether a page of commits is being read.
    isLoading: boolean;

    // Why the last page of commits could not be read, or undefined.
    error: string | undefined;

    // The hash of the selected commit, which the list shows as selected, or undefined.
    selectedHash: string | undefined;

    // The hash of the commit whose details are open, which the list marks as open, or undefined.
    openHash: string | undefined;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;

    // Called when the list has scrolled near the last commit read, so the next page is read.
    onNearEnd(): void;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Shows the commit list in a rounded card 850 pixels wide, or the width of the page's visible area
// when that is narrower, so the card is never cut off, as tall as the page leaves room for, as
// the style guide's commit explorer shows it. The list scrolls inside the card below its header
// when it is taller than the card, and the header's close button closes the pane. The card's
// border is in the style guide's active pane colour while the pane is active.
//
export function CommitPane({ commits, isLoading, error, selectedHash, openHash, isActive, dateFormat, onSelectCommit, onNearEnd, onClose }: ICommitPaneProps): JSX.Element {
    return (
        <section data-id="commit-pane" aria-label="Commits" className={`flex w-[min(850px,calc(100cqw-var(--space-6)*2))] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title="Commits" titleDataId="commit-pane-heading" action={<CloseButton paneLabel="Commits" dataId="commit-pane-close" onClose={onClose} />} />
            <CommitList commits={commits} isLoading={isLoading} error={error} selectedHash={selectedHash} openHash={openHash} dateFormat={dateFormat} onSelectCommit={onSelectCommit} onNearEnd={onNearEnd} />
        </section>
    );
}
