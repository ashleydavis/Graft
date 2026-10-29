//
// Tests the right sidebar: renders it open and closed and checks its width, which is what slides
// it in and out, and that its content area is drawn only while it is open.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { RightSidebar } from "../../components/right-sidebar";

describe("RightSidebar", () => {
    test("is slid out to no width and draws no content while closed", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: false,
        }));
        const sidebar = container.querySelector("[data-id=\"right-sidebar\"]");
        expect(sidebar?.classList.contains("w-0")).toBe(true);
        expect(sidebar?.classList.contains("w-[340px]")).toBe(false);
        expect(sidebar?.classList.contains("border-l")).toBe(false);
        expect(container.querySelector("[data-id=\"right-sidebar-content\"]")).toBeNull();
    });

    test("is slid in to its full width with its content while open", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: true,
        }));
        const sidebar = container.querySelector("[data-id=\"right-sidebar\"]");
        expect(sidebar?.classList.contains("w-[340px]")).toBe(true);
        expect(sidebar?.classList.contains("w-0")).toBe(false);
        expect(sidebar?.classList.contains("border-l")).toBe(true);
        expect(sidebar?.querySelector("[data-id=\"right-sidebar-content\"]")).not.toBeNull();
    });

    test("animates its width, so it slides rather than jumps", () => {
        const { container } = render(createElement(RightSidebar, {
            isOpen: false,
        }));
        expect(container.querySelector("[data-id=\"right-sidebar\"]")?.classList.contains("transition-[width]")).toBe(true);
    });
});
