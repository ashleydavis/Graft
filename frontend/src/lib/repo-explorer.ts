//
// Works out what the repo explorer shows after each key the user presses and each click: which
// panes are open, which one is active and which item is selected in each, as in the column view
// of macOS Finder. The repo explorer page keeps the state and draws it.
//

//
// The repo explorer's panes and their selections. The open panes are the repo details pane, then
// the commit pane while the Commits link is open, then the commit details pane while a commit is
// open, then the file pane while a file is open.
//
export interface IRepoExplorerState {
    // The position of the active pane among the open panes: 0 for the repo details pane, 1 for
    // the commit pane, 2 for the commit details pane and 3 for the file pane. The keys act on this
    // pane.
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
}

//
// The name of the repo details pane's Commits link, which opens the commit pane. The page lists
// the link under this name and the state records it, so both use this one name.
//
export const COMMITS_LINK = "commits";

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
    };
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
// Closes the commit pane and every pane to its right, as Escape does, and makes the repo details
// pane active. The Commits link stays selected, and the commit pane opens afresh when it opens
// again.
//
export function closeCommitPane(state: IRepoExplorerState): IRepoExplorerState {
    return {
        ...state,
        activePaneIndex: 0,
        openLink: undefined,
        selectedHash: undefined,
        openHash: undefined,
        selectedPath: undefined,
        openPath: undefined,
    };
}

//
// Moves the selection in the active pane one step, up for step -1 and down for step 1. The file
// pane lists no items, so the selection stays as it is there.
//
export function moveSelection(state: IRepoExplorerState, items: IRepoExplorerItems, step: number): IRepoExplorerState {
    if (state.activePaneIndex === 0) {
        return {
            ...state,
            selectedLink: itemAfterMove(items.links, state.selectedLink, step),
        };
    }
    if (state.activePaneIndex === 1) {
        return {
            ...state,
            selectedHash: itemAfterMove(items.commitHashes, state.selectedHash, step),
        };
    }
    if (state.activePaneIndex === 2) {
        return {
            ...state,
            selectedPath: itemAfterMove(items.filePaths, state.selectedPath, step),
        };
    }
    return state;
}

//
// Opens the selected item of the active pane, as Enter does: the selected link opens its pane, the
// selected commit opens its details pane and the selected file opens its file pane, and the new
// pane becomes active. With nothing selected, or in the file pane, nothing changes.
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
        return closeCommitPane(state);
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
