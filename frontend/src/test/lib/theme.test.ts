//
// Tests the theme setting: how it is read from the config file, the choices the theme menu offers,
// the colours each setting draws in and what the theme menu's button says.
//

import { defaultThemeSetting, parseThemeSetting, themeButtonLabel, themeConfigKey, themeMode, themeOptions } from "../../lib/theme";

describe("theme", () => {
    test("starts by following the system", () => {
        expect(defaultThemeSetting).toBe("system");
    });

    test("is kept in the config file under theme, Ziggy's own key for it", () => {
        expect(themeConfigKey).toBe("theme");
    });

    test("reads light, dark and system from the config file, and anything else as system", () => {
        expect(parseThemeSetting("light")).toBe("light");
        expect(parseThemeSetting("dark")).toBe("dark");
        expect(parseThemeSetting("system")).toBe("system");
        expect(parseThemeSetting(undefined)).toBe("system");
        expect(parseThemeSetting(null)).toBe("system");
        expect(parseThemeSetting("Dark")).toBe("system");
        expect(parseThemeSetting(1)).toBe("system");
    });

    test("the menu offers light, dark and system, in that order, each saying what it does", () => {
        expect(themeOptions).toEqual([
            {
                setting: "light",
                name: "Light",
                description: "Light colours all the time",
            },
            {
                setting: "dark",
                name: "Dark",
                description: "Dark colours all the time",
            },
            {
                setting: "system",
                name: "System",
                description: "Follows your system's theme",
            },
        ]);
    });

    test("light and dark draw in their own colours whatever the system's theme is", () => {
        expect(themeMode("light", false)).toBe("light");
        expect(themeMode("light", true)).toBe("light");
        expect(themeMode("dark", false)).toBe("dark");
        expect(themeMode("dark", true)).toBe("dark");
    });

    test("system draws in the system's colours", () => {
        expect(themeMode("system", false)).toBe("light");
        expect(themeMode("system", true)).toBe("dark");
    });

    test("the button says the theme in use and that a click opens the menu", () => {
        expect(themeButtonLabel("light")).toBe("Theme: Light. Choose a theme");
        expect(themeButtonLabel("dark")).toBe("Theme: Dark. Choose a theme");
        expect(themeButtonLabel("system")).toBe("Theme: System. Choose a theme");
    });
});
