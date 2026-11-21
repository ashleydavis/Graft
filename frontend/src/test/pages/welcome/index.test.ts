//
// Tests the welcome page: renders it and checks it shows Graft's mark, name, what Graft is and an
// Open repo button that runs the open-repo action, the one the File menu's "Open repo" item runs.
// A run that fails is logged. Each test puts a fake made of Jest mocks on window.ziggy, where the
// page runs the action.
//

import { act, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { reportOpenRepoFailure, WelcomePage } from "../../../pages/welcome";
import { installFakeZiggy } from "../../fake-ziggy";

describe("WelcomePage", () => {
    test("shows Graft's name as its heading", () => {
        render(createElement(WelcomePage));
        expect(screen.getByText("Graft").getAttribute("data-id")).toBe("welcome-heading");
    });

    test("shows Graft's mark, the branch icon the About page shows", () => {
        const { container } = render(createElement(WelcomePage));
        const icon = container.querySelector("[data-id=\"welcome-icon\"]");
        expect(icon).not.toBeNull();
        expect(icon?.querySelector("svg[data-icon=\"code-branch\"]")).not.toBeNull();
    });

    test("shows a line describing Graft and inviting the user to open a repo to work with it", () => {
        render(createElement(WelcomePage));
        const description = screen.getByText("A desktop Git client. Open a local Git repo to start working with it.");
        expect(description.getAttribute("data-id")).toBe("welcome-description");
    });

    test("shows the mark, then the heading, then the description, then the button", () => {
        const { container } = render(createElement(WelcomePage));
        const order = Array.from(container.querySelectorAll("[data-id^=\"welcome-\"]")).map(element => element.getAttribute("data-id"));
        expect(order).toEqual([
            "welcome-page",
            "welcome-icon",
            "welcome-heading",
            "welcome-description",
            "welcome-open-repo-button",
        ]);
    });

    test("shows an Open repo button with the folder icon", () => {
        render(createElement(WelcomePage));
        const button = screen.getByRole("button", {
            name: "Open repo",
        });
        expect(button.getAttribute("data-id")).toBe("welcome-open-repo-button");
        expect(button.querySelector("svg[data-icon=\"folder-open\"]")).not.toBeNull();
    });

    test("the Open repo button runs the open-repo action, as the File menu's Open repo item does", async () => {
        const ziggy = installFakeZiggy({
            runAction: jest.fn().mockResolvedValue(undefined),
        });
        render(createElement(WelcomePage));
        await act(async () => {
            screen.getByRole("button", {
                name: "Open repo",
            }).click();
        });
        expect(ziggy.runAction).toHaveBeenCalledTimes(1);
        expect(ziggy.runAction).toHaveBeenCalledWith("open-repo");
    });

    test("logs an open-repo action the button could not run", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        installFakeZiggy({
            runAction: jest.fn().mockRejectedValue(new Error("the action is unknown")),
        });
        render(createElement(WelcomePage));
        act(() => {
            screen.getByRole("button", {
                name: "Open repo",
            }).click();
        });
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith("Graft could not run the open-repo action from the welcome page's Open repo button: Error: the action is unknown. No repo was opened, so look at the backend's log for why the action failed.");
        });
        consoleError.mockRestore();
    });
});

describe("reportOpenRepoFailure", () => {
    test("logs the error with what to look at", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        reportOpenRepoFailure("the picker closed");
        expect(consoleError).toHaveBeenCalledTimes(1);
        expect(consoleError).toHaveBeenCalledWith("Graft could not run the open-repo action from the welcome page's Open repo button: the picker closed. No repo was opened, so look at the backend's log for why the action failed.");
        consoleError.mockRestore();
    });
});
