//
// The commit pane: the first column of the commits page, a card that holds the commit list. It
// never shrinks, so the panes that open to its right never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { IDateFormatOptions } from "../../../lib/date-format";
import { CommitList } from "./commit-list";

//
// What the commit pane shows and what it reports.
//
export interface ICommitPaneProps {
    // The commits, or undefined until they are read.
    commits: ICommit[] | undefined;

    // Why the commits could not be read, or undefined.
    error: string | undefined;

    // The hash of the commit whose details are open, which the list highlights, or undefined.
    selectedHash: string | undefined;

    // The locale and time zone each commit's date is shown in.
    dateFormat: IDateFormatOptions;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
}

//
// Shows the commit list in a rounded card of fixed width, as the Graft UI mockup shows it. The list
// scrolls inside the card when it is taller than the window.
//
export function CommitPane({ commits, error, selectedHash, dateFormat, onSelectCommit }: ICommitPaneProps): JSX.Element {
    return (
        <section data-id="commit-pane" className="max-h-[75vh] w-[640px] flex-none overflow-y-auto rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/5">
            <CommitList commits={commits} error={error} selectedHash={selectedHash} dateFormat={dateFormat} onSelectCommit={onSelectCommit} />
        </section>
    );
}
