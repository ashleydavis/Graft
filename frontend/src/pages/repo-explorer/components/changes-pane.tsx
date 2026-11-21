//
// The changes pane: the column the repo details pane's Commit link opens, headed "Commit", with
// the working tree's unstaged files and staged files in two lists, as the style guide's Commit
// page lays them out, and a button on each row that stages or unstages the whole file.
//

import { faAnglesLeft, faAnglesRight, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconButton, List, ListItemButton, Tooltip } from "@mui/material";
import { JSX } from "react";
import { changeKey } from "../../../lib/repo-explorer";
import { changedFileCount, IWorkingChanges, IWorkingFile } from "../../../lib/working-changes";
import { activePaneClass } from "./active-pane-style";
import { openRowClass } from "./commit-list";
import { FileIcon } from "./file-icon";
import { FilePath } from "./file-path";
import { PaneHeader } from "./pane-header";

//
// What the changes pane shows and what it reports.
//
export interface IChangesPaneProps {
    // The working tree's changes, or undefined until they are read.
    changes: IWorkingChanges | undefined;

    // Why the changes could not be read, or undefined.
    error: string | undefined;

    // Why the last stage or unstage did not happen, or undefined.
    stageError: string | undefined;

    // The key of the selected row, as changeKey makes it, or undefined.
    selectedKey: string | undefined;

    // The key of the row whose file pane is open, as changeKey makes it, or undefined.
    openKey: string | undefined;

    // Whether the pane is the repo explorer's active pane, which its border shows.
    isActive: boolean;

    // Called with the key of the row the user clicks.
    onSelectChange(key: string): void;

    // Called with the file whose stage or unstage button the user clicks and whether it is in the
    // staged list.
    onToggleStaged(file: IWorkingFile, isStaged: boolean): void;
}

//
// Shows the changes in a rounded card headed "Commit", with how many files changed and how many
// are staged beside it in muted text, as the style guide's Changes pane is headed. The card is as
// tall as the page's columns and never shrinks, as the other panes. Its border is in the style
// guide's active pane colour while the pane is active. The card fades in as it opens.
//
export function ChangesPane({ changes, error, stageError, selectedKey, openKey, isActive, onSelectChange, onToggleStaged }: IChangesPaneProps): JSX.Element {
    const title = (
        <span className="flex items-baseline gap-2">
            Commit
            <span data-id="changes-summary" className="truncate text-[length:var(--text-sm)] font-[var(--weight-normal)] text-[var(--color-text-muted)]">{changesSummary(changes)}</span>
        </span>
    );
    return (
        <section data-id="changes-pane" aria-label="Commit" className={`graft-pane-in flex w-[420px] flex-none flex-col overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--color-panel)] transition-[border-color,box-shadow] duration-[var(--duration-fast)] ease-[var(--ease-standard)] ${activePaneClass(isActive)}`}>
            <PaneHeader title={title} titleDataId="changes-heading" action={undefined} />
            {stageError !== undefined && (
                <p data-id="changes-stage-error" className="m-2 mb-0 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[length:var(--text-sm)] text-[var(--color-text)]">{stageError}</p>
            )}
            <div className="flex min-h-0 flex-1 flex-col">
                <ChangesContent changes={changes} error={error} selectedKey={selectedKey} openKey={openKey} onSelectChange={onSelectChange} onToggleStaged={onToggleStaged} />
            </div>
        </section>
    );
}

//
// Writes the header's summary of the changes: "9 files, 3 staged", "1 file, 0 staged", "none"
// for a working tree with no changes and an empty string while they are read.
//
export function changesSummary(changes: IWorkingChanges | undefined): string {
    if (!changes) {
        return "";
    }
    const fileCount = changedFileCount(changes);
    if (fileCount === 0) {
        return "none";
    }
    let files = "files";
    if (fileCount === 1) {
        files = "file";
    }
    return `${fileCount} ${files}, ${changes.staged.length} staged`;
}

//
// What the content of the changes pane shows and what it reports.
//
export interface IChangesContentProps {
    // The working tree's changes, or undefined until they are read.
    changes: IWorkingChanges | undefined;

    // Why the changes could not be read, or undefined.
    error: string | undefined;

    // The key of the selected row, or undefined.
    selectedKey: string | undefined;

    // The key of the row whose file pane is open, or undefined.
    openKey: string | undefined;

    // Called with the key of the row the user clicks.
    onSelectChange(key: string): void;

    // Called with the file whose button the user clicks and whether it is in the staged list.
    onToggleStaged(file: IWorkingFile, isStaged: boolean): void;
}

