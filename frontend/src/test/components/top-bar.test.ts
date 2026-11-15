//
// Tests the top bar: renders it with each state of the two sidebars and each theme setting and
// checks it shows Graft's name, that each button's label says what a click does next, that a click
// asks for the change, that the theme menu's choice is passed on and that it shows the breadcrumb
// trail it is given between the buttons.
//

import { fireEvent, render, screen } from "@testing-library/react";
import { createElement } from "react";
import { ITopBarProps, TopBar } from "../../components/top-bar";
import { ITrailStep } from "../../lib/breadcrumb-trail";
import { ThemeSetting } from "../../lib/theme";

//
// A trail of two plain steps, as the commits page has.
//
const trail: ITrailStep[] = [
    {
        label: "graft",
        tooltip: "/repos/graft",
        dataId: "breadcrumb-repo",
        options: [],
    },
    {
        label: "Commits",
        tooltip: "Commits",
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
        expect(button.getAttribute("title")).toBe("Minimise the left sidebar");
    });

    test("offers to expand the left sidebar while it is minimised", () => {
        renderTopBar(true, false);
        expect(screen.getByLabelText("Expand the left sidebar").getAttribute("data-id")).toBe("left-sidebar-toggle");
    });

    test("offers to open the right sidebar while it is closed", () => {
        renderTopBar(false, false);
        const button = screen.getByLabelText("Open the right sidebar");
        expect(button.getAttribute("data-id")).toBe("right-sidebar-toggle");
        expect(button.getAttribute("title")).toBe("Open the right sidebar");
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

    test("puts the theme menu's button between the breadcrumb trail and the right sidebar's button", () => {
        renderTopBar(false, false);
        const themeButton = screen.getByLabelText("Theme: System. Choose a theme");
        expect(themeButton.previousElementSibling?.getAttribute("data-id")).toBe("top-bar-trail");
        expect(themeButton.nextElementSibling?.getAttribute("data-id")).toBe("right-sidebar-toggle");
    });

    test("shows the breadcrumb trail between Graft's name and the theme menu's button", () => {
        renderTopBar(false, false);
        const trailArea = screen.getByText("Commits").closest("[data-id=\"top-bar-trail\"]");
        expect(trailArea).not.toBeNull();
        expect(trailArea?.textContent).toBe("graftCommits");
        expect(trailArea?.previousElementSibling?.getAttribute("data-id")).toBe("top-bar-name");
        expect(trailArea?.nextElementSibling?.getAttribute("data-id")).toBe("theme-button");
    });

    test("holds only Graft's name, the breadcrumb trail, the theme menu's button and the two sidebar buttons", () => {
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
        expect(topBar?.querySelectorAll("button").length).toBe(3);
        expect(topBar?.querySelectorAll("a").length).toBe(0);
        expect(topBar?.textContent).toBe("GraftgraftCommits");
    });
});
