//
// Tests the repo details pane: renders it for a repo and checks that it shows the repo's name and
// path in a card headed "Repo" that never shrinks, shows the Commits and Changes links as selected
// and open as it is told, marks the pane active with a border in the style guide's active pane
// colour and that clicking each link reports its name. It checks the Branches list: the heading
// and count, a row per branch with its icon and name, the checked-out branch's HEAD badge, the
// selected and open branch, a click reporting the branch's row name, the loading text, the error
// text and a repo with no branches.
// It checks the maximise button reports a click, the card fills the repo explorer while maximised
// and the pane is hidden, still drawn, while another pane is maximised.
// It checks the collapse button and the strip drawn while the pane is collapsed.
// It checks the Tags heading lists a row for each tag, the same kind of row as the links, that
// clicking a tag reports its link, that a repo with no tags shows the heading alone and that tags
// that could not be read show why.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { IBranch } from "../../../../lib/branches";
import { branchLink, CHANGES_LINK, COMMITS_LINK, tagLink } from "../../../../lib/repo-explorer";
import { maximisedPaneClasses } from "../../../../pages/repo-explorer/components/pane-width";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { openRowClasses } from "../../../../pages/repo-explorer/components/commit-list";
import { RepoDetailsPane } from "../../../../pages/repo-explorer/components/repo-details-pane";

//
// The branches the pane lists in most tests: feature/x, then main, which is checked out.
//
const twoBranches: IBranch[] = [
    {
        name: "feature/x",
        isCheckedOut: false,
    },
    {
        name: "main",
        isCheckedOut: true,
    },
];

//
// Renders the pane for the repo at /repos/graft with the link selected and open as given, active or
// not, with the callback, listing twoBranches and the tags v1.0 and v2.0.
//
function renderPane(options: { link: string | undefined; isActive: boolean; onSelectLink: jest.Mock }): HTMLElement {
    return renderPaneWithBranches({
        ...options,
        branches: twoBranches,
        branchesError: undefined,
        tagNames: ["v1.0", "v2.0"],
        tagsError: undefined,
    });
}

//
// Renders the pane as renderPane does, with the tags and the tags error as given.
//
function renderPaneWithTags(options: { link: string | undefined; isActive: boolean; onSelectLink: jest.Mock; tagNames: string[] | undefined; tagsError: string | undefined }): HTMLElement {
    return renderPaneWithBranches({
        ...options,
        branches: twoBranches,
        branchesError: undefined,
    });
}

//
// Renders the pane as renderPane does, with the branches and the branches error given.
//
function renderPaneWithBranches(options: { link: string | undefined; isActive: boolean; onSelectLink: jest.Mock; branches: IBranch[] | undefined; branchesError: string | undefined; tagNames?: string[]; tagsError?: string }): HTMLElement {
    const { container } = render(createElement(RepoDetailsPane, {
        repoPath: "/repos/graft",
        branches: options.branches,
        branchesError: options.branchesError,
        selectedLink: options.link,
        openLink: options.link,
        isActive: options.isActive,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        isCollapsed: false,
        onToggleCollapse: jest.fn(),
        isHidden: false,
        tagNames: options.tagNames,
        tagsError: options.tagsError,
        onSelectLink: options.onSelectLink,
        width: undefined,
    }));
    return container;
}

//
// Finds the element with the data-id in the container, failing the test when it is not there.
//
function elementIn(container: HTMLElement, dataId: string): HTMLElement {
    const element = container.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
    expect(element).not.toBeNull();

    //
    // The cast is safe because the expect above fails the test on null, and a type guard cannot
    // narrow it because Jest's expect does not narrow the type.
    //
    return element as HTMLElement;
}