//
// Shows the Unstaged list above the Staged list, each filling half the pane, or shows that the
// changes are loading, why they could not be read or that the working tree has no changes, as the
// style guide's Commit page does.
//
export function ChangesContent({ changes, error, selectedKey, openKey, onSelectChange, onToggleStaged }: IChangesContentProps): JSX.Element {
    if (error !== undefined) {
        return <p data-id="changes-error" className="m-3 rounded-[var(--radius-md)] bg-[var(--color-danger-subtle)] px-3 py-2 text-[var(--color-text)]">{error}</p>;
    }
    if (changes === undefined) {
        return <p data-id="changes-loading" className="px-4 py-2 text-[length:var(--text-sm)] text-[var(--color-text-muted)]">Loading the changes.</p>;
    }
    if (changedFileCount(changes) === 0) {
        return (
            <p data-id="changes-none" className="flex items-center justify-center gap-2 px-4 py-8 text-[var(--color-text-muted)]">
                <FontAwesomeIcon icon={faCheck} className="text-[var(--color-success)]" />
                No changes. The working tree matches the last commit.
            </p>
        );
    }
    return (
        <div className="flex min-h-0 flex-1 flex-col gap-2 p-2">
            <ChangeList title="Unstaged" files={changes.unstaged} isStaged={false} emptyText="Everything is staged." selectedKey={selectedKey} openKey={openKey} onSelectChange={onSelectChange} onToggleStaged={onToggleStaged} />
            <ChangeList title="Staged" files={changes.staged} isStaged={true} emptyText="Nothing staged yet." selectedKey={selectedKey} openKey={openKey} onSelectChange={onSelectChange} onToggleStaged={onToggleStaged} />
        </div>
    );
}

//
// What one of the two lists shows and what it reports.
//
export interface IChangeListProps {
    // The list's heading, "Unstaged" or "Staged".
    title: string;

    // The files in the list.
    files: IWorkingFile[];

    // Whether this is the staged list.
    isStaged: boolean;

    // What the list shows when it has no files.
    emptyText: string;

    // The key of the selected row, or undefined.
    selectedKey: string | undefined;

    // The key of the row whose file pane is open, or undefined.
    openKey: string | undefined;

    // Called with the key of the row the user clicks.
    onSelectChange(key: string): void;

    // Called with the file whose button the user clicks and whether it is in the staged list.
    onToggleStaged(file: IWorkingFile, isStaged: boolean): void;
}

//
// Shows one list in a bordered box with a raised heading bar naming it and counting its files,
// then its rows, scrolling on its own when they do not fit, or what it shows when it is empty, as
// the style guide's Staged and Unstaged panels are drawn.
//
export function ChangeList({ title, files, isStaged, emptyText, selectedKey, openKey, onSelectChange, onToggleStaged }: IChangeListProps): JSX.Element {
    const listId = title.toLowerCase();
    return (
        <section data-id={`changes-${listId}`} aria-label={`${title} files`} className="flex min-h-[120px] flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border border-[var(--color-border)]">
            <div className="flex min-h-[calc(var(--space-6)+var(--space-2))] flex-none items-center border-b border-[var(--color-border)] bg-[var(--color-raised)] px-3 py-1">
                <h3 data-id={`changes-${listId}-heading`} className="min-w-0 flex-1 truncate text-[length:var(--text-sm)] font-[var(--weight-bold)] text-[var(--color-text-muted)]">
                    {title} ({files.length})
                </h3>
            </div>
            <div className="min-h-0 flex-1 overflow-auto">
                {files.length === 0 && (
                    <p data-id={`changes-${listId}-empty`} className="p-3 text-center text-[length:var(--text-sm)] text-[var(--color-text-muted)]">{emptyText}</p>
                )}
                {files.length > 0 && (
                    <List data-id={`changes-${listId}-list`} aria-label={`${title} files`} disablePadding={true} className="p-1">
                        {files.map(file => {
                            const key = changeKey(isStaged, file.path);
                            return <ChangeRow key={key} file={file} isStaged={isStaged} isSelected={key === selectedKey} isOpen={key === openKey} onSelect={() => onSelectChange(key)} onToggleStaged={onToggleStaged} />;
                        })}
                    </List>
                )}
            </div>
        </section>
    );
}

//
// What one row of a list shows and what it reports.
//
export interface IChangeRowProps {
    // The changed file.
    file: IWorkingFile;

    // Whether the row is in the staged list.
    isStaged: boolean;

    // Whether the row is selected, which it shows on the selected background.
    isSelected: boolean;

    // Whether the row's file pane is open, which it shows with a bar at its left edge.
    isOpen: boolean;

    // Called when the user clicks the row.
    onSelect(): void;

