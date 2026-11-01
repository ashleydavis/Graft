//
// The commit details pane: the column that opens to the right of the commit pane when a commit is
// clicked, with the commit's details and the files it changed. Its content is unstyled.
//

import { JSX, useEffect, useState } from "react";
import { ICommitDetails, readCommitDetails } from "../../../lib/commit-details";
import { CommitsBridge } from "../../../lib/commits";

//
// What the commit details pane is given and what it reports.
//
export interface ICommitDetailsPaneProps {
    // The bridge the commit details task is queued through: window.ziggy in the app.
    bridge: CommitsBridge;

    // The repo to read.
    repoPath: string;

    // The hash of the commit to show.
    hash: string;

    // Called with the path of the changed file the user clicks.
    onSelectFile(path: string): void;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the commit's details and changed files with the commit details task and shows them, with
// a button that closes the pane. It shows that it is loading until the task ends and what went
// wrong when the commit could not be read.
//
export function CommitDetailsPane({ bridge, repoPath, hash, onSelectFile, onClose }: ICommitDetailsPaneProps): JSX.Element {
    const [details, setDetails] = useState<ICommitDetails | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readCommitDetails(bridge, {
            taskId: `commit-details-${Date.now()}-${Math.random()}`,
            repoPath,
            hash,
        }, result => {
            if (result.ok) {
                setDetails(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [bridge, repoPath, hash]);

    return (
        <section data-id="commit-details-pane" className="flex-none border-l pl-4">
            <button type="button" data-id="commit-details-close" onClick={onClose}>Close</button>
            <CommitDetailsContent details={details} error={error} onSelectFile={onSelectFile} />
        </section>
    );
}

//
// What the content of the commit details pane shows.
//
export interface ICommitDetailsContentProps {
    // The commit and its changed files, or undefined until they are read.
    details: ICommitDetails | undefined;

    // Why the commit could not be read, or undefined.
    error: string | undefined;

    // Called with the path of the changed file the user clicks.
    onSelectFile(path: string): void;
}

//
// Shows the commit's details and its changed files, or says the commit is loading or why it could
// not be read.
//
export function CommitDetailsContent({ details, error, onSelectFile }: ICommitDetailsContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commit-details-error">{error}</p>;
    }
    if (details === undefined) {
        return <p data-id="commit-details-loading">Loading the commit.</p>;
    }
    const commit = details.commit;
    return (
        <div data-id="commit-details">
            <p data-id="commit-details-title">{commit.title}</p>
            <p data-id="commit-details-description">{commit.description}</p>
            <p data-id="commit-details-hash">Hash: {commit.hash}</p>
            <p data-id="commit-details-parents">Parents: {commit.parentHashes.length > 0 ? commit.parentHashes.join(", ") : "none"}</p>
            <p data-id="commit-details-author">Author: {commit.authorName} ({commit.authorEmail}) on {commit.authorDate.toISOString()}</p>
            <p data-id="commit-details-committer">Committer: {commit.committerName} ({commit.committerEmail}) on {commit.committerDate.toISOString()}</p>
            <p>Changed files:</p>
            <ul data-id="changed-files">
                {details.changedFiles.map(file => (
                    <li key={file.path} data-id={`changed-file-${file.path}`} onClick={() => onSelectFile(file.path)}>
                        {file.status} {file.path}
                    </li>
                ))}
            </ul>
        </div>
    );
}
