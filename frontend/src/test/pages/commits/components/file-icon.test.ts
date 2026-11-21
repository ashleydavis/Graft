//
// Tests the file icon: checks which icon each kind of path gets and that the icon is drawn small
// and muted.
//

import { faBook, faFile, faFileCode, faLock } from "@fortawesome/free-solid-svg-icons";
import { render } from "@testing-library/react";
import { createElement } from "react";
import { FileIcon, fileIconFor } from "../../../../pages/commits/components/file-icon";

describe("fileIconFor", () => {
    test("picks the icon by the whole file name before the extension", () => {
        expect(fileIconFor("frontend/bun.lock")).toBe(faLock);
        expect(fileIconFor("LICENSE")).toBe(faBook);
    });

    test("picks the icon by the extension, whatever its case", () => {
        expect(fileIconFor("src/main.TSX")).toBe(faFileCode);
    });

    test("picks the plain file icon for an unknown extension, no extension or a dot file", () => {
        expect(fileIconFor("notes.unknown")).toBe(faFile);
        expect(fileIconFor("Makefile")).toBe(faFile);
        expect(fileIconFor(".hidden")).toBe(faFile);
    });
});

describe("FileIcon", () => {
    test("draws the file's icon at the small icon size in the muted colour", () => {
        const { container } = render(createElement(FileIcon, {
            path: "README.md",
        }));
        const icon = container.querySelector("svg");
        expect(icon?.getAttribute("data-icon")).toBe("book");
        expect(icon?.getAttribute("class")).toContain("text-[length:var(--icon-sm)]");
        expect(icon?.getAttribute("class")).toContain("text-[var(--color-text-muted)]");
    });
});
