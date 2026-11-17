//
// The file pane: the column that opens to the right of the commit details pane when a changed file
// is clicked, with the file's diff in the commit as plain text.
//

import { JSX, useEffect, useState } from "react";
import { readFileDiff } from "../../../lib/file-diff";
import { activePaneClass } from "./active-pane-style";
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

    // Whether the pane is the commit explorer's active pane, which its border shows.
    isActive: boolean;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the file's diff with the file diff task and shows it in a rounded card headed by the
// file's path, with a button that closes the pane. It shows that it is loading until the task ends
// and what went wrong when the diff could not be read. The card's border is in the style guide's
// active pane colour while the pane is active. The card fades in as it opens.
//
export function FilePane({ repoPath, hash, path, isActive, onClose }: IFilePaneProps): JSX.Element {
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
        <section data-id="file-pane" className={`graft-pane-in w-[640px] flex-none overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
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
        return <p data-id="file-diff-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (diff === undefined) {
        return <p data-id="file-diff-loading" className="animate-pulse p-4 text-[var(--color-text-muted)]">Loading the diff.</p>;
    }
    return <pre data-id="file-diff" className="p-4 font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] leading-[var(--leading-normal)] text-[var(--color-text)]">{diff}</pre>;
}
