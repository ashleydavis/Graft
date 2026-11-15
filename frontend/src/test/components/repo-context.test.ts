//
// Tests the open repo's context: RepoProvider starts on the repo it is given, or none, openRepo
// opens another in its place for every component that reads it, and useRepo refuses to run outside
// a RepoProvider.
//

import { act, render, screen } from "@testing-library/react";
import { createElement, JSX } from "react";
import { RepoProvider, useRepo } from "../../components/repo-context";

//
// Shows the open repo's path, or "No repo" while none is open, so a test can read what useRepo
// gives, with a button that opens the repo at "/repos/other".
//
function RepoReader(): JSX.Element {
    const { repoPath, openRepo } = useRepo();
    return createElement("div", null,
        createElement("p", {
            "data-id": "repo-path",
        }, repoPath ?? "No repo"),
        createElement("button", {
            onClick: () => openRepo("/repos/other"),
        }, "Open the other repo"),
    );
}

//
// Shows two readers of the open repo inside a RepoProvider that starts on the repo given.
//
function renderReaders(initialRepoPath: string | undefined): void {
    render(createElement(RepoProvider, {
        initialRepoPath,
        children: [
            createElement(RepoReader, {
                key: "first",
            }),
            createElement(RepoReader, {
                key: "second",
            }),
        ],
    }));
}

//
// Reads the text every reader shows for the open repo.
//
function shownRepoPaths(): string[] {
    return screen.getAllByText(/repos|No repo/, {
        selector: "[data-id=\"repo-path\"]",
    }).map(element => element.textContent ?? "");
}

//
// Calls openRepo with an empty path, to check RepoProvider refuses it.
//
function EmptyPathOpener(): JSX.Element {
    const { openRepo } = useRepo();
    return createElement("button", {
        onClick: () => openRepo(""),
    }, "Open no path");
}

describe("RepoProvider", () => {
    test("starts with no repo open when it is given none", () => {
        renderReaders(undefined);
        expect(shownRepoPaths()).toEqual(["No repo", "No repo"]);
    });

    test("starts on the repo it is given", () => {
        renderReaders("/repos/graft");
        expect(shownRepoPaths()).toEqual(["/repos/graft", "/repos/graft"]);
    });

    test("openRepo opens the repo in place of the one open before, for every reader", () => {
        renderReaders("/repos/graft");
        act(() => {
            screen.getAllByText("Open the other repo")[0].click();
        });
        expect(shownRepoPaths()).toEqual(["/repos/other", "/repos/other"]);
    });

    test("openRepo opens a repo when none was open", () => {
        renderReaders(undefined);
        act(() => {
            screen.getAllByText("Open the other repo")[1].click();
        });
        expect(shownRepoPaths()).toEqual(["/repos/other", "/repos/other"]);
    });

    test("openRepo refuses an empty path", () => {
        render(createElement(RepoProvider, {
            initialRepoPath: undefined,
            children: createElement(EmptyPathOpener),
        }));
        const button = screen.getByText("Open no path");
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const errors: Error[] = [];
        const recordError = (event: ErrorEvent): void => {
            errors.push(event.error);
            event.preventDefault();
        };
        window.addEventListener("error", recordError);
        act(() => {
            button.click();
        });
        window.removeEventListener("error", recordError);
        consoleError.mockRestore();
        expect(String(errors[0])).toBe("Error: openRepo was given an empty path, so there is no folder to open. Pass the path of the folder the user chose.");
    });
});

describe("useRepo", () => {
    test("refuses to run outside RepoProvider", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        expect(() => render(createElement(RepoReader))).toThrow("useRepo was called outside RepoProvider, so there is no open repo to read. Render the component inside RepoProvider.");
        consoleError.mockRestore();
    });
});
