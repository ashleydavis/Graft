//
// The commit pane: the repo explorer's column to the right of the repo details pane, a card headed
// "Commits" that holds the commit list, with a button that closes it. It never shrinks, so the
// panes that open to its right never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { CollapsedStrip } from "./collapse";
import { CommitList } from "./commit-list";
import { CloseButton, collapseHandler, MaximiseButton, PaneHeader } from "./pane-header";
import { paneWidthClass } from "./pane-width";

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

    // Whether the last page of commits has been read.
    hasReadLastPage: boolean;

    // The hash of the selected commit, which the list shows as selected, or undefined.
    selectedHash: string | undefined;

    // The hash of the commit whose details are open, which the list marks as open, or undefined.
    openHash: string | undefined;

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
// when it is taller than the card. While the pane is maximised the card fills the repo explorer
// instead. The card's border is in the style guide's active pane colour while the pane is active.
// The header's buttons maximise the pane and restore it, and close it. While it is collapsed it
// draws the strip with "Commits" down it in its place.
//
export function CommitPane({ commits, isLoading, error, hasReadLastPage, selectedHash, openHash, isActive, isMaximised, onToggleMaximise, isCollapsed, onToggleCollapse, dateFormat, onSelectCommit, onNearEnd, onClose }: ICommitPaneProps): JSX.Element {
    if (isCollapsed) {
        return <CollapsedStrip paneLabel="Commits" title="Commits" paneDataId="commit-pane" isActive={isActive} onRestore={onToggleCollapse} />;
    }
    return (
        <section data-id="commit-pane" aria-label="Commits" className={`flex ${paneWidthClass("w-[min(850px,calc(100cqw-var(--space-6)*2))]", isMaximised)} flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title="Commits" titleDataId="commit-pane-heading" collapseDataId="commit-pane-collapse" onCollapse={collapseHandler(isMaximised, onToggleCollapse)} action={(
                <>
                    <MaximiseButton isMaximised={isMaximised} dataId="commit-pane-maximise" onToggleMaximise={onToggleMaximise} />
                    <CloseButton paneLabel="Commits" dataId="commit-pane-close" onClose={onClose} />
                </>
            )} />
            <CommitList commits={commits} isLoading={isLoading} error={error} hasReadLastPage={hasReadLastPage} selectedHash={selectedHash} openHash={openHash} dateFormat={dateFormat} onSelectCommit={onSelectCommit} onNearEnd={onNearEnd} />
        </section>
    );
}
