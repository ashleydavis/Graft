//
// Tests the About page: renders it and checks it shows Graft's name, version and what Graft is,
// its icon (a Font Awesome icon inside a MaterialUI Avatar) in a header beside the name and
// version, its links to Graft, Playbook and Ziggy on GitHub and to the Graft video series on
// YouTube under the "Find out more" heading and Graft's licence.
//

import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { AboutLink, AboutPage } from "../../../pages/about";

//
// Checks the link with the label has the data-id, goes to the address and opens in a new window
// with no referrer.
//
function expectLink(label: string, dataId: string, href: string): void {
    const link = screen.getByText(label);
    expect(link.tagName).toBe("A");
    expect(link.getAttribute("data-id")).toBe(dataId);
    expect(link.getAttribute("href")).toBe(href);
    expect(link.getAttribute("target")).toBe("_blank");
    expect(link.getAttribute("rel")).toBe("noreferrer");
}

describe("AboutPage", () => {
    test("shows the heading", () => {
        render(createElement(AboutPage));
        expect(screen.getByText("About Graft").getAttribute("data-id")).toBe("about-heading");
    });

    test("shows the version from version.ts", () => {
        render(createElement(AboutPage));
        expect(screen.getByText("Version dev").getAttribute("data-id")).toBe("about-version");
    });

    test("says what Graft is", () => {
        render(createElement(AboutPage));
        expect(screen.getByText(/Graft is a desktop Git client/).getAttribute("data-id")).toBe("about-description");
    });

    test("shows the Font Awesome icon in a MaterialUI Avatar, which the style guide theme colours", () => {
        const { container } = render(createElement(AboutPage));
        const avatar = container.querySelector("[data-id=\"about-icon\"]");
        expect(avatar).not.toBeNull();
        expect(avatar?.classList.contains("MuiAvatar-root")).toBe(true);
        expect(avatar?.querySelector("svg[data-icon=\"code-branch\"]")).not.toBeNull();
    });

    test("shows the icon, the heading and the version together in the header", () => {
        const { container } = render(createElement(AboutPage));
        const header = container.querySelector("[data-id=\"about-header\"]");
        expect(header?.tagName).toBe("HEADER");
        expect(header?.querySelector("[data-id=\"about-icon\"]")).not.toBeNull();
        expect(header?.querySelector("[data-id=\"about-heading\"]")?.tagName).toBe("H1");
        expect(header?.querySelector("[data-id=\"about-version\"]")).not.toBeNull();
    });

    test("puts the links under the Find out more heading", () => {
        const { container } = render(createElement(AboutPage));
        const section = container.querySelector("[data-id=\"about-links-section\"]");
        const heading = screen.getByText("Find out more");
        expect(heading.tagName).toBe("H2");
        expect(heading.getAttribute("data-id")).toBe("about-links-heading");
        expect(section?.contains(heading)).toBe(true);
        expect(section?.querySelector("[data-id=\"about-links\"]")?.querySelectorAll("a")).toHaveLength(4);
    });

    test("links to Graft on GitHub", () => {
        render(createElement(AboutPage));
        expectLink("Graft on GitHub", "about-graft-link", "https://github.com/ashleydavis/Graft");
    });

    test("links to Playbook on GitHub", () => {
        render(createElement(AboutPage));
        expectLink("Playbook on GitHub", "about-playbook-link", "https://github.com/ashleydavis/playbook");
    });

    test("links to Ziggy on GitHub", () => {
        render(createElement(AboutPage));
        expectLink("Ziggy on GitHub", "about-ziggy-link", "https://github.com/ashleydavis/ziggy");
    });

    test("links to the Graft video series on YouTube", () => {
        render(createElement(AboutPage));
        expectLink("The Graft video series on YouTube", "about-videos-link", "https://www.youtube.com/@CodeCapers/search?query=Graft");
    });

    test("names the MIT licence", () => {
        render(createElement(AboutPage));
        expect(screen.getByText("Graft is released under the MIT licence.").getAttribute("data-id")).toBe("about-licence");
    });

    test("has no link to the commits page", () => {
        const { container } = render(createElement(AboutPage));
        expect(screen.queryByText("Commits")).toBeNull();
        expect(container.querySelector("[data-id=\"about-commits-link\"]")).toBeNull();
    });
});

describe("AboutLink", () => {
    test("shows its label as a link that opens the address in a new window", () => {
        render(createElement(AboutLink, {
            href: "https://example.com/",
            label: "Example",
            dataId: "example-link",
        }));
        expectLink("Example", "example-link", "https://example.com/");
    });
});
