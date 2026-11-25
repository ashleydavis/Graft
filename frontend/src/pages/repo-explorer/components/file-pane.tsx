//
// The file pane: the column that opens to the right of the commit details pane when a changed file
// is clicked, with the file's diff in the commit, its lines numbered and coloured as the style
// guide's diff view draws them. The changes pane opens the same card for a changed file in the
// working tree.
//

import { JSX, useEffect, useState } from "react";
import { DiffLineKind, IDiffHunk, IDiffLine, parseDiffLines, splitDiffHunks } from "../../../lib/diff-lines";
import { readFileDiff } from "../../../lib/file-diff";
import { activeFlatPaneClass } from "./active-pane-style";
import { FileIcon } from "./file-icon";
import { FilePathMenu } from "./file-path-menu";
import { CloseButton } from "./pane-header";

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

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the file's diff in the commit with the file diff task and shows it in the file diff card.
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

    return <FileDiffCard repoPath={repoPath} path={path} diff={diff} error={error} isActive={isActive} onClose={onClose} />;
}

//
// What the file diff card shows and what it reports.
//
export interface IFileDiffCardProps {
    // The path of the repo the file is in, which the file path menu's full path starts with.
    repoPath: string;

    // The path of the file from the root of the repo.
    path: string;

    // The file's diff, or undefined until it is read.
    diff: string | undefined;

