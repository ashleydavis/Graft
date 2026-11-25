//
// Tests the tooltip content with a title and a detail: renders it and checks that it shows the
// title in bold above the detail.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { Tip } from "../../../../pages/repo-explorer/components/tip";

describe("Tip", () => {
    test("shows the title in bold above the detail", () => {
        const { container } = render(createElement(Tip, {
            title: "Stage this file",
            detail: "Adds the file's changes to the next commit.",
        }));
        const lines = container.firstElementChild?.children;
        expect(lines?.[0].textContent).toBe("Stage this file");
        expect(lines?.[0].className).toContain("font-[var(--weight-bold)]");
        expect(lines?.[1].textContent).toBe("Adds the file's changes to the next commit.");
        expect(lines?.[1].className).not.toContain("font-[var(--weight-bold)]");
    });
});
