//
// The commit pane: the repo explorer's column to the right of the repo details pane, a card headed
// "Commits" that holds the commit list. It never shrinks, so the panes that open to its right
// never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { CommitList } from "./commit-list";
import { PaneHeader } from "./pane-header";

//
// What the commit pane shows and what it reports.
//
export interface ICommitPaneProps {
    // The commits, or undefined until they are read.
    commits: ICommit[] | undefined;

    // Why the commits could not be read, or undefined.
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
}

//
// Shows the commit list in a rounded card 850 pixels wide, or the width of the page's visible area
// when that is narrower, so the card is never cut off, as tall as the page leaves room for, as
// the style guide's commit explorer shows it. The list scrolls inside the card below its header
// when it is taller than the card. The card's border is in the style guide's active pane colour
// while the pane is active.
//
export function CommitPane({ commits, error, selectedHash, openHash, isActive, dateFormat, onSelectCommit }: ICommitPaneProps): JSX.Element {
    return (
        <section data-id="commit-pane" aria-label="Commits" className={`flex w-[min(850px,calc(100cqw-var(--space-6)*2))] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title="Commits" titleDataId="commit-pane-heading" action={undefined} />
            <div className="min-h-0 flex-1 overflow-auto">
                <CommitList commits={commits} error={error} selectedHash={selectedHash} openHash={openHash} dateFormat={dateFormat} onSelectCommit={onSelectCommit} />
            </div>
        </section>
    );
}
