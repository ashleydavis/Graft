//
// Works out what the repo explorer shows after each key the user presses and each click: which
// panes are open, which one is active and which item is selected in each, as in the column view
// of macOS Finder. The repo explorer page keeps the state and draws it.
//

import { IWorkingChanges, IWorkingFile } from "./working-changes";

//
// The repo explorer's panes and their selections. The open panes are the repo details pane, then
// the commit pane while the Commits link is open, then the commit details pane while a commit is
// open, then the file pane while a file is open. While the Changes link is open the changes pane
// follows the repo details pane in place of the commit pane, then the file pane while a changed
// file is open.
//
export interface IRepoExplorerState {
    // The position of the active pane among the open panes: 0 for the repo details pane, 1 for
    // the commit pane, 2 for the commit details pane and 3 for the file pane, or 1 for the changes
    // pane and 2 for the file pane while the Changes link is open. The keys act on this pane.
    activePaneIndex: number;

    // The name of the selected link in the repo details pane, as in "commits", or undefined before
    // one is selected.
    selectedLink: string | undefined;

    // The name of the link whose pane is open, or undefined while the repo details pane is alone.
    openLink: string | undefined;

    // The hash of the selected commit in the commit pane, or undefined before one is selected.
    selectedHash: string | undefined;

    // The hash of the commit whose details pane is open, or undefined when it is closed.
    openHash: string | undefined;

    // The path of the selected file in the commit details pane, or undefined before one is
    // selected.
    selectedPath: string | undefined;

    // The path of the file whose file pane is open, or undefined when it is closed.
    openPath: string | undefined;

    // The key of the selected file in the changes pane, as changeKey makes it, or undefined before
    // one is selected.
    selectedChange: string | undefined;

    // The key of the changed file whose file pane is open, as changeKey makes it, or undefined when
    // it is closed.
    openChange: string | undefined;
}

//
// What the panes list, which Up and Down move through.
//
export interface IRepoExplorerItems {
    // The names of the links in the repo details pane, in the order it lists them.
    links: string[];

    // The hashes of the commits in the commit pane, in the order it lists them.
    commitHashes: string[];

    // The paths of the open commit's changed files, in the order the commit details pane lists
    // them, or none until they are read.
    filePaths: string[];

    // The keys of the files in the changes pane, as changeKey makes them, the unstaged files then
    // the staged files, as the pane lists them, or none until they are read.
    changeKeys: string[];
}

//
// The name of the repo details pane's Commits link, which opens the commit pane. The page lists
// the link under this name and the state records it, so both use this one name.
//
export const COMMITS_LINK = "commits";

//
// The name of the repo details pane's Changes link, which opens the changes pane, used by the page
// and the state as COMMITS_LINK is.
//
export const CHANGES_LINK = "changes";

//
// Makes the key that names one row of the changes pane: the list it is in and the file's path. A
// file with staged and unstaged changes has a row in each list, so the path alone cannot name the
// row.
//
export function changeKey(isStaged: boolean, path: string): string {
    if (isStaged) {
        return `staged:${path}`;
    }
    return `unstaged:${path}`;
}

//
// The repo explorer as its page first shows it: the repo details pane alone, active, with nothing
// selected, so the user sees the repo before choosing what to look at in it.
//
export const initialRepoExplorerState: IRepoExplorerState = {
    activePaneIndex: 0,
    selectedLink: undefined,
    openLink: undefined,
    selectedHash: undefined,
    openHash: undefined,
    selectedPath: undefined,
    openPath: undefined,
    selectedChange: undefined,
    openChange: undefined,
};

//
// Returns true when the key, as KeyboardEvent.key names it, is one the repo explorer acts on, so
// the repo explorer page handles it and keeps it from the rest of the page, which would otherwise
// scroll on an arrow key.
//
export function isExplorerKey(key: string): boolean {
    return ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", "Enter", "Escape"].includes(key);
}

//
// Counts the open panes, so Right knows whether there is a pane to the right of the active one.
//
export function openPaneCount(state: IRepoExplorerState): number {
    if (state.openLink === undefined) {
        return 1;
    }
    if (state.openLink === CHANGES_LINK) {
        if (state.openChange === undefined) {
            return 2;
        }
        return 3;
    }
    if (state.openHash === undefined) {
        return 2;
    }
    if (state.openPath === undefined) {
        return 3;
    }
    return 4;
}

