//
// Works out the breadcrumb trail the top bar shows for each of Graft's pages: the steps from the
// repo to the page being shown, which of them are drop-downs of their siblings and how each step's
// text is shortened, with a step for each pane open in the repo explorer, and how many steps
// collapse into one when the trail has too little room.
//

import { COMMIT_LINK, COMMITS_LINK, IRepoExplorerState } from "./repo-explorer";

//
// One page a drop-down step can switch to.
//
export interface ITrailOption {
    // The page's name.
    label: string;

    // The path of the page on the router.
    path: string;

    // The data-id of the option in the drop-down.
    dataId: string;

    // Whether it is the page being shown, which the drop-down ticks.
    isSelected: boolean;
}

//
// One step of the trail.
//
export interface ITrailStep {
    // The full text of the step, before it is shortened.
    label: string;

    // The text of the step's tooltip, which is always given in full.
    tooltip: string;

    // The data-id of the step.
    dataId: string;

    // The pages the step can switch to, its own among them. A step with none is plain text,
    // because it has no sibling to switch to.
    options: ITrailOption[];
}

//
// A page in a group of the left sidebar.
//
interface IGroupPage {
    // The page's name.
    label: string;

    // The path of the page on the router.
    path: string;

    // The name of the page in data-ids.
    id: string;
}

//
// The pages of the left sidebar's group of pages about the app itself, in the sidebar's order.
// They are siblings, so the trail's step for one of them is a drop-down of them all.
//
const APP_GROUP_PAGES: IGroupPage[] = [
    {
        label: "Help",
        path: "/help",
        id: "help",
    },
    {
        label: "About",
        path: "/about",
        id: "about",
    },
];

//
// A page of the left sidebar with no sibling to switch to.
//
interface ISinglePage {
    // The page's name, which is its step's text.
    label: string;

    // The path of the page on the router.
    path: string;

    // Whether the page belongs to the open repo, so its trail starts with the repo step.
    isRepoPage: boolean;
}

//
// The pages whose trail step is plain text, because each has no sibling page in the left
// sidebar. The welcome page is the page of the app Graft opens on. The repo explorer is the only
// page about the repo.
//
const SINGLE_PAGES: ISinglePage[] = [
    {
        label: "Welcome",
        path: "/",
        isRepoPage: false,
    },
    {
        label: "Repo explorer",
        path: "/repo-explorer",
        isRepoPage: true,
    },
];

//
// The most characters a step shows. The rules for the trail cut a longer step to this length with
// an ellipsis, so a long name cannot push the rest of the top bar aside.
//
const STEP_LABEL_LENGTH_MAX = 18;

//
// The data-id of the step for the page being shown, which the trail draws as the page's title. The
// smoke tests find that step by this data-id.
//
export const PAGE_STEP_DATA_ID = "breadcrumb-page";

//
// The width of the collapsed step in pixels: the style guide's small icon button, a square of
// --icon-md (14px) plus --space-3 (12px), as graft-theme.ts sizes it. The trail measures its steps
// only while every step shows, before the collapsed step is drawn, so its width comes from the
// tokens.
//
export const COLLAPSED_STEP_WIDTH_PX = 14 + 12;

//
// The widths of a trail drawn in full, which collapsedStepCount works out the collapsed steps
// from.
//
export interface ITrailWidths {
    // The width of each step in pixels, in the trail's order, with its text as the step shows it.
    stepWidthsPx: number[];

    // The room in pixels between two steps, which the chevron and its margins take.
    separatorWidthPx: number;
}

//
// Works out how many of the steps after the first the trail collapses into one step, so the
// trail fits trailWidthPx on one line. It collapses none when the trail fits. Otherwise it
// collapses the steps after the first one at a time, so the steps nearest the page being shown
// stay longest, and stops at the first count that fits. The first and last steps never collapse,
// so when even every step between them collapsed does not fit, it returns that count and the
// steps left are cut short to fit.
//
export function collapsedStepCount(widths: ITrailWidths, trailWidthPx: number): number {
    const stepCount = widths.stepWidthsPx.length;
    let shownWidthPx = widths.separatorWidthPx * (stepCount - 1);
    for (const stepWidthPx of widths.stepWidthsPx) {
        shownWidthPx += stepWidthPx;
    }
    if (shownWidthPx <= trailWidthPx) {
        return 0;
    }
    shownWidthPx += COLLAPSED_STEP_WIDTH_PX + widths.separatorWidthPx;
    let collapsedCount = 0;
    while (collapsedCount < stepCount - 2) {
        shownWidthPx -= widths.stepWidthsPx[1 + collapsedCount] + widths.separatorWidthPx;
        collapsedCount += 1;
        if (shownWidthPx <= trailWidthPx) {
            return collapsedCount;
        }
    }
    return collapsedCount;
}

