//
// Tests the top bar: renders it with each state of the two sidebars and each theme setting and
// checks it shows Graft's name, that each button's label says what a click does next, that a click
// asks for the change, that the theme menu's choice is passed on, that it shows the breadcrumb
// trail it is given between the buttons, that it shows the Ctrl+/ reminder and that its keyboard
// shortcuts button runs the Keyboard Shortcuts action and names Ctrl+/ in its tooltip.
//

import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ITopBarProps, reportShortcutsButtonFailure, TopBar } from "../../components/top-bar";
import { ITrailStep } from "../../lib/breadcrumb-trail";
import { ThemeSetting } from "../../lib/theme";
import { installFakeZiggy } from "../fake-ziggy";

//
// A trail of two plain steps, as the repo explorer page has.
//
const trail: ITrailStep[] = [
    {
        label: "graft",
        tooltip: "/repos/graft",
        dataId: "breadcrumb-repo",
        options: [],
    },
    {
        label: "Repo explorer",
        tooltip: "Repo explorer",
        dataId: "breadcrumb-page",
        options: [],
    },
];

//
// Renders the top bar with the sidebar states and theme setting given and Jest mocks for its
// callbacks.
//
function renderTopBar(isLeftSidebarMinimised: boolean, isRightSidebarOpen: boolean, themeSetting: ThemeSetting = "system"): ITopBarProps {
    const props: ITopBarProps = {
        isLeftSidebarMinimised,
        onToggleLeftSidebar: jest.fn(),
        isRightSidebarOpen,
        onToggleRightSidebar: jest.fn(),
        trail,
        onNavigate: jest.fn(),
        themeSetting,
        onChooseThemeSetting: jest.fn(),
    };
    render(createElement(TopBar, props));
    return props;
}

