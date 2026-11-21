//
// Tests the file path: checks that a path in a directory shows its directory muted before its
// name, that a path at the root shows its name alone and that the path carries its data-id.
//

import { render } from "@testing-library/react";
import { createElement } from "react";
import { FilePath } from "../../../../pages/repo-explorer/components/file-path";

describe("FilePath", () => {
    test("shows the directory muted before the file name, under its data-id", () => {
        const { container } = render(createElement(FilePath, {
            path: "docs/spec/notes.txt",
            dataId: "file-pane-path",
        }));
        const path = container.firstElementChild;
        expect(path?.getAttribute("data-id")).toBe("file-pane-path");
        expect(path?.textContent).toBe("docs/spec/notes.txt");
        expect(path?.firstElementChild?.textContent).toBe("docs/spec/");
        expect(path?.firstElementChild?.className).toContain("text-[var(--color-text-muted)]");
    });

    test("shows a file at the root by its name alone", () => {
        const { container } = render(createElement(FilePath, {
            path: "README.md",
            dataId: undefined,
        }));
        const path = container.firstElementChild;
        expect(path?.getAttribute("data-id")).toBeNull();
        expect(path?.children.length).toBe(1);
        expect(path?.textContent).toBe("README.md");
    });
});
