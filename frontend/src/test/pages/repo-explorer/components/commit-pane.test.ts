//
// Tests the commit pane: renders it with commits and checks that it holds the commit list in a
// card headed "Commits" that never shrinks, passes the selected and open commits on to the list,
// marks the pane active with a border in the style guide's active pane colour, that clicking a
// commit reports its hash and that its close button reports a close.
// It checks the maximise button reports a click and the card fills the repo explorer while
// maximised.
// It checks the collapse button and the strip drawn while the pane is collapsed.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ICommit } from "../../../../lib/commits";
import { maximisedPaneClasses } from "../../../../pages/repo-explorer/components/pane-width";
import { activePaneClasses } from "../../../../pages/repo-explorer/components/active-pane-style";
import { openRowClasses } from "../../../../pages/repo-explorer/components/commit-list";
import { CommitPane } from "../../../../pages/repo-explorer/components/commit-pane";
import { IFakeListLayout, installFakeListLayout } from "../../../fake-list-layout";

//
// The fake layout each test runs with, so the commit list has a height to draw its rows in.
//
let layout: IFakeListLayout;

beforeEach(() => {
    layout = installFakeListLayout();
});

afterEach(() => {
    layout.uninstall();
});

//
// A commit to list.
//
const commit: ICommit = {
    hash: "1111111111111111111111111111111111111111",
    parentHashes: [],
    refs: ["HEAD -> main"],
    authorName: "Ada Author",
    authorEmail: "ada@example.com",
    authorDate: new Date("2026-01-01T12:00:00Z"),
    committerName: "Ada Author",
    committerEmail: "ada@example.com",
    committerDate: new Date("2026-01-01T12:00:00Z"),
    title: "The first commit",
    description: "",
};

//
// Renders the pane with the commit selected and open, active or not, with the callbacks, in en-US
// and UTC.
//
function renderPane(isActive: boolean, onSelectCommit: jest.Mock, onClose: jest.Mock): HTMLElement {
    const { container } = render(createElement(CommitPane, {
        commits: [commit],
        isLoading: false,
        error: undefined,
        hasReadLastPage: true,
        selectedHash: commit.hash,
        openHash: commit.hash,
        isActive,
        isMaximised: false,
        onToggleMaximise: jest.fn(),
        isCollapsed: false,
        onToggleCollapse: jest.fn(),
        dateFormat: {
            locale: "en-US",
            timeZone: "UTC",
        },
        onSelectCommit,
        onNearEnd: jest.fn(),
        onClose,
    }));
    return container;
}

