//
// Tests the Help page: renders it and checks it shows its heading, the line saying what it holds,
// the Pages section with each of Graft's pages and the Moving between pages section with each way
// to move between them, the `?` key among them as key caps.
//

import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { HelpPage } from "../../../pages/help";

//
// Checks the entry with the data-id shows the term and the text, its term as a dt and its text as
// a dd, so the page's sections are description lists.
//
function expectEntry(container: HTMLElement, dataId: string, term: string, text: string): void {
    const entry = container.querySelector(`[data-id="${dataId}"]`);
    expect(entry).not.toBeNull();
    const termElement = entry?.querySelector(`[data-id="${dataId}-term"]`);
    expect(termElement?.tagName).toBe("DT");
    expect(termElement?.textContent).toBe(term);
    const textElement = entry?.querySelector(`[data-id="${dataId}-text"]`);
    expect(textElement?.tagName).toBe("DD");
    expect(textElement?.textContent).toBe(text);
}

describe("HelpPage", () => {
    test("shows the heading", () => {
        render(createElement(HelpPage));
        const heading = screen.getByText("Help", {
            selector: "h1",
        });
        expect(heading.getAttribute("data-id")).toBe("help-heading");
    });

    test("shows what the page holds", () => {
        render(createElement(HelpPage));
        expect(screen.getByText("Graft shows one page at a time in the middle of its window. These are its pages and the ways to move between them.").getAttribute("data-id")).toBe("help-description");
    });

    test("shows the Pages section with each of Graft's pages", () => {
        const { container } = render(createElement(HelpPage));
        const section = container.querySelector("[data-id=\"help-pages-section\"]");
        const heading = screen.getByText("Pages");
        expect(heading.tagName).toBe("H2");
        expect(heading.getAttribute("data-id")).toBe("help-pages-heading");
        expect(section?.contains(heading)).toBe(true);
        expect(section?.querySelectorAll("dt")).toHaveLength(4);
        expectEntry(container, "help-welcome", "Welcome", "The page Graft starts on. Its Open repo button opens a local Git repo.");
        expectEntry(container, "help-repo-explorer", "Repo explorer", "Shows the open repo. Its Commits link lists the repo's commits.");
        expectEntry(container, "help-help", "Help", "This page.");
        expectEntry(container, "help-about", "About", "What Graft is, its version and where to find out more.");
    });

    test("shows the Moving between pages section with each way to move between them", () => {
        const { container } = render(createElement(HelpPage));
        const section = container.querySelector("[data-id=\"help-moving-section\"]");
        const heading = screen.getByText("Moving between pages");
        expect(heading.tagName).toBe("H2");
        expect(heading.getAttribute("data-id")).toBe("help-moving-heading");
        expect(section?.contains(heading)).toBe(true);
        expect(section?.querySelectorAll("dt")).toHaveLength(4);
        expectEntry(container, "help-left-sidebar", "Left sidebar", "Repo explorer is at the top while a repo is open. Help and About are at the bottom. The menu button at the left of the top bar shrinks the sidebar to its icons and expands it again.");
        expectEntry(container, "help-breadcrumb-trail", "Breadcrumb trail", "The top bar shows the open repo and the page you are on. On the Help and About pages, click the page's name to switch between them.");
        expectEntry(container, "help-file-menu", "File menu", "Open repo opens a local Git repo in the repo explorer. New window opens another Graft window on the welcome page.");
        expectEntry(container, "help-keyboard", "Keyboard", "Press ? to list Graft's keyboard shortcuts, such as the ones that open a repo and return to the repo explorer.");
    });

    test("shows the key of the keyboard shortcuts overlay as a key cap", () => {
        const { container } = render(createElement(HelpPage));
        const keyCaps = container.querySelector("[data-id=\"help-keyboard-text\"] [data-id=\"help-shortcuts-key\"]");
        const caps = keyCaps?.querySelectorAll("kbd");
        expect(caps).toHaveLength(1);
        expect(caps?.[0]?.textContent).toBe("?");
    });

    test("shows the heading, the description and its sections only", () => {
        const { container } = render(createElement(HelpPage));
        const page = container.querySelector("[data-id=\"help-page\"]");
        expect(page?.querySelectorAll("h1")).toHaveLength(1);
        expect(page?.querySelectorAll("h2")).toHaveLength(2);
        expect(page?.querySelectorAll("section")).toHaveLength(2);
        expect(page?.children).toHaveLength(3);
    });
});