//
// Picks the item one step up (step -1) or down (step 1) from the selected one, staying on the
// first or last item at the ends. With nothing selected, or a selection no longer in the list, it
// picks the first item. With no items it picks nothing.
//
export function itemAfterMove(items: string[], selected: string | undefined, step: number): string | undefined {
    if (items.length === 0) {
        return undefined;
    }
    const index = selected === undefined ? -1 : items.indexOf(selected);
    if (index < 0) {
        return items[0];
    }
    const nextIndex = Math.min(Math.max(index + step, 0), items.length - 1);
    return items[nextIndex];
}

//
// Selects the link and opens its pane, with the repo details pane active, as a click on the link
// does. The pane opens afresh, with no commit or file open, so a click and Enter both show it from
// the start.
//
export function selectLink(link: string): IRepoExplorerState {
    return {
        activePaneIndex: 0,
        selectedLink: link,
        openLink: link,
        selectedHash: undefined,
        openHash: undefined,
        selectedPath: undefined,
        openPath: undefined,
        selectedChange: undefined,
        openChange: undefined,
    };
}

//
// Selects the changed file and opens its file pane, with the changes pane active, as a click on
// the file's row does.
//
export function selectChange(state: IRepoExplorerState, key: string): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: 1,
        selectedChange: key,
        openChange: key,
    };
}

//
// Closes the file pane of a changed file, as its close button and Escape do, and makes the changes
// pane active when the file pane was.
//
export function closeChangeFilePane(state: IRepoExplorerState): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: Math.min(state.activePaneIndex, 1),
        openChange: undefined,
    };
}

//
// Moves the changes pane's selection and open file from the row of a file that was staged or
// unstaged to its row in the other list, so the user keeps looking at the file they moved. Any
// other selection stays as it is.
//
export function followMovedChange(state: IRepoExplorerState, fromKey: string, toKey: string): IRepoExplorerState {
    let selectedChange = state.selectedChange;
    if (selectedChange === fromKey) {
        selectedChange = toKey;
    }
    let openChange = state.openChange;
    if (openChange === fromKey) {
        openChange = toKey;
    }
    return {
        ...state,
        selectedChange,
        openChange,
    };
}

//
// Drops the changes pane's selection and open file when their rows are no longer listed after the
// changes are read again, closing the file pane, so the panes never show a row that has gone.
//
export function keepListedChanges(state: IRepoExplorerState, changeKeys: string[]): IRepoExplorerState {
    let next = state;
    if (next.openChange !== undefined) {
        if (!changeKeys.includes(next.openChange)) {
            next = closeChangeFilePane(next);
        }
    }
    if (next.selectedChange !== undefined) {
        if (!changeKeys.includes(next.selectedChange)) {
            next = {
                ...next,
                selectedChange: undefined,
            };
        }
    }
    return next;
}

//
// Selects the commit and opens its details pane, with the commit pane active, as a click on the
// commit does. The commit opens with its file pane closed and its files unselected, so a click and
// Enter both show the commit afresh.
//
export function selectCommit(state: IRepoExplorerState, hash: string): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: 1,
        selectedHash: hash,
        openHash: hash,
        selectedPath: undefined,
        openPath: undefined,
    };
}

//
// Selects the first of the open commit's changed files once the commit details pane has read
// them, so the file list opens with a file highlighted for Up, Down and Enter to start from. A file
// already selected, by a click or a key pressed while the files were read, stays selected. With no
// files selectedPath stays undefined.
//
export function selectFirstFile(state: IRepoExplorerState, filePaths: string[]): IRepoExplorerState {
    if (state.selectedPath !== undefined) {
        return state;
    }
    return {
        ...state,
        selectedPath: filePaths[0],
    };
}

//
// Selects the changed file and opens its file pane, with the commit details pane active, as a
// click on the file does.
//
export function selectFile(state: IRepoExplorerState, path: string): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: 2,
        selectedPath: path,
        openPath: path,
    };
}

//
// Closes the file pane, as its close button and Escape do, and makes the commit details pane
// active when the file pane was.
//
export function closeFilePane(state: IRepoExplorerState): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: Math.min(state.activePaneIndex, 2),
        openPath: undefined,
    };
}

//
// Closes the commit details pane and the file pane with it, as the details pane's close button and
// Escape do, and makes the commit pane active when one of them was. The commit stays selected.
//
export function closeCommitDetailsPane(state: IRepoExplorerState): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: Math.min(state.activePaneIndex, 1),
        openHash: undefined,
        selectedPath: undefined,
        openPath: undefined,
    };
}

