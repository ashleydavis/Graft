//
// The commit details pane: the column that opens to the right of the commit pane when a commit is
// clicked, with a "Commit details" row that opens the commit's message and facts in a pane of their
// own and the files it changed, each with its change type and line counts in its tooltip.
//

import { faMessage } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { List, ListItemButton, Tooltip } from "@mui/material";
import { JSX, useEffect, useRef, useState } from "react";
import { IChangedFile, ICommitDetails, readCommitDetails } from "../../../lib/commit-details";
import { COMMIT_DETAILS_PATH } from "../../../lib/repo-explorer";
import { activePaneClass } from "./active-pane-style";
import { openRowClass } from "./commit-list";
import { FileIcon } from "./file-icon";
import { FilePath } from "./file-path";
import { FilePathMenu, filePathMenuRowStyle } from "./file-path-menu";
import { CloseButton, PaneHeader } from "./pane-header";

//
// The data-id of the pane's scrolling area, which a selected file's row finds and scrolls and the
// smoke tests check a row is in view of.
//
const SCROLL_AREA_DATA_ID = "commit-details-scroll";

//
// What the commit details pane is given and what it reports.
//
export interface ICommitDetailsPaneProps {
    // The repo to read.
    repoPath: string;

    // The hash of the commit to show.
    hash: string;

    // The path of the selected changed file, which the pane shows as selected,
    // COMMIT_DETAILS_PATH for the "Commit details" row, or undefined.
    selectedPath: string | undefined;

    // The path of the changed file whose diff is open, or COMMIT_DETAILS_PATH while the "Commit
    // details" pane is open, which the pane marks with a bar at the row's left edge, or undefined.
    openPath: string | undefined;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Called with the path of the changed file the user clicks, or COMMIT_DETAILS_PATH for the
    // "Commit details" row.
    onSelectFile(path: string): void;

    // Called with the commit and its changed files once the task has read them, so the repo
    // explorer page can move the selection through the files and show the commit in the "Commit
    // details" pane without reading it again.
    onReadCommit(details: ICommitDetails): void;

    // Called when the user closes the pane.
    onClose(): void;
}

