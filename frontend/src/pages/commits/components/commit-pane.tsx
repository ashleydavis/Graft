//
// The commit pane: the first column of the commits page, a card that holds the commit list. It
// never shrinks, so the panes that open to its right never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { CommitList } from "./commit-list";

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

    // The hash of the commit whose details are open, whose title the list makes bold, or
    // undefined.
    openHash: string | undefined;

    // Whether the pane is the commit explorer's active pane, which its border shows.
    isActive: boolean;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
}

//
// Shows the commit list in a rounded card of fixed width, as the Graft UI mockup shows it. The list
// scrolls inside the card when it is taller than the window. The card's border is in the style
// guide's active pane colour while the pane is active.
//
export function CommitPane({ commits, error, selectedHash, openHash, isActive, dateFormat, onSelectCommit }: ICommitPaneProps): JSX.Element {
    return (
        <section data-id="commit-pane" className={`max-h-[75vh] w-[640px] flex-none overflow-y-auto py-2 rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <CommitList commits={commits} error={error} selectedHash={selectedHash} openHash={openHash} dateFormat={dateFormat} onSelectCommit={onSelectCommit} />
        </section>
    );
}
