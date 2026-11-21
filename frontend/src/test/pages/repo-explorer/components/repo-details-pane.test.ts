//
// Tests the repo details pane: renders it for a repo and checks that it shows the repo's name and
// path in a card headed "Repo" that never shrinks, shows the Commits and Commit links as selected
// and open as it is told, marks the pane active with a border in the style guide's active pane
// colour and that clicking each link reports its name.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { COMMIT_LINK, COMMITS_LINK } from "../../../../lib/repo-explorer";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { openRowClasses } from "../../../../pages/repo-explorer/components/commit-list";
import { RepoDetailsPane } from "../../../../pages/repo-explorer/components/repo-details-pane";

//
// Renders the pane for the repo at /repos/graft with the link selected and open as given, active or
// not, with the callback.
//
function renderPane(options: { link: string | undefined; isActive: boolean; onSelectLink: jest.Mock }): HTMLElement {
    const { container } = render(createElement(RepoDetailsPane, {
        repoPath: "/repos/graft",
        selectedLink: options.link,
        openLink: options.link,
        isActive: options.isActive,
        onSelectLink: options.onSelectLink,
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

    test("shows the Commit link with its icon below the Commits link, neither selected nor open, while no link is", () => {
        const container = renderPane({
            link: undefined,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-commit");
        expect(link.textContent).toBe("Commit");
        expect(link.querySelector("svg[data-icon=\"pen-to-square\"]")).not.toBeNull();
        expect(link.className).not.toContain("Mui-selected");
        expect(link.getAttribute("aria-current")).toBeNull();
        const rows = Array.from(elementIn(container, "repo-details-links").children).map(row => row.getAttribute("data-id"));
        expect(rows).toEqual(["repo-details-commits", "repo-details-commit"]);
    });

    test("shows the Commit link alone as selected and open while the changes pane is open", () => {
        const container = renderPane({
            link: COMMIT_LINK,
            isActive: false,
            onSelectLink: jest.fn(),
        });
        const link = elementIn(container, "repo-details-commit");
        expect(link.className).toContain("Mui-selected");
        expect(link.className).toContain(openRowClasses);
        expect(link.getAttribute("aria-current")).toBe("true");
        expect(elementIn(container, "repo-details-commits").className).not.toContain("Mui-selected");
    });

    test("reports the Commit link when the user clicks it", () => {
        const onSelectLink = jest.fn();
        renderPane({
            link: undefined,
            isActive: false,
            onSelectLink,
        });
        fireEvent.click(screen.getByText("Commit"));
        expect(onSelectLink).toHaveBeenCalledWith(COMMIT_LINK);
    });
});
