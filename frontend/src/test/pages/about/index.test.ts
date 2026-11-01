//
// Tests the About page: renders it into the test's document and checks it shows Graft's name,
// what Graft is and its icon, a Font Awesome icon inside a MaterialUI Avatar that carries the
// Tailwind class.
//

import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { AboutPage } from "../../../pages/about";

describe("AboutPage", () => {
    test("shows the heading", () => {
        render(createElement(AboutPage));
        expect(screen.getByText("About Graft").getAttribute("data-id")).toBe("about-heading");
    });

    test("says what Graft is", () => {
        render(createElement(AboutPage));
        expect(screen.getByText(/Graft is a desktop Git client/).getAttribute("data-id")).toBe("about-description");
    });

    test("shows the Font Awesome icon in a MaterialUI Avatar styled with a Tailwind class", () => {
        const { container } = render(createElement(AboutPage));
        const avatar = container.querySelector("[data-id=\"about-icon\"]");
        expect(avatar).not.toBeNull();
        expect(avatar?.classList.contains("MuiAvatar-root")).toBe(true);
        expect(avatar?.classList.contains("bg-emerald-700")).toBe(true);
        expect(avatar?.querySelector("svg[data-icon=\"code-branch\"]")).not.toBeNull();
    });
});