describe("CommitPane", () => {
    test("holds the commit list in a card headed Commits that never shrinks", () => {
        const container = renderPane(false, jest.fn(), jest.fn());
        const pane = container.querySelector("[data-id=\"commit-pane\"]");
        expect(pane?.className).toContain("flex-none");
        expect(pane?.className).toContain("rounded-[var(--radius-lg)]");
        expect(pane?.querySelector("[data-id=\"commit-pane-heading\"]")?.textContent).toBe("Commits");
        //
        // The badge column holds a hidden copy of the badges it measures, so "main" is in it twice.
        //
        expect(pane?.querySelector("[data-id=\"commit-list\"]")?.textContent).toBe("The first commitmainmainAda AuthorJan 11111111");
    });

    test("shows the selected commit as selected and the open commit as open", () => {
        const container = renderPane(false, jest.fn(), jest.fn());
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain("Mui-selected");
        expect(container.querySelector(`[data-id="commit-${commit.hash}"]`)?.className).toContain(openRowClasses);
    });

    test("draws its border in the style guide's active pane colour while it is active", () => {
        const container = renderPane(true, jest.fn(), jest.fn());
        expect(container.querySelector<HTMLElement>("[data-id=\"commit-pane\"]")?.className).toContain(activePaneClasses);
    });

    test("keeps its grey border while it is not active", () => {
        const container = renderPane(false, jest.fn(), jest.fn());
        expect(container.querySelector<HTMLElement>("[data-id=\"commit-pane\"]")?.className).not.toContain(activePaneClasses);
    });

    test("passes on that the last page has been read, so the list shows the end of list row", () => {
        const container = renderPane(false, jest.fn(), jest.fn());
        expect(container.querySelector("[data-id=\"commits-end\"]")?.textContent).toBe("That is every commit.");
    });

    test("reports the hash of the commit the user clicks", () => {
        const onSelectCommit = jest.fn();
        renderPane(false, onSelectCommit, jest.fn());
        fireEvent.click(screen.getByText("The first commit"));
        expect(onSelectCommit).toHaveBeenCalledWith(commit.hash);
    });

    test("shows a close button with a Close tooltip at the right of its header that reports a close", async () => {
        const onClose = jest.fn();
        const container = renderPane(false, jest.fn(), onClose);
        const header = container.querySelector("[data-id=\"commit-pane-heading\"]")?.parentElement;
        const closeButton = container.querySelector<HTMLElement>("[data-id=\"commit-pane-close\"]");
        expect(header?.lastElementChild).toBe(closeButton);
        expect(closeButton?.getAttribute("aria-label")).toBe("Close commits");
        fireEvent.mouseOver(screen.getByLabelText("Close commits"));
        expect((await screen.findByRole("tooltip")).textContent).toBe("Close");
        fireEvent.click(screen.getByLabelText("Close commits"));
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe("CommitPane maximise button", () => {
    test("reports a click and fills the repo explorer while the pane is maximised", () => {
        const onToggleMaximise = jest.fn();
        const { container } = render(createElement(CommitPane, {
            commits: [commit],
            isLoading: false,
            error: undefined,
            hasReadLastPage: false,
            selectedHash: undefined,
            openHash: undefined,
            isActive: true,
            isMaximised: true,
            onToggleMaximise,
            isCollapsed: false,
            onToggleCollapse: jest.fn(),
            dateFormat: {
                locale: "en-US",
                timeZone: "UTC",
            },
            onSelectCommit: jest.fn(),
            onNearEnd: jest.fn(),
            onClose: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"commit-pane\"]")?.className).toContain(maximisedPaneClasses);
        expect(container.querySelector("[data-id=\"commit-pane-collapse\"]")).toBeNull();
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("data-id")).toBe("commit-pane-maximise");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });
});

describe("CommitPane collapse", () => {
    test("reports a click on its collapse button in its header", () => {
        const onToggleCollapse = jest.fn();
        const { container } = render(createElement(CommitPane, {
            commits: [commit],
            isLoading: false,
            error: undefined,
            hasReadLastPage: false,
            selectedHash: undefined,
            openHash: undefined,
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed: false,
            onToggleCollapse,
            dateFormat: {
                locale: "en-US",
                timeZone: "UTC",
            },
            onSelectCommit: jest.fn(),
            onNearEnd: jest.fn(),
            onClose: jest.fn(),
        }));
        const collapse = container.querySelector<HTMLElement>("[data-id=\"commit-pane-collapse\"]");
        expect(collapse).not.toBeNull();

        //
        // The cast is safe because the expect above fails the test on null, and a type guard cannot
        // narrow it because Jest's expect does not narrow the type.
        //
        fireEvent.click(collapse as HTMLElement);
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });

    test("draws the strip with Commits down it in its place while it is collapsed, and reports a click on its restore button", () => {
        const onToggleCollapse = jest.fn();
        const { container } = render(createElement(CommitPane, {
            commits: [commit],
            isLoading: false,
            error: undefined,
            hasReadLastPage: false,
            selectedHash: undefined,
            openHash: undefined,
            isActive: false,
            isMaximised: false,
            onToggleMaximise: jest.fn(),
            isCollapsed: true,
            onToggleCollapse,
            dateFormat: {
                locale: "en-US",
                timeZone: "UTC",
            },
            onSelectCommit: jest.fn(),
            onNearEnd: jest.fn(),
            onClose: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"commit-pane\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"commit-list\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"commit-pane-strip\"]")?.getAttribute("aria-label")).toBe("Commits");
        expect(container.querySelector("[data-id=\"commit-pane-strip-title\"]")?.textContent).toBe("Commits");
        fireEvent.click(screen.getByLabelText("Restore commits"));
        expect(onToggleCollapse).toHaveBeenCalledTimes(1);
    });
});