//
// Closes the pane the open link opened, the commit pane or the changes pane, and every pane to its
// right, as Escape and the commit pane's close button do, and makes the repo details pane active.
// The link stays selected, and its pane opens afresh when it opens again.
//
export function closeLinkPane(state: IRepoExplorerState): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: 0,
        openLink: undefined,
        selectedHash: undefined,
        openHash: undefined,
        selectedPath: undefined,
        openPath: undefined,
        selectedChange: undefined,
        openChange: undefined,
    };
}

//
// Moves the selected commit in the commit pane one step, up for step -1 and down for step 1. While
// a commit's details are open they follow the selection, so the commit details pane shows the newly
// selected commit at once, with the commit pane still active. At the first or last commit the
// selection and the open details stay as they are.
//
export function moveCommitSelection(state: IRepoExplorerState, commitHashes: string[], step: number): IRepoExplorerState {
    const selectedHash = itemAfterMove(commitHashes, state.selectedHash, step);
    if (state.openHash === undefined) {
        return {
            ...state,
            selectedHash,
        };
    }
    if (selectedHash === undefined) {
        return state;
    }
    if (selectedHash === state.openHash) {
        return state;
    }
    return selectCommit(state, selectedHash);
}

//
// Makes the pane at the index among the open panes active, as a click anywhere in the pane does,
// so the keys act on the pane the user clicked. An index beyond the open panes makes the rightmost
// open pane active, so the active pane is never one that has closed.
//
export function activatePane(state: IRepoExplorerState, paneIndex: number): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: Math.min(paneIndex, openPaneCount(state) - 1),
    };
}

//
// Finds the position among the columns' panes of the pane that holds the click's target, so the
// repo explorer page can make the clicked pane active. A click between the panes, outside every
// pane, finds none.
//
export function targetPaneIndex(columns: Element, target: EventTarget): number | undefined {
    if (!(target instanceof Node)) {
        return undefined;
    }
    const paneIndex = Array.from(columns.children).findIndex(pane => pane.contains(target));
    if (paneIndex < 0) {
        return undefined;
    }
    return paneIndex;
}

//
// Moves the selection in the active pane one step, up for step -1 and down for step 1. The file
// pane lists no items, so the selection stays as it is there.
//
// With the commit details pane active and no file pane open, Up and Down open the commit above or
// below, as they do in the commit pane, so the commit details pane follows the keys after Enter, a
// click in it or Right. The commit details pane stays active, so the next Up or Down moves on
// through the commits.
//
// In a commit's file list, while a file pane is open, the file pane shows the newly selected file
// at once, so the user can read one diff after another with Up and Down alone. The commit details
// pane stays active, so the next Up or Down moves on through the list.
//
export function moveSelection(state: IRepoExplorerState, items: IRepoExplorerItems, step: number): IRepoExplorerState {
    if (state.activePaneIndex === 0) {
        return {
            ...state,
            selectedLink: itemAfterMove(items.links, state.selectedLink, step),
        };
    }
    if (state.openLink === CHANGES_LINK) {
        if (state.activePaneIndex === 1) {
            return {
                ...state,
                selectedChange: itemAfterMove(items.changeKeys, state.selectedChange, step),
            };
        }
        return state;
    }
    if (state.activePaneIndex === 1) {
        return moveCommitSelection(state, items.commitHashes, step);
    }
    if (state.activePaneIndex === 2) {
        if (state.openPath === undefined) {
            return {
                ...moveCommitSelection(state, items.commitHashes, step),
                activePaneIndex: 2,
            };
        }
        const selectedPath = itemAfterMove(items.filePaths, state.selectedPath, step);
        if (selectedPath === undefined) {
            return state;
        }
        return {
            ...state,
            selectedPath,
            openPath: selectedPath,
        };
    }
    return state;
}

//
// Opens the selected item of the active pane, as Enter does: the selected link opens its pane, the
// selected commit opens its details pane and the selected file, in a commit or in the changes
// pane, opens its file pane, and the new pane becomes active. With no item selected, or in the
// file pane, the state stays as it is.
//
export function openSelection(state: IRepoExplorerState): IRepoExplorerState {
    if (state.activePaneIndex === 0) {
        if (state.selectedLink === undefined) {
            return state;
        }
        return {
            ...selectLink(state.selectedLink),
            activePaneIndex: 1,
        };
    }
    if (state.openLink === CHANGES_LINK) {
        if (state.activePaneIndex === 1) {
            if (state.selectedChange === undefined) {
                return state;
            }
            return {
                ...selectChange(state, state.selectedChange),
                activePaneIndex: 2,
            };
        }
        return state;
    }
    if (state.activePaneIndex === 1) {
        if (state.selectedHash === undefined) {
            return state;
        }
        return {
            ...selectCommit(state, state.selectedHash),
            activePaneIndex: 2,
        };
    }
    if (state.activePaneIndex === 2) {
        if (state.selectedPath === undefined) {
            return state;
        }
        return {
            ...selectFile(state, state.selectedPath),
            activePaneIndex: 3,
        };
    }
    return state;
}

