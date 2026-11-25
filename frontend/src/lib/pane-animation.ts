//
// Works out how a pane of the repo explorer animates as it opens and closes: which pane is closing
// and which animation class its column takes. The repo explorer page fades a pane in as it opens
// and fades and narrows it away as it closes, and opens and closes it at once while the system's
// reduced motion setting is on.
//

import { CHANGES_LINK, COMMITS_LINK, IRepoExplorerState, linkBranch } from "./repo-explorer";

//
// The media query that matches while the system's reduced motion setting is on. The panes read it
// so they open and close at once for a user who has turned motion off.
//
export const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

//
// Works out which pane is closing after the pane named previousOpenId gave way to the one named
// openId, so the pane's column keeps drawing it until its closing animation ends. A pane closes
// when its name goes, and a pane whose name changes to another is drawn afresh instead. Under
// reduced motion it returns undefined, because the pane goes at once.
//
export function closingPaneId(previousOpenId: string | undefined, openId: string | undefined, isReducedMotion: boolean): string | undefined {
    if (openId !== undefined) {
        return undefined;
    }
    if (isReducedMotion) {
        return undefined;
    }
    return previousOpenId;
}

//
// Picks the animation class of a pane's column: graft-pane-in while it opens, graft-pane-out while
// it closes and an empty class under reduced motion. The classes are in main.css, timed with the
// style guide's motion tokens.
//
export function paneAnimationClass(isClosing: boolean, isReducedMotion: boolean): string {
    if (isReducedMotion) {
        return "";
    }
    if (isClosing) {
        return "graft-pane-out";
    }
    return "graft-pane-in";
}

//
// The names of the repo explorer's open panes, one per pane after the repo details pane, each
// undefined while its pane is closed. Each pane's column animates from its name: it opens when the
// name appears, closes when it goes and opens afresh when it changes.
//
export interface IOpenPaneIds {
    // The commit pane's name while the Commits link is open, or the open branch's row name while
    // a branch is open, so another branch's pane opens afresh.
    commitPane: string | undefined;

    // The open commit's hash, so another commit's details open afresh.
    commitDetailsPane: string | undefined;

    // The open commit's hash and the open file's path, so another file's diff opens afresh. The
    // "Commit details" pane opens in the same column, under COMMIT_DETAILS_PATH as its path.
    filePane: string | undefined;

    // The changes pane's name while the Changes link is open.
    changesPane: string | undefined;

    // The open changed file's key, which stays the same as the changes are read again, so the pane
    // opens afresh only for another file.
    workingFilePane: string | undefined;
}

//
// Works out the names of the open panes from the repo explorer's state, so the repo explorer page
// can give each pane's column its name. A pane is open exactly when the page draws it:
// hasOpenChange is true when the changes pane lists the open changed file, because the page draws
// that file's pane only then.
//
export function openPaneIds(explorer: IRepoExplorerState, hasOpenChange: boolean): IOpenPaneIds {
    const ids: IOpenPaneIds = {
        commitPane: undefined,
        commitDetailsPane: explorer.openHash,
        filePane: undefined,
        changesPane: undefined,
        workingFilePane: undefined,
    };
    if (explorer.openLink === COMMITS_LINK) {
        ids.commitPane = COMMITS_LINK;
    }
    if (linkBranch(explorer.openLink) !== undefined) {
        ids.commitPane = explorer.openLink;
    }
    if (explorer.openHash !== undefined) {
        if (explorer.openPath !== undefined) {
            ids.filePane = `${explorer.openHash} ${explorer.openPath}`;
        }
    }
    if (explorer.openLink === CHANGES_LINK) {
        ids.changesPane = CHANGES_LINK;
        if (hasOpenChange) {
            ids.workingFilePane = explorer.openChange;
        }
    }
    return ids;
}
