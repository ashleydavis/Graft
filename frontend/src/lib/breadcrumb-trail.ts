//
// Works out the breadcrumb trail the top bar shows for each of Graft's pages: the steps from the
// repo to the page being shown, which of them are drop-downs of their siblings and how each step's
// text is shortened.
//

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
        path: "/",
        id: "about",
    },
];

//
// The most characters a step shows. The rules for the trail cut a longer step to this length with
// an ellipsis, so a long name cannot push the rest of the top bar aside.
//
const STEP_LABEL_LENGTH_MAX = 18;

//
// Works out the trail for the page at the path. Every trail starts with the repo, by its folder's
// name with its full path in the tooltip. Graft reads one repo, so the repo step has no sibling to
// switch to and is plain text. The commits page is the only page of the repo's group, so its step
// is plain text too. The Help and About pages share the app's group, so their step is a drop-down
// of both. Any other path gets the repo step only.
//
export function pageTrail(pathname: string, repoPath: string): ITrailStep[] {
    const repoStep: ITrailStep = {
        label: repoName(repoPath),
        tooltip: repoPath,
        dataId: "breadcrumb-repo",
        options: [],
    };
    const appPage = APP_GROUP_PAGES.find(page => page.path === pathname);
    if (appPage) {
        return [
            repoStep,
            {
                label: appPage.label,
                tooltip: appPage.label,
                dataId: "breadcrumb-page",
                options: APP_GROUP_PAGES.map(page => ({
                    label: page.label,
                    path: page.path,
                    dataId: `breadcrumb-option-${page.id}`,
                    isSelected: page.path === pathname,
                })),
            },
        ];
    }
    if (pathname === "/commits") {
        return [
            repoStep,
            {
                label: "Commits",
                tooltip: "Commits",
                dataId: "breadcrumb-page",
                options: [],
            },
        ];
    }
    return [repoStep];
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
