//
// The file pane: the column that opens to the right of the commit details pane when a changed file
// is clicked, with the file's diff in the commit. Its content is unstyled.
//

import { JSX, useEffect, useState } from "react";
import { CommitsBridge } from "../../../lib/commits";
import { readFileDiff } from "../../../lib/file-diff";

//
// What the file pane is given and what it reports.
//
export interface IFilePaneProps {
    // The bridge the file diff task is queued through: window.ziggy in the app.
    bridge: CommitsBridge;

    // The repo to read.
    repoPath: string;

    // The hash of the commit that changed the file.
    hash: string;

    // The path of the file from the root of the repo.
    path: string;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the file's diff with the file diff task and shows it under the file's path, with a button
// that closes the pane. It shows that it is loading until the task ends and what went wrong when
// the diff could not be read.
//
export function FilePane({ bridge, repoPath, hash, path, onClose }: IFilePaneProps): JSX.Element {
    const [diff, setDiff] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readFileDiff(bridge, {
            taskId: `file-diff-${Date.now()}-${Math.random()}`,
            repoPath,
            hash,
            path,
        }, result => {
            if (result.ok) {
                setDiff(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [bridge, repoPath, hash, path]);

    return (
        <section data-id="file-pane" className="flex-none border-l pl-4">
            <button type="button" data-id="file-pane-close" onClick={onClose}>Close</button>
            <p data-id="file-pane-path">{path}</p>
            <FileDiffContent diff={diff} error={error} />
        </section>
    );
}

//
// What the content of the file pane shows.
//
export interface IFileDiffContentProps {
    // The file's diff, or undefined until it is read.
    diff: string | undefined;

    // Why the diff could not be read, or undefined.
    error: string | undefined;
}

//
// Shows the file's diff as git wrote it, or says it is loading or why it could not be read.
//
export function FileDiffContent({ diff, error }: IFileDiffContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="file-diff-error">{error}</p>;
    }
    if (diff === undefined) {
        return <p data-id="file-diff-loading">Loading the diff.</p>;
    }
    return <pre data-id="file-diff">{diff}</pre>;
}
