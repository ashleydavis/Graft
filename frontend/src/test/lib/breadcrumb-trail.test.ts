//
// Tests the breadcrumb trail's rules: works out the trail for each of Graft's pages and for any
// other path. Checks which steps are drop-downs, which option is ticked, how the repo's name is
// read from its path, how long steps are cut short and how the search narrows options.
//

import { clipStepLabel, ITrailOption, pageTrail, repoName, searchMatches } from "../../lib/breadcrumb-trail";

describe("pageTrail", () => {
    test("the About page's trail is the repo, then About as a drop-down of the app's pages with About ticked", () => {
        expect(pageTrail("/", "/repos/graft")).toEqual([
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
                        path: "/",
                        dataId: "breadcrumb-option-about",
                        isSelected: true,
                    },
                ],
            },
        ]);
    });

    test("the Help page's trail is the repo, then Help as a drop-down of the app's pages with Help ticked", () => {
        const trail = pageTrail("/help", "/repos/graft");
        expect(trail.length).toBe(2);
        expect(trail[0].label).toBe("graft");
        expect(trail[1].label).toBe("Help");
        expect(trail[1].dataId).toBe("breadcrumb-page");
        expect(trail[1].options.map(option => option.isSelected)).toEqual([true, false]);
    });

    test("the commits page's trail is the repo, then Commits as plain text, because it has no sibling", () => {
        expect(pageTrail("/commits", "/repos/graft")).toEqual([
            {
                label: "graft",
                tooltip: "/repos/graft",
                dataId: "breadcrumb-repo",
                options: [],
            },
            {
                label: "Commits",
                tooltip: "Commits",
                dataId: "breadcrumb-page",
                options: [],
            },
        ]);
    });

    test("any other path gets the repo step only", () => {
        expect(pageTrail("/missing", "/repos/graft")).toEqual([
            {
                label: "graft",
                tooltip: "/repos/graft",
                dataId: "breadcrumb-repo",
                options: [],
            },
        ]);
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
            path: "/",
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
