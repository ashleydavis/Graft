//
// Tests the pane header: renders it with a title and checks that it shows the title under its
// data-id and that its close button has its data-id and reports a click.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { PaneHeader } from "../../../../pages/commits/components/pane-header";

describe("PaneHeader", () => {
    test("shows the title under its data-id, with the whole title as its tooltip", () => {
        render(createElement(PaneHeader, {
            title: "docs/notes.txt",
            titleDataId: "file-pane-path",
            closeDataId: "file-pane-close",
            onClose: jest.fn(),
        }));
        const title = screen.getByText("docs/notes.txt");
        expect(title.getAttribute("data-id")).toBe("file-pane-path");
        expect(title.getAttribute("title")).toBe("docs/notes.txt");
    });

    test("reports a click on its close button", () => {
        const onClose = jest.fn();
        render(createElement(PaneHeader, {
            title: "Commit",
            titleDataId: "commit-details-heading",
            closeDataId: "commit-details-close",
            onClose,
        }));
        const close = screen.getByLabelText("Close");
        expect(close.getAttribute("data-id")).toBe("commit-details-close");
        fireEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