describe("RepoDetailsPane", () => {
    test("shows the repo's name and path in a card headed Repo that never shrinks", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const pane = elementIn(container, "repo-details-pane");
        expect(pane.className).toContain("flex-none");
        expect(pane.className).toContain("rounded-[var(--radius-lg)]");
        expect(pane.getAttribute("aria-label")).toBe("Repo details");
        expect(elementIn(container, "repo-details-heading").textContent).toBe("Repograft");
        expect(elementIn(container, "repo-details-name").textContent).toBe("graft");
        expect(elementIn(container, "repo-details-path").textContent).toBe("/repos/graft");
    });

    test("shows the Commits link with its icon, neither selected nor open, while no link is", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-commits");
        expect(link.textContent).toBe("Commits");
        expect(link.querySelector("svg[data-icon=\"code-commit\"]")).not.toBeNull();
        expect(link.className).not.toContain("Mui-selected");
        expect(link.className).not.toContain(openRowClasses);
        expect(link.getAttribute("aria-current")).toBeNull();
    });

    test("shows the Commits link as selected and open while its pane is open", () => {
        const container = renderPane({
            link: COMMITS_LINK,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-commits");
        expect(link.className).toContain("Mui-selected");
        expect(link.className).toContain(openRowClasses);
        expect(link.getAttribute("aria-current")).toBe("true");
    });

    test("draws its border in the style guide's active pane colour only while it is active", () => {
        const active = renderPane({
            link: undefined,
            isActive: true,
            onSelectLink: jest.fn(),
        });
        expect(elementIn(active, "repo-details-pane").className).toContain(activePaneClasses);
        const inactive = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        expect(elementIn(inactive, "repo-details-pane").className).not.toContain(activePaneClasses);
    });

    test("reports the Commits link when the user clicks it", () => {
        const onSelectLink = jest.fn();
        renderPane({
            link: undefined,
            isActive: false,
            onSelectLink,
        });
        fireEvent.click(screen.getByText("Commits"));
        expect(onSelectLink).toHaveBeenCalledWith(COMMITS_LINK);
    });

    test("shows the Changes link with its icon below the Commits link, neither selected nor open, while no link is", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-changes");
        expect(link.textContent).toBe("Changes");
        expect(link.querySelector("svg[data-icon=\"pen-to-square\"]")).not.toBeNull();
        expect(link.className).not.toContain("Mui-selected");
        expect(link.getAttribute("aria-current")).toBeNull();
        const rows = Array.from(elementIn(container, "repo-details-links").children).map(row => row.getAttribute("data-id"));
        expect(rows).toEqual(["repo-details-commits", "repo-details-changes"]);
    });

    test("shows the Changes link alone as selected and open while the changes pane is open", () => {
        const container = renderPane({
            link: CHANGES_LINK,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-changes");
        expect(link.className).toContain("Mui-selected");
        expect(link.className).toContain(openRowClasses);
        expect(link.getAttribute("aria-current")).toBe("true");
        expect(elementIn(container, "repo-details-commits").className).not.toContain("Mui-selected");
    });

    test("reports the Changes link when the user clicks it", () => {
        const onSelectLink = jest.fn();
        renderPane({
            link: undefined,
            isActive: false,
            onSelectLink,
        });
        fireEvent.click(screen.getByText("Changes"));
        expect(onSelectLink).toHaveBeenCalledWith(CHANGES_LINK);
    });
});

describe("RepoDetailsPane maximise button", () => {
    //
    // Renders the pane maximised or hidden as given, with the maximise callback.
    //
    function renderSized(options: { isMaximised: boolean; isHidden: boolean; onToggleMaximise: jest.Mock }): HTMLElement {
        const { container } = render(createElement(RepoDetailsPane, {
            repoPath: "/repos/graft",
            branches: undefined,
            branchesError: undefined,
            selectedLink: undefined,
            openLink: undefined,
            isActive: true,
            isMaximised: options.isMaximised,
            onToggleMaximise: options.onToggleMaximise,
            isHidden: options.isHidden,
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            tagNames: undefined,
            tagsError: undefined,
            onSelectLink: jest.fn(),
            width: undefined,
        }));
        return container;
    }

    test("reports a click and fills the repo explorer while the pane is maximised", () => {
        const onToggleMaximise = jest.fn();
        const container = renderSized({
            isMaximised: true,
            isHidden: false,
            onToggleMaximise,
        });
        const pane = elementIn(container, "repo-details-pane");
        expect(pane.className).toContain(maximisedPaneClasses);
        expect(pane.className.split(" ")).not.toContain("hidden");
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("data-id")).toBe("repo-details-maximise");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });

    test("is hidden, still drawn, while another pane is maximised", () => {
        const container = renderSized({
            isMaximised: false,
            isHidden: true,
            onToggleMaximise: jest.fn(),
        });
        const pane = elementIn(container, "repo-details-pane");
        expect(pane.className.split(" ")).toContain("hidden");
        expect(pane.className.split(" ")).not.toContain("flex");
        expect(screen.getByLabelText("Maximise the pane", {
            selector: "button",
        })).not.toBeNull();
    });
});

