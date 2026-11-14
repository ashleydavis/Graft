//
// The commit details pane: the column that opens to the right of the commit pane when a commit is
// clicked, with the commit's full message, author, committer, dates, parents and the files it
// changed with their line counts.
//

import { List, ListItemButton } from "@mui/material";
import { JSX, useEffect, useState } from "react";
import { IChangedFile, ICommitDetails, readCommitDetails } from "../../../lib/commit-details";
import { formatDateTime, IDateFormatOptions } from "../../../lib/date-format";
import { activePaneClass } from "./active-pane-style";
import { PaneHeader } from "./pane-header";

//
// What the commit details pane is given and what it reports.
//
export interface ICommitDetailsPaneProps {
    // The repo to read.
    repoPath: string;

    // The hash of the commit to show.
    hash: string;

    // The path of the selected changed file, which the pane shows as selected, or undefined.
    selectedPath: string | undefined;

    // Whether the pane is the commit explorer's active pane, which its border shows.
    isActive: boolean;

    // The locale and time zone the commit's dates are shown in.
    dateFormat: IDateFormatOptions;

    // Called with the path of the changed file the user clicks.
    onSelectFile(path: string): void;

    // Called with the paths of the commit's changed files, in the order the pane lists them, once
    // the task has read them, so the commits page can move the selection through them.
    onReadFiles(paths: string[]): void;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the commit's details and changed files with the commit details task and shows them in a
// rounded card headed "Commit", with a button that closes the pane. It shows that it is loading
// until the task ends and what went wrong when the commit could not be read. The card's border is in
// the style guide's active pane colour while the pane is active. The card fades in as it opens.
//
export function CommitDetailsPane({ repoPath, hash, selectedPath, isActive, dateFormat, onSelectFile, onReadFiles, onClose }: ICommitDetailsPaneProps): JSX.Element {
    const [details, setDetails] = useState<ICommitDetails | undefined>(undefined);
    const [error, setError] = useState<string | undefined>(undefined);

    useEffect(() => {
        readCommitDetails({
            taskId: `commit-details-${Date.now()}-${Math.random()}`,
            repoPath,
            hash,
        }, result => {
            if (result.ok) {
                setDetails(result.value);
                onReadFiles(result.value.changedFiles.map(file => file.path));
            }
            else {
                setError(result.error.message);
            }
        });
    }, [repoPath, hash]);

    return (
        <section data-id="commit-details-pane" className={`graft-pane-in w-[380px] flex-none overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title="Commit" titleDataId="commit-details-heading" closeDataId="commit-details-close" onClose={onClose} />
            <div className="max-h-[70vh] overflow-y-auto">
                <CommitDetailsContent details={details} error={error} selectedPath={selectedPath} dateFormat={dateFormat} onSelectFile={onSelectFile} />
            </div>
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

    // The path of the selected changed file, which the content shows as selected, or undefined.
    selectedPath: string | undefined;

    // The locale and time zone the commit's dates are shown in.
    dateFormat: IDateFormatOptions;

    // Called with the path of the changed file the user clicks.
    onSelectFile(path: string): void;
}

//
// Shows the commit's message, who wrote and made it and when, its hash and parents, then the files
// it changed under a "Files changed" heading, or shows that the commit is loading or why it could
// not be read. The description shows only when the message has more than a title.
//
export function CommitDetailsContent({ details, error, selectedPath, dateFormat, onSelectFile }: ICommitDetailsContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commit-details-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (details === undefined) {
        return <p data-id="commit-details-loading" className="animate-pulse p-4 text-[var(--color-text-muted)]">Loading the commit.</p>;
    }
    const commit = details.commit;
    return (
        <div data-id="commit-details">
            <div className="flex flex-col gap-1 border-b border-[var(--color-border)] p-4">
                <p data-id="commit-details-title" className="text-[length:var(--text-lg)] font-[var(--weight-bold)] leading-[var(--leading-tight)] text-[var(--color-text)]">{commit.title}</p>
                {commit.description !== "" && (
                    <p data-id="commit-details-description" className="whitespace-pre-wrap text-[length:var(--text-md)] text-[var(--color-text)]">{commit.description}</p>
                )}
                <p data-id="commit-details-author" className="mt-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    Authored by {commit.authorName} &lt;{commit.authorEmail}&gt; on {formatDateTime(commit.authorDate, dateFormat)}
                </p>
                <p data-id="commit-details-committer" className="text-[length:var(--text-sm)] text-[var(--color-text-muted)]">
                    Committed by {commit.committerName} &lt;{commit.committerEmail}&gt; on {formatDateTime(commit.committerDate, dateFormat)}
                </p>
                <p data-id="commit-details-hash" className="mt-1 break-all font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{commit.hash}</p>
                <p data-id="commit-details-parents" className="font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{parentsText(commit.parentHashes)}</p>
            </div>
            <p data-id="changed-files-heading" className="px-4 pt-3 pb-1 text-[length:var(--text-sm)] font-[var(--weight-bold)] text-[var(--color-text-muted)]">
                Files changed ({details.changedFiles.length})
            </p>
            {details.changedFiles.length === 0 && (
                <p data-id="changed-files-none" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">No files changed in this commit.</p>
            )}
            <List data-id="changed-files" disablePadding={true} className="pb-2">
                {details.changedFiles.map(file => (
                    <ChangedFileRow key={file.path} file={file} isSelected={file.path === selectedPath} onSelectFile={onSelectFile} />
                ))}
            </List>
        </div>
    );
}

//
// Writes the commit's parents as their short hashes: "Parent: 1234567" for one, "Parents: " and a
// list for a merge and "Parents: none" for the first commit.
//
export function parentsText(parentHashes: string[]): string {
    if (parentHashes.length === 0) {
        return "Parents: none";
    }
    const shortHashes = parentHashes.map(parentHash => parentHash.slice(0, 7)).join(", ");
    if (parentHashes.length === 1) {
        return `Parent: ${shortHashes}`;
    }
    return `Parents: ${shortHashes}`;
}

//
// Picks the Tailwind classes that colour a change type's letter with the style guide's status
// colours: success for added, danger for deleted and warning for modified or any other change.
//
export function statusColorClass(status: string): string {
    if (status === "A") {
        return "text-[var(--color-success)]";
    }
    if (status === "D") {
        return "text-[var(--color-danger)]";
    }
    return "text-[var(--color-warning)]";
}

//
// What one row of the changed files shows and what it reports.
//
export interface IChangedFileRowProps {
    // The changed file.
    file: IChangedFile;

    // Whether the file is selected, which the row shows with MaterialUI's selection styling.
    isSelected: boolean;

    // Called with the file's path when the user clicks the row.
    onSelectFile(path: string): void;
}

//
// Shows one changed file: its change type as a coloured letter, its path and the lines the commit
// added and deleted, or "binary" for a file git counts no lines of. The row is a MaterialUI
// ListItemButton, so a selected file shows MaterialUI's own selection styling.
//
export function ChangedFileRow({ file, isSelected, onSelectFile }: IChangedFileRowProps): JSX.Element {
    return (
        <ListItemButton
            component="li"
            data-id={`changed-file-${file.path}`}
            selected={isSelected}
            onClick={() => onSelectFile(file.path)}
            className="flex items-center gap-2 px-4 py-1.5 text-[length:var(--text-md)]"
        >
            <span className={`w-4 flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] font-[var(--weight-bold)] ${statusColorClass(file.status)}`}>{file.status}</span>
            <span title={file.path} className="min-w-0 flex-1 truncate">{file.path}</span>
            {file.isBinary && (
                <span className="flex-none rounded-[var(--radius-full)] bg-[var(--color-raised)] px-2 text-[length:var(--text-xs)] text-[var(--color-text-muted)]">binary</span>
            )}
            {!file.isBinary && (
                <span className="flex-none font-[family-name:var(--font-mono)] text-[length:var(--text-sm)]">
                    <span className="text-[var(--color-success)]">+{file.linesAdded}</span>
                    {" "}
                    <span className="text-[var(--color-danger)]">-{file.linesDeleted}</span>
                </span>
            )}
        </ListItemButton>
    );
}
