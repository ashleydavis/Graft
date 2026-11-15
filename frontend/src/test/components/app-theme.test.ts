//
// Tests the app's theme: renders a component inside it that shows the setting and moves it on, and
// checks the setting is read from and saved to Graft's config file, and that the page's root
// element and MaterialUI's palette follow the setting and the system's theme, including a change to
// either while Graft runs.
//

import { useTheme } from "@mui/material/styles";
import { act, render, waitFor } from "@testing-library/react";
import { createElement, JSX } from "react";
import { AppTheme, darkBackground, systemDarkQuery, useThemeSetting } from "../../components/app-theme";
import { IFakeMediaQuery, makeFakeMediaQuery } from "../fake-media-query";
import { installFakeThemeZiggy } from "../fake-theme-ziggy";

//
// Shows the theme setting, MaterialUI's palette mode and background, and a button for each setting
// that chooses it.
//
function ThemeReader(): JSX.Element {
    const theme = useThemeSetting();
    const muiTheme = useTheme();
    return createElement("div", null,
        createElement("span", {
            "data-id": "reader",
            "data-mui-mode": muiTheme.palette.mode,
            "data-mui-background": muiTheme.palette.background.default,
        }, theme.setting),
        ...(["light", "dark", "system"] as const).map(setting => createElement("button", {
            key: setting,
            "data-id": `choose-${setting}`,
            onClick: () => theme.onChooseSetting(setting),
        }, setting)),
    );
}

//
// Clicks the reader's button that chooses the setting.
//
async function choose(setting: string): Promise<void> {
    await act(async () => document.querySelector<HTMLElement>(`[data-id="choose-${setting}"]`)?.click());
}

//
// Renders the reader inside the theme with the page's colour scheme given, and returns the reader.
// The test has put its fake on window.ziggy.
//
function renderTheme(systemDark: IFakeMediaQuery): { reader: () => HTMLElement; unmount: () => void } {
    const { container, unmount } = render(createElement(AppTheme, {
        systemDark,
        children: createElement(ThemeReader),
    }));
    return {
        reader: () => container.querySelector<HTMLElement>("[data-id=\"reader\"]") as HTMLElement,
        unmount,
    };
}

//
// Renders the reader and waits until the theme has window.ziggy's answers.
//
async function renderSettledTheme(systemDark: IFakeMediaQuery): Promise<{ reader: () => HTMLElement; unmount: () => void }> {
    const rendered = renderTheme(systemDark);
    await act(async () => {
    });
    return rendered;
}

//
// Whether the page's root element is marked dark, with the browser told to draw dark.
//
function isPageDark(): boolean {
    const root = document.documentElement;
    expect(root.style.colorScheme).toBe(root.classList.contains("dark") ? "dark" : "light");
    return root.classList.contains("dark");
}

//
// Replaces console.error for the test and returns the mock, which the test restores.
//
function muteConsoleError(): jest.SpyInstance {
    return jest.spyOn(console, "error").mockImplementation(() => {
    });
}

