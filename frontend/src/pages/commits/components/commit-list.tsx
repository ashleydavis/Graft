//
// The commit list: the commits page's plain list of commits, or what it shows in their place while
// they load or when they could not be read.
//

import { JSX } from "react";
import { ICommit } from "../../../lib/commits";

//
// What the commit list shows: the commits once they are read, or why they could not be and what
// it reports.
//
export interface ICommitListProps {
    // The commits, or undefined until they are read.
    commits: ICommit[] | undefined;

    // Why the commits could not be read, or undefined.
    error: string | undefined;

    // Called with the hash of the commit the user clicks.
    onSelectCommit(hash: string): void;
}

//
// Lists the commits, each with its title, author and short hash, or says the commits are loading or
// why they could not be read. Clicking a commit reports its hash.
//
export function CommitList({ commits, error, onSelectCommit }: ICommitListProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commits-error">{error}</p>;
    }
    if (commits === undefined) {
        return <p data-id="commits-loading">Loading the commits.</p>;
    }
    return (
        <ul data-id="commit-list">
            {commits.map(commit => (
                <li key={commit.hash} data-id={`commit-${commit.hash}`} onClick={() => onSelectCommit(commit.hash)}>
                    {commit.title} ({commit.authorName}, {commit.hash.slice(0, 7)})
                </li>
            ))}
        </ul>
    );
}
