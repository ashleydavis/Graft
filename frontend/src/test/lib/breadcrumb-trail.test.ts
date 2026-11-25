//
// Tests the breadcrumb trail's rules: works out the trail for each of Graft's pages and for any
// other path, with the repo explorer's pane steps after its page step. Works out the pane steps for
// each combination of open panes. Checks which steps are drop-downs, which option is ticked, how
// the repo's name is read from its path, how long steps are cut short, how the search narrows
// options and how many steps collapse for the room the trail has.
//

import { clipStepLabel, COLLAPSED_STEP_WIDTH_PX, collapsedStepCount, explorerPaneSteps, fileStep, ITrailOption, ITrailStep, ITrailWidths, pageTrail, repoName, searchMatches } from "../../lib/breadcrumb-trail";
import { initialRepoExplorerState } from "../../lib/repo-explorer";

//
// The hash of the commit the pane step tests open, long like a real one so its step is cut short.
//
const HASH = "0123456789abcdef0123456789abcdef01234567";

//
// The steps of the commit pane and an open commit, for the pageTrail tests of the repo explorer.
//
const commitPaneSteps: ITrailStep[] = [
    {
        label: "Commits",
        tooltip: "Commits",
        dataId: "breadcrumb-pane-commits",
        options: [],
    },
    {
        label: "0123456",
        tooltip: HASH,
        dataId: "breadcrumb-pane-commit",
        options: [],
    },
];

