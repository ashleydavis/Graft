//
// The theme setting: whether Graft shows light, dark or follows the system's theme, and the
// choices the top bar's theme menu offers.
//

//
// The theme the user picked: light, dark, or whatever the system's theme is.
//
export type ThemeSetting = "light" | "dark" | "system";

//
// The colours Graft is drawn in, once the system's theme is known.
//
export type ThemeMode = "light" | "dark";

//
// The setting Graft starts with: it follows the system until the user picks a theme.
//
export const defaultThemeSetting: ThemeSetting = "system";

//
// The key of the theme setting in Graft's config file, which Ziggy keeps.
//
export const themeConfigKey = "theme";

//
// The theme setting a value of the config file names. Ziggy treats a missing or unknown setting as
// system, so Graft does too.
//
export function parseThemeSetting(value: unknown): ThemeSetting {
    if (value === "light" || value === "dark" || value === "system") {
        return value;
    }
    return defaultThemeSetting;
}

//
// The colours to draw in for the setting, given whether the system's theme is dark.
//
export function themeMode(setting: ThemeSetting, isSystemDark: boolean): ThemeMode {
    if (setting === "system") {
        return isSystemDark ? "dark" : "light";
    }
    return setting;
}

//
// One choice in the theme menu: the setting, its name and what it does.
//
export interface IThemeOption {
    // The setting the choice picks.
    setting: ThemeSetting;

    // The setting's name, as the menu shows it.
    name: string;

    // What the setting does, as the menu shows it under the name.
    description: string;
}

//
// The theme menu's choices, in the order it lists them.
//
export const themeOptions: IThemeOption[] = [
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
];

//
// The theme menu's button's label and tooltip: the theme in use and that a click opens the theme menu.
//
export function themeButtonLabel(setting: ThemeSetting): string {
    const option = themeOptions.find(themeOption => themeOption.setting === setting) as IThemeOption;
    return `Theme: ${option.name}. Choose a theme`;
}