//
// Closes the rightmost pane and makes the pane to its left active, as Escape does. With only the
// repo details pane open nothing changes.
//
export function closeRightmostPane(state: IRepoExplorerState): IRepoExplorerState {
    const paneCount = openPaneCount(state);
    if (state.openLink === CHANGES_LINK) {
        if (paneCount === 3) {
            return {
                ...closeChangeFilePane(state),
                activePaneIndex: 1,
            };
        }
    }
    if (paneCount === 4) {
        return {
            ...closeFilePane(state),
            activePaneIndex: 2,
        };
    }
    if (paneCount === 3) {
        return {
            ...closeCommitDetailsPane(state),
            activePaneIndex: 1,
        };
    }
    if (paneCount === 2) {
        return closeLinkPane(state);
    }
    return state;
}

//
// Works out the repo explorer after the key, as KeyboardEvent.key names it: Up and Down move the
// selection in the active pane, Left and Right make the pane to the left or right active when
// there is one, Enter opens the selected item and Escape closes the rightmost pane. Any other key
// changes nothing.
//
export function explorerStateAfterKey(state: IRepoExplorerState, key: string, items: IRepoExplorerItems): IRepoExplorerState {
    if (key === "ArrowUp") {
        return moveSelection(state, items, -1);
    }
    if (key === "ArrowDown") {
        return moveSelection(state, items, 1);
    }
    if (key === "ArrowLeft") {
        return {
            ...state,
            activePaneIndex: Math.max(state.activePaneIndex - 1, 0),
        };
    }
    if (key === "ArrowRight") {
        return {
            ...state,
            activePaneIndex: Math.min(state.activePaneIndex + 1, openPaneCount(state) - 1),
        };
    }
    if (key === "Enter") {
        return openSelection(state);
    }
    if (key === "Escape") {
        return closeRightmostPane(state);
    }
    return state;
}

//
// Returns true when a key pressed with the focus on the target is the repo explorer's to handle:
// the focus is on the page's body, or on the repo explorer page outside a text box, link or
// button, which handle the key themselves. A key held with Ctrl, Alt or Cmd is a shortcut, which
// Ziggy runs, and a key pressed in a menu or dialog belongs to that menu or dialog, which sits
// outside the repo explorer page.
//
export function isExplorerKeyTarget(target: EventTarget | null, page: Element | null, hasModifier: boolean): boolean {
    if (hasModifier) {
        return false;
    }
    if (!(target instanceof HTMLElement)) {
        return false;
    }
    if (target === target.ownerDocument.body) {
        return true;
    }
    if (!page || !page.contains(target)) {
        return false;
    }
    if (target.isContentEditable) {
        return false;
    }
    return target.closest("input, textarea, select, button, a") === null;
}

//
// Makes the keys of the changes pane's rows, the unstaged files then the staged files, as the pane
// lists them, or none before the changes are read, for the keys to move through and to drop a row
// that has gone.
//
export function changeKeysOf(changes: IWorkingChanges | undefined): string[] {
    if (!changes) {
        return [];
    }
    return [
        ...changes.unstaged.map(file => changeKey(false, file.path)),
        ...changes.staged.map(file => changeKey(true, file.path)),
    ];
}

//
// A changed file and the list it is in, as the changes pane's row with a key names it.
//
export interface IChangeRow {
    // The changed file.
    file: IWorkingFile;

    // Whether the file is in the staged list.
    isStaged: boolean;
}

//
// Searches the changes for the row with the key, so the file pane knows which file to show and
// from which list. It finds no row for no key, before the changes are read or when the row has
// gone.
//
export function findChange(changes: IWorkingChanges | undefined, key: string | undefined): IChangeRow | undefined {
    if (!changes) {
        return undefined;
    }
    if (key === undefined) {
        return undefined;
    }
    const unstaged = changes.unstaged.find(file => changeKey(false, file.path) === key);
    if (unstaged) {
        return {
            file: unstaged,
            isStaged: false,
        };
    }
    const staged = changes.staged.find(file => changeKey(true, file.path) === key);
    if (staged) {
        return {
            file: staged,
            isStaged: true,
        };
    }
    return undefined;
}