    // Called with the file and whether it is in the staged list when the user clicks its button.
    onToggleStaged(file: IWorkingFile, isStaged: boolean): void;
}

//
// Shows one changed file as the style guide's file rows do: the stage or unstage button at its
// left, then the file's icon and its path. The row is a MaterialUI ListItemButton, so a selected
// file shows the selected background. Its data-id holds the list and the path, because a file
// with staged and unstaged changes has a row in each list.
//
export function ChangeRow({ file, isStaged, isSelected, isOpen, onSelect, onToggleStaged }: IChangeRowProps): JSX.Element {
    let listName = "unstaged";
    if (isStaged) {
        listName = "staged";
    }
    let current: "true" | undefined = undefined;
    if (isOpen) {
        current = "true";
    }
    return (
        <ListItemButton
            component="li"
            data-id={`change-${listName}-${file.path}`}
            aria-label={file.path}
            selected={isSelected}
            aria-current={current}
            onClick={onSelect}
            className={`flex items-center gap-2 px-2 text-[length:var(--text-sm)] ${openRowClass(isOpen)}`}
        >
            <StageButton path={file.path} isStaged={isStaged} onClick={() => onToggleStaged(file, isStaged)} />
            <FileIcon path={file.path} />
            <span className="min-w-0 flex-1 truncate">
                <FilePath path={file.path} />
            </span>
        </ListItemButton>
    );
}

//
// What the stage button shows and what it reports.
//
export interface IStageButtonProps {
    // The path of the file the button stages or unstages, which names its data-id.
    path: string;

    // Whether the file is in the staged list, so the button unstages it.
    isStaged: boolean;

    // Called when the user clicks the button.
    onClick(): void;
}

//
// The Tailwind classes of the stage button in the unstaged list: the style guide's stage button
// colours, a pale grey square in light and a black one in dark with the control border, a little
// darker under the pointer.
//
export const stageButtonClasses = "bg-[var(--color-stage-button)] text-[var(--color-on-stage-button)] shadow-[inset_0_0_0_1px_var(--color-border-control)] hover:bg-[color-mix(in_srgb,var(--color-stage-button)_85%,var(--color-on-stage-button))]";

//
// The Tailwind classes of the unstage button in the staged list: a slight green tinge, a little
// stronger under the pointer, as the style guide marks a staged file's button.
//
export const unstageButtonClasses = "bg-[color-mix(in_srgb,var(--color-success)_12%,transparent)] hover:bg-[color-mix(in_srgb,var(--color-success)_22%,transparent)]";

//
// Shows the square button at a row's left that moves the whole file to the other list: a double
// chevron right that stages a file in the unstaged list and a double chevron left that unstages a
// file in the staged list, with a tooltip naming what it does, as the style guide's stage button
// is drawn. The button stops the click there, so the row's selection stays as it was.
//
export function StageButton({ path, isStaged, onClick }: IStageButtonProps): JSX.Element {
    let label = "Stage this file";
    let detail = "Adds the file's changes to the next commit.";
    let icon = faAnglesRight;
    let classes = stageButtonClasses;
    let dataId = `stage-${path}`;
    if (isStaged) {
        label = "Unstage this file";
        detail = "Takes the file's changes out of the next commit. They stay in the working tree.";
        icon = faAnglesLeft;
        classes = unstageButtonClasses;
        dataId = `unstage-${path}`;
    }
    return (
        <Tooltip title={<StageTip title={label} detail={detail} />}>
            <IconButton
                data-id={dataId}
                aria-label={label}
                size="small"
                onClick={event => {
                    event.stopPropagation();
                    onClick();
                }}
                className={`h-[calc(var(--icon-md)*0.85+var(--space-2))] w-[calc(var(--icon-md)*0.85+var(--space-2))] flex-none rounded-[var(--radius-sm)] p-0 text-[length:calc(var(--icon-md)*0.85)] ${classes}`}
            >
                <FontAwesomeIcon icon={icon} />
            </IconButton>
        </Tooltip>
    );
}

//
// What the stage button's tooltip shows.
//
export interface IStageTipProps {
    // What the button does, in bold.
    title: string;

    // What that means for the file, under it.
    detail: string;
}

//
// Shows the stage button's tooltip: what the button does in bold, then what that means for the
// file, as the style guide's tooltips with a title and a detail are laid out.
//
export function StageTip({ title, detail }: IStageTipProps): JSX.Element {
    return (
        <span className="flex flex-col gap-1">
            <span className="font-[var(--weight-bold)]">{title}</span>
            <span className="text-[length:var(--text-xs)] font-[var(--weight-normal)] opacity-80">{detail}</span>
        </span>
    );
}
