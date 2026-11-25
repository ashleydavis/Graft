//
// Tests the Help pane: its heading, the help it is given drawn as the pane's or page's name, what
// it shows, its keys as key caps with what they do and what a click does, a page's help with no
// keys or clicks and its text on a path with no page of its own.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { HelpPane } from "../../components/help-pane";
import { PANE_HELP, viewHelp } from "../../lib/context-help";

//
// The element with the data-id in the container.
//
function elementWithDataId(container: HTMLElement, dataId: string): HTMLElement | undefined {
    return container.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
}

describe("HelpPane", () => {
    test("is headed Help", () => {
        const { container } = render(createElement(HelpPane, {
            help: viewHelp("welcome-page"),
        }));
        expect(elementWithDataId(container, "help-pane-heading")?.textContent).toBe("Help");
        expect(elementWithDataId(container, "help-pane")?.querySelector("h2")?.textContent).toBe("Help");
    });

    test("shows a page's name and what it is for, with no keys or clicks", () => {
        const { container } = render(createElement(HelpPane, {
            help: viewHelp("about-page"),
        }));
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("About");
        expect(elementWithDataId(container, "help-pane-description")?.textContent).toBe("What Graft is, its version and where to find out more.");
        expect(elementWithDataId(container, "help-pane-keys")).toBeUndefined();
        expect(elementWithDataId(container, "help-pane-clicks")).toBeUndefined();
        expect(elementWithDataId(container, "help-pane-empty")).toBeUndefined();
    });

    test("shows a pane's name, what it shows, its keys with what they do and its clicks", () => {
        const { container } = render(createElement(HelpPane, {
            help: viewHelp("commit-pane"),
        }));
        expect(elementWithDataId(container, "help-pane-name")?.textContent).toBe("Commit pane");
        expect(elementWithDataId(container, "help-pane-description")?.textContent).toBe(PANE_HELP["commit-pane"].description);
        const keyRows = elementWithDataId(container, "help-pane-keys")?.children;
        expect(keyRows).toHaveLength(PANE_HELP["commit-pane"].keys.length);
        expect(elementWithDataId(container, "help-pane-key-0-text")?.textContent).toBe(PANE_HELP["commit-pane"].keys[0].text);
        expect(elementWithDataId(container, "help-pane-key-1-text")?.textContent).toBe("Makes the repo details pane active.");
        const clicks = elementWithDataId(container, "help-pane-clicks")?.querySelectorAll("li");
        expect(Array.from(clicks ?? []).map(click => click.textContent)).toEqual(PANE_HELP["commit-pane"].clicks);
        expect(elementWithDataId(container, "help-pane-click-0")?.textContent).toBe("Click a commit to open its details.");
    });

    test("draws each key as a key cap of its own", () => {
        const { container } = render(createElement(HelpPane, {
            help: viewHelp("commit-pane"),
        }));
        const upCaps = elementWithDataId(container, "help-pane-key-0-Up")?.querySelectorAll("kbd");
        expect(upCaps).toHaveLength(1);
        expect(upCaps?.[0]?.textContent).toBe("Up");
        expect(elementWithDataId(container, "help-pane-key-0-Down")?.querySelector("kbd")?.textContent).toBe("Down");
        expect(elementWithDataId(container, "help-pane-key-1-Left")?.querySelector("kbd")?.textContent).toBe("Left");
        expect(elementWithDataId(container, "help-pane-keys")?.querySelectorAll("kbd")).toHaveLength(6);
    });

    test("shows there is no help for a path with no page of its own", () => {
        const { container } = render(createElement(HelpPane, {
            help: undefined,
        }));
        expect(elementWithDataId(container, "help-pane-heading")?.textContent).toBe("Help");
        expect(elementWithDataId(container, "help-pane-empty")?.textContent).toBe("There is no help for this page.");
        expect(elementWithDataId(container, "help-pane-name")).toBeUndefined();
    });
});