describe("pageTrail", () => {
    test("the About page's trail is the repo, then About as a drop-down of the app's pages with About ticked", () => {
        expect(pageTrail("/about", "/repos/graft", [])).toEqual([
            {
                label: "graft",
                tooltip: "/repos/graft",
                dataId: "breadcrumb-repo",
                options: [],
            },
            {
                label: "About",
                tooltip: "About",
                dataId: "breadcrumb-page",
                options: [
                    {
                        label: "Help",
                        path: "/help",
                        dataId: "breadcrumb-option-help",
                        isSelected: false,
                    },
                    {
                        label: "About",
                        path: "/about",
                        dataId: "breadcrumb-option-about",
                        isSelected: true,
                    },
                ],
            },
        ]);
    });

    test("the Help page's trail is the repo, then Help as a drop-down of the app's pages with Help ticked", () => {
        const trail = pageTrail("/help", "/repos/graft", []);
        expect(trail.length).toBe(2);
        expect(trail[0].label).toBe("graft");
        expect(trail[1].label).toBe("Help");
        expect(trail[1].dataId).toBe("breadcrumb-page");
        expect(trail[1].options.map(option => option.isSelected)).toEqual([true, false]);
    });

    test("the repo explorer page's trail is the repo, then Repo explorer as plain text, because it has no sibling", () => {
        expect(pageTrail("/repo-explorer", "/repos/graft", [])).toEqual([
            {
                label: "graft",
                tooltip: "/repos/graft",
                dataId: "breadcrumb-repo",
                options: [],
            },
            {
                label: "Repo explorer",
                tooltip: "Repo explorer",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
    });

    test("the repo explorer page's trail ends with the pane steps the page gives, after its own step", () => {
        expect(pageTrail("/repo-explorer", "/repos/graft", commitPaneSteps).map(step => step.dataId)).toEqual([
            "breadcrumb-repo",
            "breadcrumb-page",
            "breadcrumb-pane-commits",
            "breadcrumb-pane-commit",
        ]);
        expect(pageTrail("/repo-explorer", undefined, commitPaneSteps).map(step => step.dataId)).toEqual([
            "breadcrumb-page",
            "breadcrumb-pane-commits",
            "breadcrumb-pane-commit",
        ]);
    });

    test("pane steps are left out of the trail of every page but the repo explorer", () => {
        expect(pageTrail("/about", "/repos/graft", commitPaneSteps).map(step => step.dataId)).toEqual(["breadcrumb-repo", "breadcrumb-page"]);
        expect(pageTrail("/", "/repos/graft", commitPaneSteps).map(step => step.dataId)).toEqual(["breadcrumb-page"]);
        expect(pageTrail("/missing", "/repos/graft", commitPaneSteps).map(step => step.dataId)).toEqual(["breadcrumb-repo"]);
    });

    test("any other path gets the repo step only", () => {
        expect(pageTrail("/missing", "/repos/graft", [])).toEqual([
            {
                label: "graft",
                tooltip: "/repos/graft",
                dataId: "breadcrumb-repo",
                options: [],
            },
        ]);
    });

    test("starts with the page while no repo is open", () => {
        const trail = pageTrail("/about", undefined, []);
        expect(trail.map(step => step.dataId)).toEqual(["breadcrumb-page"]);
        expect(trail[0].label).toBe("About");
        expect(pageTrail("/repo-explorer", undefined, [])).toEqual([
            {
                label: "Repo explorer",
                tooltip: "Repo explorer",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
    });

    test("the welcome page's trail is Welcome alone while a repo is open, because it is the app's start page", () => {
        expect(pageTrail("/", "/repos/graft", [])).toEqual([
            {
                label: "Welcome",
                tooltip: "Welcome",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
    });

    test("the welcome page's trail is Welcome alone while no repo is open", () => {
        expect(pageTrail("/", undefined, [])).toEqual([
            {
                label: "Welcome",
                tooltip: "Welcome",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
    });

    test("any other path has no steps while no repo is open", () => {
        expect(pageTrail("/missing", undefined, [])).toEqual([]);
    });
});

describe("explorerPaneSteps", () => {
    test("has no steps while the repo details pane is alone", () => {
        expect(explorerPaneSteps(initialRepoExplorerState, undefined)).toEqual([]);
    });

    test("has no steps while a link is only selected", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            selectedLink: "commits",
        }, undefined)).toEqual([]);
    });

    test("has the Commits step while the commit pane is open", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commits",
            selectedHash: HASH,
        }, undefined)).toEqual([commitPaneSteps[0]]);
    });

    test("adds the commit's short hash, with its full hash in the tooltip, while the commit is open", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commits",
            openHash: HASH,
            selectedPath: "src/main.ts",
        }, undefined)).toEqual(commitPaneSteps);
    });

    test("adds the file's name, with its path in the tooltip, while the commit's file is open", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "commits",
            openHash: HASH,
            openPath: "src/main.ts",
        }, undefined)).toEqual([
            ...commitPaneSteps,
            {
                label: "main.ts",
                tooltip: "src/main.ts",
                dataId: "breadcrumb-pane-file",
                options: [],
            },
        ]);
    });

    test("has the Changes step while the changes pane is open with no file open", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "changes",
            selectedChange: "unstaged:notes.txt",
        }, undefined)).toEqual([
            {
                label: "Changes",
                tooltip: "Changes",
                dataId: "breadcrumb-pane-changes",
                options: [],
            },
        ]);
    });

    test("adds the changed file's name, with its path in the tooltip, while its file pane is open", () => {
        expect(explorerPaneSteps({
            ...initialRepoExplorerState,
            openLink: "changes",
            openChange: "staged:docs/new.txt",
        }, "docs/new.txt")).toEqual([
            {
                label: "Changes",
                tooltip: "Changes",
                dataId: "breadcrumb-pane-changes",
                options: [],
            },
            {
                label: "new.txt",
                tooltip: "docs/new.txt",
                dataId: "breadcrumb-pane-file",
                options: [],
            },
        ]);
    });
});

describe("fileStep", () => {
    test("names a file at the top of the repo by its path", () => {
        expect(fileStep("README.md")).toEqual({
            label: "README.md",
            tooltip: "README.md",
            dataId: "breadcrumb-pane-file",
            options: [],
        });
    });

    test("names a file in a directory by the part after the last slash", () => {
        expect(fileStep("a/b/c.txt").label).toBe("c.txt");
    });
});

