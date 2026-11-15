//
// Tests the welcome page: renders it and checks it shows Graft's name and an Open repo button
// that runs the open-repo action, the one the File menu's "Open repo" item runs. A run that fails
// is logged. Each test puts a fake made of Jest mocks on window.ziggy, where the page runs the
// action.
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
