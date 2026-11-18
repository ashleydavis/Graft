//
// Tests the theme menu: renders it with each theme setting and checks the button shows the theme in
// use, that a click opens the menu with its heading and a row for each setting with the one in use
// selected and that choosing a row closes the menu and reports the setting unless it is already in
// use.
//

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { createElement } from "react";
import { ThemeMenu } from "../../components/theme-menu";
import { ThemeSetting } from "../../lib/theme";

//
// Renders the theme menu with the setting and a Jest mock for its callback, and returns the mock.
//
function renderThemeMenu(setting: ThemeSetting): jest.Mock {
    const onChooseSetting = jest.fn();
    render(createElement(ThemeMenu, {
        setting,
        onChooseSetting,
    }));
    return onChooseSetting;
}

//
// The element with the data-id anywhere on the page, because the menu draws outside the button.
//
function elementWithDataId(dataId: string): HTMLElement | null {
    return document.querySelector<HTMLElement>(`[data-id="${dataId}"]`);
}

//
// Opens the menu with a click on its button.
//
function openMenu(): void {
    fireEvent.click(elementWithDataId("theme-button") as HTMLElement);
}

describe("ThemeMenu", () => {
    test.each<[ThemeSetting, string]>([
        ["light", "Theme: Light. Choose a theme"],
        ["dark", "Theme: Dark. Choose a theme"],
        ["system", "Theme: System. Choose a theme"],
    ])("the button shows the %s theme's icon only, and says a click opens the menu", (setting, label) => {
        renderThemeMenu(setting);
        const button = screen.getByLabelText(label);
        expect(button.getAttribute("data-id")).toBe("theme-button");
        expect(button.getAttribute("aria-label")).toBe(label);
        expect(button.getAttribute("aria-haspopup")).toBe("menu");
        expect(button.querySelector(`[data-id="theme-icon-${setting}"]`)).not.toBeNull();
        expect(button.querySelectorAll("[data-id^=\"theme-icon-\"]").length).toBe(1);
    });

    test("the menu is closed until the button is clicked", () => {
        renderThemeMenu("system");
        expect(elementWithDataId("theme-menu-heading")).toBeNull();
        expect(elementWithDataId("theme-button")?.getAttribute("aria-expanded")).toBe("false");
    });

    test("a click opens the menu with its heading and a row for each setting, in order, with what each does", () => {
        renderThemeMenu("system");
        openMenu();
        expect(elementWithDataId("theme-button")?.getAttribute("aria-expanded")).toBe("true");
        expect(elementWithDataId("theme-menu-heading")?.textContent).toBe("Theme");
        const rows = Array.from(document.querySelectorAll<HTMLElement>("[data-id^=\"theme-option-\"][role=\"menuitem\"]"));
        expect(rows.map(row => row.getAttribute("data-id"))).toEqual(["theme-option-light", "theme-option-dark", "theme-option-system"]);
        expect(rows.map(row => row.textContent)).toEqual([
            "LightLight colours all the time",
            "DarkDark colours all the time",
            "SystemFollows your system's theme",
        ]);
    });

    test("marks the setting in use only, with the selected colour and no tick", () => {
        renderThemeMenu("dark");
        openMenu();
        expect(document.querySelector("[data-id=\"theme-menu\"] svg[data-icon=\"check\"]")).toBeNull();
        expect(elementWithDataId("theme-option-dark")?.classList.contains("Mui-selected")).toBe(true);
        expect(elementWithDataId("theme-option-light")?.classList.contains("Mui-selected")).toBe(false);
    });

    test("choosing another setting reports it and closes the menu", async () => {
        const onChooseSetting = renderThemeMenu("system");
        openMenu();
        fireEvent.click(elementWithDataId("theme-option-light") as HTMLElement);
        expect(onChooseSetting).toHaveBeenCalledWith("light");
        expect(onChooseSetting).toHaveBeenCalledTimes(1);
        await waitFor(() => expect(elementWithDataId("theme-menu-heading")).toBeNull());
    });

    test("choosing the setting in use closes the menu without reporting it", async () => {
        const onChooseSetting = renderThemeMenu("dark");
        openMenu();
        fireEvent.click(elementWithDataId("theme-option-dark") as HTMLElement);
        expect(onChooseSetting).not.toHaveBeenCalled();
        await waitFor(() => expect(elementWithDataId("theme-menu-heading")).toBeNull());
    });

    test("pressing Escape closes the menu without reporting a setting", async () => {
        const onChooseSetting = renderThemeMenu("system");
        openMenu();
        fireEvent.keyDown(elementWithDataId("theme-option-system") as HTMLElement, {
            key: "Escape",
        });
        await waitFor(() => expect(elementWithDataId("theme-menu-heading")).toBeNull());
        expect(onChooseSetting).not.toHaveBeenCalled();
    });
});
