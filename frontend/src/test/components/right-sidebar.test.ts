//
// Tests the right sidebar: renders it open and closed and checks its width, which is what slides
// it in and out, and that its content area, with what it is given to show, is drawn only while it
// is open.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { RightSidebar } from "../../components/right-sidebar";

describe("RightSidebar", () => {
    test("is slid out to no width and draws no content while closed", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: false,
            children: createElement("p", {
                "data-id": "sidebar-child",
            }, "The child"),
        }));
        const sidebar = container.querySelector("[data-id=\"right-sidebar\"]");
        expect(sidebar?.classList.contains("w-0")).toBe(true);
        expect(sidebar?.classList.contains("w-[320px]")).toBe(false);
        expect(sidebar?.classList.contains("border-l")).toBe(false);
        expect(container.querySelector("[data-id=\"right-sidebar-content\"]")).toBeNull();
        expect(container.querySelector("[data-id=\"sidebar-child\"]")).toBeNull();
    });

    test("is slid in to its full width with its content while open", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: true,
            children: createElement("p", {
                "data-id": "sidebar-child",
            }, "The child"),
        }));
        const sidebar = container.querySelector("[data-id=\"right-sidebar\"]");
        expect(sidebar?.classList.contains("w-[320px]")).toBe(true);
        expect(sidebar?.classList.contains("w-0")).toBe(false);
        expect(sidebar?.classList.contains("border-l")).toBe(true);
        expect(sidebar?.querySelector("[data-id=\"right-sidebar-content\"] [data-id=\"sidebar-child\"]")?.textContent).toBe("The child");
    });

    test("animates its width, so it slides rather than jumps", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: false,
            children: createElement("p", {
                "data-id": "sidebar-child",
            }, "The child"),
        }));
        expect(container.querySelector("[data-id=\"right-sidebar\"]")?.classList.contains("transition-[width]")).toBe(true);
    });
});