describe("RepoDetailsPane collapse", () => {
    test("reports a click on its collapse button in its header", () => {
        const onToggleCollapse = jest.fn();
        const { container } = render(createElement(RepoDetailsPane, {
            repoPath: "/repos/graft",
            branches: undefined,
            branchesError: undefined,
            selectedLink: undefined,
            openLink: undefined,
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isHidden: false,
            isCollapsed: false,
            onToggleCollapse,
            tagNames: undefined,
            tagsError: undefined,
            onSelectLink: jest.fn(),
            width: undefined,
        }));
        fireEvent.click(elementIn(container, "repo-details-pane-collapse"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("draws the strip with Repo and the repo's name down it in its place while it is collapsed, and reports a click on its restore button", () => {
        const onToggleCollapse = jest.fn();
        const { container } = render(createElement(RepoDetailsPane, {
            repoPath: "/repos/graft",
            branches: undefined,
            branchesError: undefined,
            selectedLink: undefined,
            openLink: undefined,
            isActive: true,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isHidden: false,
            isCollapsed: true,
            onToggleCollapse,
            tagNames: undefined,
            tagsError: undefined,
            onSelectLink: jest.fn(),
            width: undefined,
        }));
        expect(container.querySelector("[data-id=\"repo-details-pane\"]")).toBeNull();
        expect(elementIn(container, "repo-details-pane-strip").getAttribute("aria-label")).toBe("Repo details");
        expect(elementIn(container, "repo-details-pane-strip").className).toContain(activePaneClasses);
        expect(elementIn(container, "repo-details-pane-strip-title").textContent).toBe("Repo graft");
        fireEvent.click(elementIn(container, "repo-details-pane-restore"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("lists each branch under a Branches heading with its count, its icon and its name", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        expect(elementIn(container, "repo-details-branches-heading").textContent).toBe("Branches");
        expect(elementIn(container, "repo-details-branches-count").textContent).toBe("2");
        const rows = Array.from(elementIn(container, "repo-details-branch-list").children).map(row => row.getAttribute("data-id"));
        expect(rows).toEqual(["repo-details-branch-feature/x", "repo-details-branch-main"]);
        const row = elementIn(container, "repo-details-branch-feature/x");
        expect(row.textContent).toBe("feature/x");
        expect(row.querySelector("svg[data-icon=\"code-branch\"]")).not.toBeNull();
        expect(row.className).toContain("MuiListItemButton-root");
        expect(row.className).not.toContain("Mui-selected");
        expect(row.getAttribute("aria-current")).toBeNull();
    });

    test("marks only the checked-out branch with a HEAD badge", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        expect(elementIn(container, "repo-details-branch-main").querySelector("[data-id=\"repo-details-branch-checked-out\"]")?.textContent).toBe("HEAD");
        expect(elementIn(container, "repo-details-branch-feature/x").querySelector("[data-id=\"repo-details-branch-checked-out\"]")).toBeNull();
    });

    test("shows a branch as selected and open while its branch pane is open", () => {
        const container = renderPane({
            link: branchLink("feature/x"),
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const row = elementIn(container, "repo-details-branch-feature/x");
        expect(row.className).toContain("Mui-selected");
        expect(row.className).toContain(openRowClasses);
        expect(row.getAttribute("aria-current")).toBe("true");
        expect(elementIn(container, "repo-details-branch-main").className).not.toContain("Mui-selected");
        expect(elementIn(container, "repo-details-commits").className).not.toContain("Mui-selected");
    });

    test("reports the branch's row name when the user clicks a branch", () => {
        const onSelectLink = jest.fn();
        renderPane({
            link: undefined,
            isActive: false,
            onSelectLink,
        });
        fireEvent.click(screen.getByText("feature/x"));
        expect(onSelectLink).toHaveBeenCalledWith(branchLink("feature/x"));
    });

    test("shows the heading and that the branches are loading while they are read", () => {
        const container = renderPaneWithBranches({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
            branches: undefined,
            branchesError: undefined,
        });
        expect(elementIn(container, "repo-details-branches-heading").textContent).toBe("Branches");
        expect(elementIn(container, "repo-details-branches-loading").textContent).toBe("Loading the branches.");
        expect(container.querySelector("[data-id=\"repo-details-branches-count\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"repo-details-branch-list\"]")).toBeNull();
    });

    test("shows why the branches could not be read, and no loading text", () => {
        const container = renderPaneWithBranches({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
            branches: undefined,
            branchesError: "Running git for-each-ref failed.",
        });
        expect(elementIn(container, "repo-details-branches-error").textContent).toBe("Running git for-each-ref failed.");
        expect(container.querySelector("[data-id=\"repo-details-branches-loading\"]")).toBeNull();
    });

    test("shows the heading with a count of 0, no rows and no error for a repo with no branches", () => {
        const container = renderPaneWithBranches({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
            branches: [],
            branchesError: undefined,
        });
        expect(elementIn(container, "repo-details-branches-heading").textContent).toBe("Branches");
        expect(elementIn(container, "repo-details-branches-count").textContent).toBe("0");
        expect(elementIn(container, "repo-details-branch-list").children.length).toBe(0);
        expect(container.querySelector("[data-id=\"repo-details-branches-error\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"repo-details-branches-loading\"]")).toBeNull();
    });

    test("lists each tag under the Tags heading as a row with the tag icon and its name, as the links are drawn", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        expect(elementIn(container, "repo-details-tags-heading").textContent).toBe("Tags");
        const rows = Array.from(elementIn(container, "repo-details-tags").children);
        expect(rows.map(row => row.getAttribute("data-id"))).toEqual(["repo-details-tag-v1.0", "repo-details-tag-v2.0"]);
        const row = elementIn(container, "repo-details-tag-v1.0");
        expect(row.textContent).toBe("v1.0");
        expect(row.querySelector("svg[data-icon=\"tag\"]")).not.toBeNull();
        expect(row.className).toContain("MuiListItemButton-root");
        expect(row.className).toBe(elementIn(container, "repo-details-commits").className);
        expect(container.querySelector("[data-id=\"repo-details-tags-error\"]")).toBeNull();
    });

    test("shows a tag's row alone as selected and open while its tag pane is open", () => {
        const container = renderPane({
            link: tagLink("v2.0"),
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const row = elementIn(container, "repo-details-tag-v2.0");
        expect(row.className).toContain("Mui-selected");
        expect(row.className).toContain(openRowClasses);
        expect(row.getAttribute("aria-current")).toBe("true");
        expect(elementIn(container, "repo-details-tag-v1.0").className).not.toContain("Mui-selected");
        expect(elementIn(container, "repo-details-commits").className).not.toContain("Mui-selected");
    });

    test("reports the tag's link when the user clicks a tag", () => {
        const onSelectLink = jest.fn();
        renderPane({
            link: undefined,
            isActive: false,
            onSelectLink,
        });
        fireEvent.click(screen.getByText("v2.0"));
        expect(onSelectLink).toHaveBeenCalledWith(tagLink("v2.0"));
    });

    test("shows the Tags heading with no rows and no error for a repo with no tags and before the tags are read", () => {
        for (const tagNames of [[], undefined]) {
            const container = renderPaneWithTags({
                link: undefined,
                isActive: false,
                onSelectLink: jest.fn(),
                tagNames,
                tagsError: undefined,
            });
            expect(elementIn(container, "repo-details-tags-heading").textContent).toBe("Tags");
            expect(elementIn(container, "repo-details-tags").children.length).toBe(0);
            expect(container.querySelector("[data-id=\"repo-details-tags-error\"]")).toBeNull();
        }
    });

    test("shows why the tags could not be read under the Tags heading", () => {
        const container = renderPaneWithTags({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
            tagNames: undefined,
            tagsError: "Running git for-each-ref failed.",
        });
        expect(elementIn(container, "repo-details-tags-error").textContent).toBe("Running git for-each-ref failed.");
    });
});
