//
// Tests the pane header and the close button: renders the header with a title and an action and
// checks that it shows the title under its data-id and the action, and that the close button has
// its data-id and name and reports a click.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { CloseButton, PaneHeader } from "../../../../pages/repo-explorer/components/pane-header";

describe("PaneHeader", () => {
    test("shows the title under its data-id", () => {
        render(createElement(PaneHeader, {
            title: "Commits",
            titleDataId: "commit-pane-heading",
            action: undefined,
        }));
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commit-pane-heading");
    });

    test("shows its action after the title", () => {
        const { container } = render(createElement(PaneHeader, {
            title: "Commit",
            titleDataId: "commit-details-heading",
            action: createElement("button", {
                "data-id": "an-action",
            }),
        }));
        expect(container.querySelector("[data-id=\"commit-details-heading\"] + [data-id=\"an-action\"]")).not.toBeNull();
    });
});

describe("CloseButton", () => {
    test("is named after the pane it closes and reports a click", () => {
        const onClose = jest.fn();
        render(createElement(CloseButton, {
            paneLabel: "Commit details",
            dataId: "commit-details-close",
            onClose,
        }));
        const close = screen.getByLabelText("Close commit details");
        expect(close.getAttribute("data-id")).toBe("commit-details-close");
        fireEvent.click(close);
        expect(onClose).toHaveBeenCalledTimes(1);
    });
});