describe("AppTheme", () => {
    test("draws in the page's colour scheme while the config file and system's theme are read", () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "light",
            systemTheme: "light",
        });
        const { reader, unmount } = renderTheme(makeFakeMediaQuery(systemDarkQuery, true));
        expect(reader().textContent).toBe("system");
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
        unmount();
    });

    test("starts on the setting the config file holds", async () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "dark",
            systemTheme: "light",
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        expect(reader().textContent).toBe("dark");
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
    });

    test("starts on system when the config file holds no setting or one Graft does not know", async () => {
        for (const savedSetting of [undefined, "purple", 3]) {
            const ziggy = installFakeThemeZiggy({
                savedSetting,
                systemTheme: "light",
            });
            const { reader, unmount } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
            expect(reader().textContent).toBe("system");
            expect(reader().getAttribute("data-mui-mode")).toBe("light");
            expect(isPageDark()).toBe(false);
            unmount();
        }
    });

    test("on system, draws in the system's theme window.ziggy reports", async () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "system",
            systemTheme: "dark",
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
    });

    test("draws dark in the dark grey of Graft's art and light in MaterialUI's own background", async () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "dark",
            systemTheme: "light",
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        expect(reader().getAttribute("data-mui-background")).toBe(darkBackground);
        await choose("light");
        expect(reader().textContent).toBe("light");
        expect(reader().getAttribute("data-mui-background")).toBe("#fff");
    });

    test("asks window.ziggy for the system's theme again when the page's colour scheme changes", async () => {
        const ziggy = installFakeThemeZiggy({
            systemTheme: "light",
        });
        const systemDark = makeFakeMediaQuery(systemDarkQuery, false);
        const { reader } = await renderSettledTheme(systemDark);
        ziggy.setSystemTheme("dark");
        await act(async () => systemDark.setMatches(true));
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
        ziggy.setSystemTheme("light");
        await act(async () => systemDark.setMatches(false));
        expect(reader().getAttribute("data-mui-mode")).toBe("light");
        expect(isPageDark()).toBe(false);
    });

    test("changes to the setting chosen, saving each in the config file, and light and dark ignore the system", async () => {
        const ziggy = installFakeThemeZiggy({
            systemTheme: "dark",
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, true));
        await choose("light");
        expect(reader().textContent).toBe("light");
        expect(reader().getAttribute("data-mui-mode")).toBe("light");
        expect(isPageDark()).toBe(false);
        await choose("dark");
        expect(reader().textContent).toBe("dark");
        ziggy.setSystemTheme("light");
        await act(async () => ziggy.changeConfig("unrelated", "value"));
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
        await choose("system");
        expect(reader().textContent).toBe("system");
        expect(isPageDark()).toBe(true);
        expect(ziggy.writes).toEqual([["theme", "light"], ["theme", "dark"], ["theme", "system"]]);
    });

    test("follows a theme setting written to the config file while Graft runs, and reads the system's theme again", async () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "light",
            systemTheme: "light",
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        ziggy.setSystemTheme("dark");
        await act(async () => ziggy.changeConfig("theme", "system"));
        expect(reader().textContent).toBe("system");
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(isPageDark()).toBe(true);
        expect(ziggy.writes).toEqual([]);
    });

    test("stops listening, and ignores late answers, once it is removed", async () => {
        const ziggy = installFakeThemeZiggy({
            savedSetting: "dark",
            systemTheme: "dark",
        });
        const systemDark = makeFakeMediaQuery(systemDarkQuery, false);
        const { unmount } = renderTheme(systemDark);
        expect(systemDark.listenerCount()).toBe(1);
        expect(ziggy.configListenerCount()).toBe(1);
        unmount();
        expect(systemDark.listenerCount()).toBe(0);
        expect(ziggy.configListenerCount()).toBe(0);
        const consoleError = muteConsoleError();
        await act(async () => {
        });
        expect(consoleError).not.toHaveBeenCalled();
        consoleError.mockRestore();
    });

    test("a config file Graft cannot read leaves it following the system's theme, and says why", async () => {
        const consoleError = muteConsoleError();
        const ziggy = installFakeThemeZiggy({
            systemTheme: "dark",
            getConfigError: new Error("ConfigFileInvalid"),
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        expect(reader().textContent).toBe("system");
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        await waitFor(() => expect(consoleError).toHaveBeenCalledWith(
            "Graft could not read the theme setting from its config file: Error: ConfigFileInvalid. Graft follows the system's theme until a theme is chosen from the theme menu."
        ));
        consoleError.mockRestore();
    });

    test("a system's theme Graft cannot read leaves the colours as they were, and says why", async () => {
        const consoleError = muteConsoleError();
        const ziggy = installFakeThemeZiggy({
            savedSetting: "system",
            systemTheme: "light",
            getSystemThemeError: new Error("NoSessionBus"),
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, true));
        expect(reader().getAttribute("data-mui-mode")).toBe("dark");
        expect(consoleError).toHaveBeenCalledWith(
            "Graft could not read the system's theme: Error: NoSessionBus. With the System theme setting Graft keeps the colours it has until the system's theme changes again."
        );
        consoleError.mockRestore();
    });

    test("a setting Graft cannot save still changes the theme until Graft closes, and says why", async () => {
        const consoleError = muteConsoleError();
        const ziggy = installFakeThemeZiggy({
            systemTheme: "light",
            setConfigError: new Error("ConfigFileInvalid"),
        });
        const { reader } = await renderSettledTheme(makeFakeMediaQuery(systemDarkQuery, false));
        await choose("dark");
        expect(reader().textContent).toBe("dark");
        expect(isPageDark()).toBe(true);
        expect(consoleError).toHaveBeenCalledWith(
            "Graft could not save the theme setting dark in its config file: Error: ConfigFileInvalid. Graft shows the dark theme until it closes, and the next run starts on the setting the file holds."
        );
        consoleError.mockRestore();
    });

    test("a component outside the theme that asks for the setting is told why it cannot have it", () => {
        const consoleError = muteConsoleError();
        expect(() => render(createElement(ThemeReader))).toThrow("useThemeSetting was called outside AppTheme");
        consoleError.mockRestore();
    });
});