//
// Works out the trail for the page at the path. While a repo is open every trail but the welcome
// page's starts with it, by its folder's name with its full path in the tooltip. Graft has one
// repo open at a time, so the repo step has no sibling to switch to and is plain text. While no
// repo is open the trail starts with the page. The welcome page is Graft's start page, the same
// whichever repo is open, so its trail is its own step alone and reads as a page of the app. The
// welcome page and the repo explorer page each have no sibling to switch to, so their step is
// plain text too. The repo explorer page's step stands for its repo details pane, and the pane
// steps the page gives, one for each pane open to the right of it, follow it, so the trail ends
// with the rightmost pane. The Help and About pages share the app's group, so their step is a
// drop-down of both. Any other path gets the repo step only.
//
export function pageTrail(pathname: string, repoPath: string | undefined, paneSteps: ITrailStep[]): ITrailStep[] {
    const repoSteps: ITrailStep[] = [];
    if (repoPath) {
        repoSteps.push({
            label: repoName(repoPath),
            tooltip: repoPath,
            dataId: "breadcrumb-repo",
            options: [],
        });
    }
    const appPage = APP_GROUP_PAGES.find(page => page.path === pathname);
    if (appPage) {
        return [
            ...repoSteps,
            {
                label: appPage.label,
                tooltip: appPage.label,
                dataId: PAGE_STEP_DATA_ID,
                options: APP_GROUP_PAGES.map(page => ({
                    label: page.label,
                    path: page.path,
                    dataId: `breadcrumb-option-${page.id}`,
                    isSelected: page.path === pathname,
                })),
            },
        ];
    }
    const singlePage = SINGLE_PAGES.find(page => page.path === pathname);
    if (singlePage) {
        const pageStep: ITrailStep = {
            label: singlePage.label,
            tooltip: singlePage.label,
            dataId: PAGE_STEP_DATA_ID,
            options: [],
        };
        if (singlePage.isRepoPage) {
            return [
                ...repoSteps,
                pageStep,
                ...paneSteps,
            ];
        }
        else {
            return [
                pageStep,
            ];
        }
    }
    return repoSteps;
}

//
// Works out the steps for the panes open in the repo explorer to the right of its repo details
// pane, in the order the page shows them, for pageTrail to put after the repo explorer page's step.
// The commit pane's step is "Commits" and the changes pane's is "Commit", as the repo details
// pane's links name them. The commit details pane's step is the commit's short hash, as the commit
// pane shows it, with the full hash in its tooltip. A file pane's step is the file's name, with
// its path in the tooltip. The changes pane's file pane shows only while its file is listed, so
// the page gives that file's path, or undefined while the pane is closed.
//
export function explorerPaneSteps(state: IRepoExplorerState, changedFilePath: string | undefined): ITrailStep[] {
    const steps: ITrailStep[] = [];
    if (state.openLink === COMMITS_LINK) {
        steps.push({
            label: "Commits",
            tooltip: "Commits",
            dataId: "breadcrumb-pane-commits",
            options: [],
        });
    }
    if (state.openHash !== undefined) {
        steps.push({
            label: state.openHash.slice(0, 7),
            tooltip: state.openHash,
            dataId: "breadcrumb-pane-commit",
            options: [],
        });
        if (state.openPath !== undefined) {
            steps.push(fileStep(state.openPath));
        }
    }
    if (state.openLink === COMMIT_LINK) {
        steps.push({
            label: "Commit",
            tooltip: "Commit",
            dataId: "breadcrumb-pane-changes",
            options: [],
        });
        if (changedFilePath !== undefined) {
            steps.push(fileStep(changedFilePath));
        }
    }
    return steps;
}

//
// Makes the step for a file pane, for explorerPaneSteps: the file's name, as the file pane's title
// shows it, with its path in the tooltip so a file in a directory can be told apart. Git separates
// the directories of a path with "/" on every platform, so the name is what follows the last one.
//
export function fileStep(path: string): ITrailStep {
    return {
        label: path.slice(path.lastIndexOf("/") + 1),
        tooltip: path,
        dataId: "breadcrumb-pane-file",
        options: [],
    };
}

//
// The repo's name, which is the name of its folder: the last part of its path, whichever slash
// the platform uses. A path with no folder name in it, such as "/", is its own name, so the step
// is never empty.
//
export function repoName(repoPath: string): string {
    const folderNames = repoPath.split(/[\\/]/).filter(folderName => folderName.length > 0);
    const lastFolderName = folderNames[folderNames.length - 1];
    if (lastFolderName) {
        return lastFolderName;
    }
    return repoPath;
}

//
// The text a step shows: its label, or a label longer than the step can show cut short with an
// ellipsis, so the shortened text is no longer than the longest label shown in full.
//
export function clipStepLabel(label: string): string {
    if (label.length > STEP_LABEL_LENGTH_MAX) {
        return `${label.slice(0, STEP_LABEL_LENGTH_MAX - 1)}…`;
    }
    return label;
}

//
// The options whose names contain the search text, ignoring case, in their order. Empty search
// text matches every option.
//
export function searchMatches(options: ITrailOption[], searchText: string): ITrailOption[] {
    const wanted = searchText.toLowerCase();
    return options.filter(option => option.label.toLowerCase().includes(wanted));
}
