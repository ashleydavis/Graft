//
// The commit pane: the first column of the commits page, which holds the commit list. It never
// shrinks, so the panes that open to its right never hide or cut it off.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";
import { CommitList } from "./commit-list";

//
// What the commit pane shows and what it reports.
//
export interface ICommitPaneProps {
    // The commits, or undefined until they are read.
    commits: ICommit[] | undefined;

    // Why the commits could not be read, or undefined.
    error: string | undefined;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
}

//
// Shows the commit list in a column that keeps its full width.
//
export function CommitPane({ commits, error, onSelectCommit }: ICommitPaneProps): JSX.Element {
    return (
        <section data-id="commit-pane" className="flex-none">
            <CommitList commits={commits} error={error} onSelectCommit={onSelectCommit} />
        </section>
    );
}