describe("TopBar", () => {
    test("shows Graft's name", () => {
        renderTopBar(false, false);
        expect(screen.getByText("Graft").getAttribute("data-id")).toBe("top-bar-name");
    });

    test("offers to minimise the left sidebar while it is expanded", () => {
        renderTopBar(false, false);
        const button = screen.getByLabelText("Minimise the left sidebar");
        expect(button.getAttribute("data-id")).toBe("left-sidebar-toggle");
        expect(button.getAttribute("aria-label")).toBe("Minimise the left sidebar");
    });

    test("offers to expand the left sidebar while it is minimised", () => {
        renderTopBar(true, false);
        expect(screen.getByLabelText("Expand the left sidebar").getAttribute("data-id")).toBe("left-sidebar-toggle");
    });

    test("offers to open the right sidebar while it is closed", () => {
        renderTopBar(false, false);
        const button = screen.getByLabelText("Open the right sidebar");
        expect(button.getAttribute("data-id")).toBe("right-sidebar-toggle");
        expect(button.getAttribute("aria-label")).toBe("Open the right sidebar");
    });

    test("offers to close the right sidebar while it is open", () => {
        renderTopBar(false, true);
        expect(screen.getByLabelText("Close the right sidebar").getAttribute("data-id")).toBe("right-sidebar-toggle");
    });

    test("a click on the left sidebar's button asks to toggle the left sidebar only", () => {
        const props = renderTopBar(false, false);
        fireEvent.click(screen.getByLabelText("Minimise the left sidebar"));
        expect(props.onToggleLeftSidebar).toHaveBeenCalledTimes(1);
        expect(props.onToggleRightSidebar).not.toHaveBeenCalled();
    });

    test("a click on the right sidebar's button asks to toggle the right sidebar only", () => {
        const props = renderTopBar(false, false);
        fireEvent.click(screen.getByLabelText("Open the right sidebar"));
        expect(props.onToggleRightSidebar).toHaveBeenCalledTimes(1);
        expect(props.onToggleLeftSidebar).not.toHaveBeenCalled();
    });

    test("shows the theme menu's button with the theme in use", () => {
        const { container } = render(createElement(TopBar, {
            isLeftSidebarMinimised: false,
            onToggleLeftSidebar: jest.fn(),
            isRightSidebarOpen: false,
            onToggleRightSidebar: jest.fn(),
            trail,
            onNavigate: jest.fn(),
            themeSetting: "dark",
            onChooseThemeSetting: jest.fn(),
        }));
        expect(screen.getByLabelText("Theme: Dark. Choose a theme").getAttribute("data-id")).toBe("theme-button");
        expect(container.querySelector("[data-id=\"theme-icon-dark\"]")).not.toBeNull();
    });

    test("passes the theme chosen from the menu on, and toggles neither sidebar", () => {
        const props = renderTopBar(false, false, "light");
        fireEvent.click(screen.getByLabelText("Theme: Light. Choose a theme"));
        fireEvent.click(screen.getByText("Dark"));
        expect(props.onChooseThemeSetting).toHaveBeenCalledWith("dark");
        expect(props.onToggleLeftSidebar).not.toHaveBeenCalled();
        expect(props.onToggleRightSidebar).not.toHaveBeenCalled();
    });

    test("shows the reminder of the key that shows the keyboard shortcuts", () => {
        const { container } = render(createElement(TopBar, {
            isLeftSidebarMinimised: true,
            onToggleLeftSidebar: jest.fn(),
            isRightSidebarOpen: true,
            onToggleRightSidebar: jest.fn(),
            trail: [],
            onNavigate: jest.fn(),
            themeSetting: "dark",
            onChooseThemeSetting: jest.fn(),
        }));
        expect(container.querySelector("[data-id=\"top-bar-shortcuts-reminder\"]")?.textContent).toBe("Ctrl+/: Show hotkeys");
    });

    test("puts the reminder between the breadcrumb trail and the keyboard shortcuts button", () => {
        renderTopBar(false, false);
        const reminder = screen.getByText("Ctrl+/: Show hotkeys");
        expect(reminder.getAttribute("data-id")).toBe("top-bar-shortcuts-reminder");
        expect(reminder.previousElementSibling?.getAttribute("data-id")).toBe("top-bar-trail");
        expect(reminder.nextElementSibling?.getAttribute("data-id")).toBe("shortcuts-button");
    });

    test("puts the keyboard shortcuts button between the reminder and the theme menu's button", () => {
        renderTopBar(false, false);
        const button = screen.getByLabelText("Show keyboard shortcuts");
        expect(button.getAttribute("data-id")).toBe("shortcuts-button");
        expect(button.querySelector("svg[data-icon=\"keyboard\"]")).not.toBeNull();
        expect(button.previousElementSibling?.getAttribute("data-id")).toBe("top-bar-shortcuts-reminder");
        expect(button.nextElementSibling?.getAttribute("data-id")).toBe("theme-button");
    });

    test("puts the theme menu's button between the keyboard shortcuts button and the right sidebar's button", () => {
        renderTopBar(false, false);
        const themeButton = screen.getByLabelText("Theme: System. Choose a theme");
        expect(themeButton.previousElementSibling?.getAttribute("data-id")).toBe("shortcuts-button");
        expect(themeButton.nextElementSibling?.getAttribute("data-id")).toBe("right-sidebar-toggle");
    });

    test("a click on the keyboard shortcuts button runs the Keyboard Shortcuts action and toggles neither sidebar", async () => {
        const ziggy = installFakeZiggy({
            runAction: jest.fn().mockResolvedValue(undefined),
        });
        const props = renderTopBar(false, false);
        await act(async () => {
            fireEvent.click(screen.getByLabelText("Show keyboard shortcuts"));
        });
        expect(ziggy.runAction).toHaveBeenCalledTimes(1);
        expect(ziggy.runAction).toHaveBeenCalledWith("toggle-shortcuts-overlay");
        expect(props.onToggleLeftSidebar).not.toHaveBeenCalled();
        expect(props.onToggleRightSidebar).not.toHaveBeenCalled();
    });

    test("logs a Keyboard Shortcuts action the button could not run", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        installFakeZiggy({
            runAction: jest.fn().mockRejectedValue(new Error("the action is unknown")),
        });
        renderTopBar(false, false);
        fireEvent.click(screen.getByLabelText("Show keyboard shortcuts"));
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith("Graft could not run the toggle-shortcuts-overlay action from the top bar's keyboard shortcuts button: Error: the action is unknown. The keyboard shortcuts overlay did not open, so look at Ziggy's log for why the action failed. Ctrl+/ and ? still open it.");
        });
        consoleError.mockRestore();
    });

    test("the keyboard shortcuts button's tooltip says what it does and names Ctrl+/", async () => {
        renderTopBar(false, false);
        fireEvent.mouseOver(screen.getByLabelText("Show keyboard shortcuts"));
        const tooltip = await screen.findByRole("tooltip");
        const content = tooltip.querySelector("[data-id=\"shortcuts-button-tooltip\"]");
        expect(content?.textContent).toBe("Show keyboard shortcutsCtrl+/");
        expect(content?.lastElementChild?.textContent).toBe("Ctrl+/");
    });

    test("shows the breadcrumb trail between Graft's name and the reminder", () => {
        renderTopBar(false, false);
        const trailArea = screen.getByText("Repo explorer").closest("[data-id=\"top-bar-trail\"]");
        expect(trailArea).not.toBeNull();
        expect(trailArea?.textContent).toBe("graftRepo explorer");
        expect(trailArea?.previousElementSibling?.getAttribute("data-id")).toBe("top-bar-name");
        expect(trailArea?.nextElementSibling?.getAttribute("data-id")).toBe("top-bar-shortcuts-reminder");
    });

    test("holds only Graft's name, the breadcrumb trail, the reminder, the keyboard shortcuts button, the theme menu's button and the two sidebar buttons", () => {
        const { container } = render(createElement(TopBar, {
            isLeftSidebarMinimised: false,
            onToggleLeftSidebar: jest.fn(),
            isRightSidebarOpen: false,
            onToggleRightSidebar: jest.fn(),
            trail,
            onNavigate: jest.fn(),
            themeSetting: "system",
            onChooseThemeSetting: jest.fn(),
        }));
        const topBar = container.querySelector("[data-id=\"top-bar\"]");
        expect(topBar?.querySelectorAll("button").length).toBe(4);
        expect(topBar?.querySelectorAll("a").length).toBe(0);
        expect(topBar?.textContent).toBe("GraftgraftRepo explorerCtrl+/: Show hotkeys");
    });
});

describe("reportShortcutsButtonFailure", () => {
    test("logs the error with what to look at", () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        reportShortcutsButtonFailure("the bridge closed");
        expect(consoleError).toHaveBeenCalledWith("Graft could not run the toggle-shortcuts-overlay action from the top bar's keyboard shortcuts button: the bridge closed. The keyboard shortcuts overlay did not open, so look at Ziggy's log for why the action failed. Ctrl+/ and ? still open it.");
        consoleError.mockRestore();
    });
});