describe("repoName", () => {
    test("is the last folder of a path with forward slashes", () => {
        expect(repoName("/tmp/graft/test-repo")).toBe("test-repo");
    });

    test("ignores a slash at the end", () => {
        expect(repoName("/tmp/graft/test-repo/")).toBe("test-repo");
    });

    test("is the last folder of a path with backslashes", () => {
        expect(repoName("C:\\repos\\graft")).toBe("graft");
    });

    test("is the whole path when it names no folder", () => {
        expect(repoName("/")).toBe("/");
    });
});

describe("clipStepLabel", () => {
    test("leaves a label of 18 characters whole", () => {
        expect(clipStepLabel("abcdefghijklmnopqr")).toBe("abcdefghijklmnopqr");
    });

    test("cuts a label of 19 characters to 17 and an ellipsis", () => {
        expect(clipStepLabel("abcdefghijklmnopqrs")).toBe("abcdefghijklmnopq\u2026");
    });
});

describe("searchMatches", () => {
    const options: ITrailOption[] = [
        {
            label: "Help",
            path: "/help",
            dataId: "breadcrumb-option-help",
            isSelected: false,
        },
        {
            label: "About",
            path: "/about",
            dataId: "breadcrumb-option-about",
            isSelected: true,
        },
    ];

    test("empty search text matches every option, in order", () => {
        expect(searchMatches(options, "")).toEqual(options);
    });

    test("matches part of a name, ignoring case", () => {
        expect(searchMatches(options, "bOU")).toEqual([options[1]]);
    });

    test("matches no option when no name contains the text", () => {
        expect(searchMatches(options, "commits")).toEqual([]);
    });
});

//
// A trail of five steps, 50, 130, 70, 70 and 90 pixels wide, with 20 pixels between two steps:
// 490 pixels in full.
//
const fiveStepWidths: ITrailWidths = {
    stepWidthsPx: [50, 130, 70, 70, 90],
    separatorWidthPx: 20,
};

describe("collapsedStepCount", () => {
    test("collapses no step when the trail fits, exactly or with room to spare", () => {
        expect(collapsedStepCount(fiveStepWidths, 490)).toBe(0);
        expect(collapsedStepCount(fiveStepWidths, 1000)).toBe(0);
    });

    test("collapses only the step after the first when that is enough to fit", () => {
        const oneCollapsedWidthPx = 490 - 130 - 20 + COLLAPSED_STEP_WIDTH_PX + 20;
        expect(collapsedStepCount(fiveStepWidths, oneCollapsedWidthPx)).toBe(1);
        expect(collapsedStepCount(fiveStepWidths, 489)).toBe(1);
    });

    test("collapses the steps after the first in order until the trail fits", () => {
        const twoCollapsedWidthPx = 490 - 130 - 70 - 40 + COLLAPSED_STEP_WIDTH_PX + 20;
        expect(collapsedStepCount(fiveStepWidths, twoCollapsedWidthPx)).toBe(2);
        expect(collapsedStepCount(fiveStepWidths, twoCollapsedWidthPx + 1)).toBe(2);
    });

    test("collapses every step between the first and last when only that fits", () => {
        const everyCollapsedWidthPx = 50 + 90 + 40 + COLLAPSED_STEP_WIDTH_PX;
        expect(collapsedStepCount(fiveStepWidths, everyCollapsedWidthPx)).toBe(3);
    });

    test("collapses every step between the first and last, and never those two, when even that does not fit", () => {
        expect(collapsedStepCount(fiveStepWidths, 10)).toBe(3);
        expect(collapsedStepCount(fiveStepWidths, 0)).toBe(3);
    });

    test("collapses no step of a trail of two steps or fewer, which has no step between its first and last", () => {
        expect(collapsedStepCount({
            stepWidthsPx: [100, 100],
            separatorWidthPx: 20,
        }, 50)).toBe(0);
        expect(collapsedStepCount({
            stepWidthsPx: [100],
            separatorWidthPx: 0,
        }, 50)).toBe(0);
        expect(collapsedStepCount({
            stepWidthsPx: [],
            separatorWidthPx: 0,
        }, 0)).toBe(0);
    });
});