//
// Reads the commit's details and changed files with the commit details task and shows them in a
// rounded card headed "Commit" and the commit's short hash, with a button that closes the pane. It
// shows that it is loading until the task ends and what went wrong when the commit could not be
// read. The card's border is in the style guide's active pane colour while the pane is active. The
// page's AnimatedPane column animates it as it opens and closes.
//
export function CommitDetailsPane({ repoPath, hash, selectedPath, openPath, isActive, onSelectFile, onReadCommit, onClose }: ICommitDetailsPaneProps): JSX.Element {
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
                onReadCommit(result.value);
            }
            else {
                setError(result.error.message);
            }
        });
    }, [repoPath, hash]);

    const title = (
        <span className="flex items-baseline gap-2">
            Commit
            <code className="font-[family-name:var(--font-mono)] text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{hash.slice(0, 7)}</code>
        </span>
    );
    return (
        <section data-id="commit-details-pane" aria-label="Commit details" className={`flex w-[450px] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title={title} titleDataId="commit-details-heading" action={<CloseButton paneLabel="Commit details" dataId="commit-details-close" onClose={onClose} />} />
            <div data-id={SCROLL_AREA_DATA_ID} className="min-h-0 flex-1 overflow-auto">
                <CommitDetailsContent repoPath={repoPath} details={details} error={error} selectedPath={selectedPath} openPath={openPath} onSelectFile={onSelectFile} />
            </div>
        </section>
    );
}

//
// What the content of the commit details pane shows.
//
export interface ICommitDetailsContentProps {
    // The path of the repo the commit is in, for the file path menus of its changed files.
    repoPath: string;

    // The commit and its changed files, or undefined until they are read.
    details: ICommitDetails | undefined;

    // Why the commit could not be read, or undefined.
    error: string | undefined;

    // The path of the selected changed file, which the content shows as selected,
    // COMMIT_DETAILS_PATH for the "Commit details" row, or undefined.
    selectedPath: string | undefined;

    // The path of the changed file whose diff is open, or COMMIT_DETAILS_PATH while the "Commit
    // details" pane is open, which the content marks as open, or undefined.
    openPath: string | undefined;

    // Called with the path of the changed file the user clicks, or COMMIT_DETAILS_PATH for the
    // "Commit details" row.
    onSelectFile(path: string): void;
}

//
// Shows the "Commit details" row, which opens the commit's message and facts, then lists the files
// the commit changed under a "Files changed" heading, as the style guide's commit details pane
// does, or shows that the commit is loading or why it could not be read.
//
export function CommitDetailsContent({ repoPath, details, error, selectedPath, openPath, onSelectFile }: ICommitDetailsContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="commit-details-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (details === undefined) {
        return <p data-id="commit-details-loading" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the commit.</p>;
    }
    return (
        <div data-id="commit-details">
            <List disablePadding={true} className="px-1 pt-1">
                <CommitDetailsRow isSelected={selectedPath === COMMIT_DETAILS_PATH} isOpen={openPath === COMMIT_DETAILS_PATH} onSelectFile={onSelectFile} />
            </List>
            <p data-id="changed-files-heading" className="px-4 pt-3 pb-2 text-[length:var(--text-sm)] font-[var(--weight-bold)] leading-[var(--leading-normal)] text-[var(--color-text-muted)]">
                Files changed ({details.changedFiles.length})
            </p>
            {details.changedFiles.length === 0 && (
                <p data-id="changed-files-none" className="px-4 py-1 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">No files changed in this commit.</p>
            )}
            <List data-id="changed-files" disablePadding={true} className="px-1 pb-2">
                {details.changedFiles.map(file => (
                    <ChangedFileRow key={file.path} repoPath={repoPath} file={file} isSelected={file.path === selectedPath} isOpen={file.path === openPath} onSelectFile={onSelectFile} />
                ))}
            </List>
        </div>
    );
}

//
// What the "Commit details" row shows and what it reports.
//
export interface ICommitDetailsRowProps {
    // Whether the row is selected, which it shows on the selected background.
    isSelected: boolean;

    // Whether the "Commit details" pane is open, which the row shows with a bar at its left edge.
    isOpen: boolean;

    // Called with COMMIT_DETAILS_PATH when the user clicks the row.
    onSelectFile(path: string): void;
}

//
// Shows the "Commit details" row as the style guide's commit details pane does: the message icon
// and "Commit details" in medium weight. The row is a MaterialUI ListItemButton like the file rows,
// so it has their hover and selected colours and their open bar. When it becomes selected it
// scrolls itself into view, as a file row does.
//
export function CommitDetailsRow({ isSelected, isOpen, onSelectFile }: ICommitDetailsRowProps): JSX.Element {
    const rowRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (isSelected) {
            scrollRowIntoView(rowRef.current, SCROLL_AREA_DATA_ID);
        }
    }, [isSelected]);

    let current: "true" | undefined = undefined;
    if (isOpen) {
        current = "true";
    }
    return (
        <ListItemButton
            ref={rowRef}
            component="li"
            data-id="commit-details-row"
            aria-label="Commit details"
            selected={isSelected}
            aria-current={current}
            onClick={() => onSelectFile(COMMIT_DETAILS_PATH)}
            className={`flex items-center gap-2 px-2 text-[length:var(--text-sm)] ${openRowClass(isOpen)}`}
        >
            <FontAwesomeIcon icon={faMessage} aria-hidden="true" className="flex-none text-[length:var(--icon-sm)] text-[var(--color-text-muted)]" />
            <span className="min-w-0 flex-1 truncate font-[var(--weight-medium)]">Commit details</span>
        </ListItemButton>
    );
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
// The name of a change type and what it means, as the style guide's file tooltip shows them.
//
export interface IStatusTip {
    // The change type's name, as in "Modified".
    title: string;

    // What the change type means.
    detail: string;
}

//
// Names git's one letter change type and says what it means, for a changed file's tooltip. Any
// letter other than A, D and T is a modification, as the change type's colour treats it.
//
export function statusTip(status: string): IStatusTip {
    if (status === "A") {
        return {
            title: "Added",
            detail: "The file is new.",
        };
    }
    if (status === "D") {
        return {
            title: "Deleted",
            detail: "The file was removed.",
        };
    }
    if (status === "T") {
        return {
            title: "Type changed",
            detail: "The file changed kind, such as to a symbolic link.",
        };
    }
    return {
        title: "Modified",
        detail: "The file's lines changed.",
    };
}

//
// Writes a changed file's line counts for its tooltip: "+9 −2" for the lines the commit added and
// deleted, or "Binary file" for a file git counts no lines of.
//
export function lineCountsText(file: IChangedFile): string {
    if (file.isBinary) {
        return "Binary file";
    }
    return `+${file.linesAdded} −${file.linesDeleted}`;
}

//
// What a changed file's tooltip shows.
//
export interface IFileTipProps {
    // The changed file.
    file: IChangedFile;
}

//
// Shows a changed file's tooltip as the style guide's file tooltip lays it out: its change type
// letter in its colour, the change type's name and its line counts on the first line, what the
// change type means under it, then its path.
//
export function FileTip({ file }: IFileTipProps): JSX.Element {
    const tip = statusTip(file.status);
    return (
        <span className="flex flex-col gap-1">
            <span className="flex items-center gap-2">
                <span className={`font-[family-name:var(--font-mono)] font-[var(--weight-bold)] ${statusColorClass(file.status)}`}>{file.status}</span>
                <span className="font-[var(--weight-bold)]">{tip.title}</span>
                <span className="flex-1 font-[family-name:var(--font-mono)]">{lineCountsText(file)}</span>
            </span>
            <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">{tip.detail}</span>
            <span className="flex flex-col gap-px py-1">
                <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] text-[var(--color-tooltip-muted)]">Path</span>
                <span className="border-t border-dotted border-[var(--color-tooltip-border)] pt-[calc(var(--space-1)*1.5+1px)] font-[family-name:var(--font-mono)] [overflow-wrap:anywhere]">{file.path}</span>
            </span>
        </span>
    );
}

//
// What one row of the changed files shows and what it reports.
//
export interface IChangedFileRowProps {
    // The path of the repo the file is in, for the file path menu.
    repoPath: string;

    // The changed file.
    file: IChangedFile;

    // Whether the file is selected, which the row shows on the selected background.
    isSelected: boolean;

    // Whether the file's diff is open, which the row shows with a bar at its left edge.
    isOpen: boolean;

    // Called with the file's path when the user clicks the row.
    onSelectFile(path: string): void;
}

//
// Shows one changed file as the style guide's file rows do: its icon, its path and its file path
// menu, with its change type and line counts in the tooltip on the path. The row is a MaterialUI
// ListItemButton, so a selected file shows the selected background. When the row becomes selected
// it scrolls itself into view, so the highlighted file stays visible as Up and Down move through a
// list longer than the pane.
//
export function ChangedFileRow({ repoPath, file, isSelected, isOpen, onSelectFile }: IChangedFileRowProps): JSX.Element {
    const rowRef = useRef<HTMLLIElement>(null);

    useEffect(() => {
        if (isSelected) {
            scrollRowIntoView(rowRef.current, SCROLL_AREA_DATA_ID);
        }
    }, [isSelected]);

    return (
        <ListItemButton
            ref={rowRef}
            component="li"
            data-id={`changed-file-${file.path}`}
            aria-label={file.path}
            selected={isSelected}
            aria-current={isOpen ? "true" : undefined}
            onClick={() => onSelectFile(file.path)}
            className={`flex items-center gap-2 px-2 text-[length:var(--text-sm)] ${openRowClass(isOpen)}`}
            sx={filePathMenuRowStyle}
        >
            <FileIcon path={file.path} />
            <Tooltip title={<FileTip file={file} />} enterDelay={500}>
                <span className="min-w-0 flex-1 truncate">
                    <FilePath path={file.path} />
                </span>
            </Tooltip>
            <FilePathMenu repoPath={repoPath} path={file.path} dataId={`changed-file-menu-${file.path}`} />
        </ListItemButton>
    );
}

//
// Scrolls the scrolling area with the data-id that holds the row up or down by the least amount
// that shows the whole row, so the highlighted file stays inside the pane's visible part, in the
// commit details pane and in the changes pane's lists. It sets the area's scrollTop, which moves
// only that area, so the page's own smooth sideways scroll that brings a newly opened pane into
// view runs to its end. It scrolls at once, so the list keeps up with each press of Up, Down, Page
// Up or Page Down. It returns at once when React has yet to draw the row or the row is drawn
// outside the scrolling area, because then there is no area for it to move.
//
export function scrollRowIntoView(row: HTMLElement | null, areaDataId: string): void {
    if (!row) {
        return;
    }
    const area = row.closest<HTMLElement>(`[data-id="${areaDataId}"]`);
    if (!area) {
        return;
    }
    area.scrollTop = scrollTopShowingRow(area.scrollTop, row.getBoundingClientRect(), area.getBoundingClientRect());
}

//
// Where an element's top and bottom edges are, in pixels from the top of the window.
//
export interface IVerticalEdges {
    // The distance of the element's top edge from the window's top.
    top: number;

    // The distance of the element's bottom edge from the window's top.
    bottom: number;
}

//
// Works out the scrollTop that shows the whole row in the scrolling area, moving it from the
// current scrollTop by the least amount: up by as much as the row sits above the area, or down by
// as much as it sits below. A row already in view leaves scrollTop as it is.
//
export function scrollTopShowingRow(scrollTop: number, row: IVerticalEdges, area: IVerticalEdges): number {
    if (row.top < area.top) {
        return scrollTop - (area.top - row.top);
    }
    if (area.bottom < row.bottom) {
        return scrollTop + (row.bottom - area.bottom);
    }
    return scrollTop;
}
