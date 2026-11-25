//
// Tests the pane header, the close button and the maximise button: renders the header with a title
// and an action and checks that it shows the title under its data-id, then the collapse button,
// which reports a click, then the action, and that the close button has its data-id and name and
// reports a click, and that the maximise button shows arrows pointing out or in, is named for what
// a click does, names the M key in its tooltip and reports a click.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { CloseButton, MaximiseButton, PaneHeader } from "../../../../pages/repo-explorer/components/pane-header";

describe("PaneHeader", () => {
    test("shows the title under its data-id", () => {
        render(createElement(PaneHeader, {
            title: "Commits",
            titleDataId: "commit-pane-heading",
            collapseDataId: "commit-pane-collapse",
            onCollapse: jest.fn(),
            action: undefined,
        }));
        expect(screen.getByText("Commits").getAttribute("data-id")).toBe("commit-pane-heading");
    });

    test("shows the collapse button after the title and its action after the collapse button", () => {
        const { container } = render(createElement(PaneHeader, {
            title: "Commit",
            titleDataId: "commit-details-heading",
            collapseDataId: "commit-details-pane-collapse",
            onCollapse: jest.fn(),
            action: createElement("button", {
                "data-id": "an-action",
            }),
        }));
        expect(container.querySelector("[data-id=\"commit-details-heading\"] + [data-id=\"commit-details-pane-collapse\"] + [data-id=\"an-action\"]")).not.toBeNull();
    });

    test("reports a click on its collapse button", () => {
        const onCollapse = jest.fn();
        render(createElement(PaneHeader, {
            title: "Commits",
            titleDataId: "commit-pane-heading",
            collapseDataId: "commit-pane-collapse",
            onCollapse,
            action: undefined,
        }));
        fireEvent.click(screen.getByLabelText("Collapse the pane"));
        expect(onCollapse).toHaveBeenCalledTimes(1);
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

describe("MaximiseButton", () => {
    test("shows arrows pointing out, is named Maximise the pane and reports a click while the pane is at its usual size", () => {
        const onToggleMaximise = jest.fn();
        render(createElement(MaximiseButton, {
            isMaximised: false,
            dataId: "commit-pane-maximise",
            onToggleMaximise,
        }));
        const button = screen.getByLabelText("Maximise the pane");
        expect(button.getAttribute("data-id")).toBe("commit-pane-maximise");
        expect(button.getAttribute("aria-pressed")).toBe("false");
        expect(button.querySelector("svg")?.getAttribute("data-icon")).toBe("up-right-and-down-left-from-center");
        fireEvent.click(button);
        expect(onToggleMaximise).toHaveBeenCalledTimes(1);
    });

    test("shows arrows pointing in and is named Restore the pane while the pane is maximised", () => {
        render(createElement(MaximiseButton, {
            isMaximised: true,
            dataId: "commit-pane-maximise",
            onToggleMaximise: jest.fn(),
        }));
        const button = screen.getByLabelText("Restore the pane");
        expect(button.getAttribute("aria-pressed")).toBe("true");
        expect(button.querySelector("svg")?.getAttribute("data-icon")).toBe("down-left-and-up-right-to-center");
    });

    test("names what a click does and the M key in its tooltip", async () => {
        render(createElement(MaximiseButton, {
            isMaximised: false,
            dataId: "commit-pane-maximise",
            onToggleMaximise: jest.fn(),
        }));
        fireEvent.mouseOver(screen.getByLabelText("Maximise the pane"));
        const tooltip = await screen.findByRole("tooltip");
        expect(tooltip.textContent).toBe("Maximise the paneKey: M");
    });
});
