//
// The file pane: the column that opens to the right of the commit details pane when a changed file
// is clicked, with the file's diff in the commit as plain text.
//

import { JSX, useEffect, useState } from "react";
import { readFileDiff } from "../../../lib/file-diff";
import { PaneHeader } from "./pane-header";

//
// What the file pane is given and what it reports.
//
export interface IFilePaneProps {
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
// Reads the file's diff with the file diff task and shows it in a rounded card headed by the
// file's path, with a button that closes the pane. It shows that it is loading until the task ends
// and what went wrong when the diff could not be read.
//
export function FilePane({ repoPath, hash, path, onClose }: IFilePaneProps): JSX.Element {
    const [diff, setDiff] = useState<string | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readFileDiff({
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
    }, [repoPath, hash, path]);

    return (
        <section data-id="file-pane" className="w-[640px] flex-none overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-white/5">
            <PaneHeader title={path} titleDataId="file-pane-path" closeDataId="file-pane-close" onClose={onClose} />
            <div className="max-h-[70vh] overflow-auto">
                <FileDiffContent diff={diff} error={error} />
            </div>
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
        return <p data-id="file-diff-error" className="p-4 text-red-700 dark:text-red-400">{error}</p>;
    }
    if (diff === undefined) {
        return <p data-id="file-diff-loading" className="p-4 text-gray-500 dark:text-gray-400">Loading the diff.</p>;
    }
    return <pre data-id="file-diff" className="p-4 font-mono text-xs">{diff}</pre>;
}