    // Why the diff could not be read, or undefined.
    error: string | undefined;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Shows the diff in a rounded card headed by the file's icon and name, with a button that closes
// the pane, as the style guide's file diff card is headed, so the file pane and the changes pane's
// file pane look the same. The title holds the file's name alone, so it stays short in a narrow
// pane, and hovering it shows the full path. The file path menu's button sits beside the name. It
// shows that the diff is loading until it is read and what went wrong when it could not be. The
// card is 840 pixels wide, or the width of the page's visible area when that is narrower, so the
// whole diff can be scrolled into view. The card's border is in the style guide's active pane
// colour while the pane is active. The card has no shadow, as the style guide's file diff card has
// none. The page's AnimatedPane column animates it as it opens and closes.
//
export function FileDiffCard({ repoPath, path, diff, error, isActive, onClose }: IFileDiffCardProps): JSX.Element {
    return (
        <section data-id="file-pane" aria-label="File diff" className={`flex w-[min(840px,calc(100cqw-var(--space-6)*2))] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activeFlatPaneClass(isActive)}`}>
            <div className="flex flex-none items-center gap-2 border-b border-[var(--color-border)] bg-[var(--color-panel)] p-2">
                <span title={path} className="flex min-w-0 flex-1 items-center gap-2 text-[length:var(--text-sm)] font-[var(--weight-medium)] text-[var(--color-text)]">
                    <FileIcon path={path} />
                    <span data-id="file-pane-path" className="min-w-0 truncate">{path.slice(path.lastIndexOf("/") + 1)}</span>
                    <FilePathMenu repoPath={repoPath} path={path} dataId="file-pane-path-menu" />
                </span>
                <CloseButton paneLabel="File diff" dataId="file-pane-close" onClose={onClose} />
            </div>
            <div className="min-h-0 flex-1 overflow-auto bg-[var(--color-panel)]">
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
// Shows every line of the file's diff as git wrote it, one row each, hunk by hunk, or says it is
// loading or why it could not be read.
//
export function FileDiffContent({ diff, error }: IFileDiffContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="file-diff-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (diff === undefined) {
        return <p data-id="file-diff-loading" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the diff.</p>;
    }
    return (
        <div data-id="file-diff" role="table" aria-label="Unified diff" className="py-2 font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] leading-[var(--leading-normal)] text-[var(--color-text)]">
            {splitDiffHunks(parseDiffLines(diff)).map((hunk, index) => <DiffHunk key={index} hunk={hunk} />)}
        </div>
    );
}

//
// What one hunk of the diff shows.
//
export interface IDiffHunkProps {
    // The hunk, or git's header lines before the first hunk.
    hunk: IDiffHunk;
}

//
// Shows a hunk's "@@" header row, then its lines with a spacing step above and below them, as the
// style guide's diff view leaves room round each hunk's lines. Git's header lines before the first
// hunk show as rows with no room round them.
//
export function DiffHunk({ hunk }: IDiffHunkProps): JSX.Element {
    const rows = hunk.lines.map((line, index) => <DiffRow key={index} line={line} />);
    if (!hunk.header) {
        return <>{rows}</>;
    }
    return (
        <>
            <DiffRow line={hunk.header} />
            <div role="rowgroup" className="py-[var(--space-2)]">
                {rows}
            </div>
        </>
    );
}

//
// The look of one kind of diff line: the Tailwind classes of its background and of its marker, and
// the marker itself.
//
export interface IDiffLineStyle {
    // The Tailwind classes of the row's background and text colour.
    rowClasses: string;

    // The Tailwind class of the marker's colour.
    markerClass: string;

    // The marker before the line's text: "+", "−" or nothing.
    marker: string;
}

//
// The look of each kind of diff line, from the style guide's diff view: an added line on the
// added background with a "+" in the added line colour, a deleted line on the removed background
// with a "−" in the removed line colour, both backgrounds inset a spacing step from each end of
// the row as the style guide insets a hunk's lines, a kept line on the panel, a hunk header muted
// on the raised background as the style guide's bars between hunks are and git's own header lines
// muted.
//
export const diffLineStyles: Record<DiffLineKind, IDiffLineStyle> = {
    added: {
        rowClasses: "bg-[image:linear-gradient(var(--color-diff-added),var(--color-diff-added))] bg-[length:calc(100%_-_var(--space-1)_*_2)_100%] bg-[position:var(--space-1)_0] bg-no-repeat",
        markerClass: "text-[var(--color-diff-added-line)]",
        marker: "+",
    },
    deleted: {
        rowClasses: "bg-[image:linear-gradient(var(--color-diff-removed),var(--color-diff-removed))] bg-[length:calc(100%_-_var(--space-1)_*_2)_100%] bg-[position:var(--space-1)_0] bg-no-repeat",
        markerClass: "text-[var(--color-diff-removed-line)]",
        marker: "−",
    },
    context: {
        rowClasses: "bg-[var(--color-panel)]",
        markerClass: "text-[var(--color-text-muted)]",
        marker: "",
    },
    hunk: {
        rowClasses: "my-1 min-h-[calc(var(--space-6)+var(--space-1))] items-center bg-[var(--color-raised)] py-1 text-[var(--color-text-muted)]",
        markerClass: "text-[var(--color-text-muted)]",
        marker: "",
    },
    meta: {
        rowClasses: "bg-[var(--color-panel)] text-[var(--color-text-muted)]",
        markerClass: "text-[var(--color-text-muted)]",
        marker: "",
    },
};

//
// What one row of the diff shows.
//
export interface IDiffRowProps {
    // The line the row shows.
    line: IDiffLine;
}

//
// Shows one line of the diff as the style guide's unified diff does: its number in the old file
// and in the new file in gutters of their own, its marker and its text, wrapped when it is wider
// than the pane. The numbers and the marker cannot be selected, so copying the lines copies their
// text alone.
//
export function DiffRow({ line }: IDiffRowProps): JSX.Element {
    const style = diffLineStyles[line.kind];
    return (
        <div role="row" data-line={line.kind} className={`flex ${style.rowClasses}`}>
            <span className="w-[calc(var(--space-8)+var(--space-2))] flex-none select-none pr-2 text-right text-[var(--color-text-muted)]">{line.oldNumber}</span>
            <span className="w-[calc(var(--space-8)+var(--space-2))] flex-none select-none pr-2 text-right text-[var(--color-text-muted)]">{line.newNumber}</span>
            <span className={`w-[var(--space-4)] flex-none select-none text-center font-[var(--weight-bold)] ${style.markerClass}`}>{style.marker}</span>
            <span className="min-w-0 flex-1 whitespace-pre-wrap pr-4 [overflow-wrap:anywhere]">{line.text}</span>
        </div>
    );
}
