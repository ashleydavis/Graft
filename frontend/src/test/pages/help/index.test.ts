//
// Tests the Help page: renders it and checks it shows its heading and how to move between Graft's
// pages.
//

import { render, screen } from "@testing-library/react";
import { createElement } from "react";
import { HelpPage } from "../../../pages/help";

describe("HelpPage", () => {
    test("shows the heading", () => {
        render(createElement(HelpPage));
        expect(screen.getByText("Help").getAttribute("data-id")).toBe("help-heading");
    });

    test("says how to move between Graft's pages", () => {
        render(createElement(HelpPage));
        expect(screen.getByText(/The left sidebar and the breadcrumb trail/).getAttribute("data-id")).toBe("help-description");
    });

    test("shows only the heading and the description", () => {
        const { container } = render(createElement(HelpPage));
        const page = container.querySelector("[data-id=\"help-page\"]");
        expect(page?.children.length).toBe(2);
    });
});
