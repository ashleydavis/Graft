//
// Graft's theme: reads the theme setting from Graft's config file and saves it there, follows the
// system's theme, and draws MaterialUI and Tailwind in light or dark colours to match.
//

import { createTheme, ThemeProvider } from "@mui/material/styles";
import { createContext, JSX, ReactNode, useContext, useEffect, useMemo, useState } from "react";
import type { IConfigChangedEvent } from "ziggy";
import { defaultThemeSetting, parseThemeSetting, themeConfigKey, ThemeMode, themeMode, ThemeSetting } from "../lib/theme";

//
// The media query that matches while the page is drawn dark. The native app sets the web view's
// colour scheme to the theme in use, so it changes when the setting or the system's theme does.
// main.tsx gives AppTheme the browser's answer to it.
//
export const systemDarkQuery = "(prefers-color-scheme: dark)";

//
// The page's background in the dark theme: the dark grey of Graft's dark icon and splash art, the
// same as the window's (.backgrounds in app.zig) and main.css's.
//
export const darkBackground = "#14171a";

//
// What AppTheme draws and what tells it the system's theme changed. It reads and saves the
// setting in Graft's config file, and reads the system's theme, through window.ziggy.
//
export interface IAppThemeProps {
    // The query that matches while the page is drawn dark: window.matchMedia(systemDarkQuery) in
    // the app and a fake in tests. Its first answer draws the first paint, and each change makes
    // AppTheme ask window.ziggy for the system's theme again.
    systemDark: MediaQueryList;

    // What to draw in the theme.
    children: ReactNode;
}

//
// What the theme gives the components inside it: the setting and a way to change it.
//
export interface IThemeSettingContext {
    // The theme the user picked.
    setting: ThemeSetting;

    // Changes the setting to the one the user chose, and saves it in Graft's config file.
    onChooseSetting(setting: ThemeSetting): void;
}

const ThemeSettingContext = createContext<IThemeSettingContext | undefined>(undefined);

//
// The theme setting and its next-setting callback, for a component inside AppTheme. It throws when
// there is no AppTheme around the component, because the component would otherwise show a theme
// button that does nothing.
//
export function useThemeSetting(): IThemeSettingContext {
    const context = useContext(ThemeSettingContext);
    if (context === undefined) {
        throw new Error("useThemeSetting was called outside AppTheme, so there is no theme setting to show or change. Render the component inside AppTheme.");
    }
    return context;
}

//
// The theme setting saved in Graft's config file and whether the system's theme is dark, kept up to
// date as either changes. Until window.ziggy answers, the setting is system and the system's theme is
// the colour scheme the native app gave the page, which is the theme in use, so the first paint is
// right.
//
function useSavedTheme(systemDark: MediaQueryList): [ThemeSetting, (setting: ThemeSetting) => void, boolean] {
    const [setting, setSetting] = useState<ThemeSetting>(defaultThemeSetting);
    const [isSystemDark, setSystemDark] = useState(systemDark.matches);
    useEffect(() => {
        let isMounted = true;
        const readSystemTheme = (): void => {
            window.ziggy.getSystemTheme()
                .then(systemTheme => {
                    if (isMounted) {
                        setSystemDark(systemTheme === "dark");
                    }
                })
                .catch(error => {
                    console.error(`Graft could not read the system's theme: ${String(error)}. With the System theme setting Graft keeps the colours it has until the system's theme changes again.`);
                });
        };
        const onConfigChanged = (event: IConfigChangedEvent): void => {
            if (event.path === themeConfigKey) {
                setSetting(parseThemeSetting(event.value));
                readSystemTheme();
            }
        };
        window.ziggy.getConfig(themeConfigKey)
            .then(value => {
                if (isMounted) {
                    setSetting(parseThemeSetting(value));
                }
            })
            .catch(error => {
                console.error(`Graft could not read the theme setting from its config file: ${String(error)}. Graft follows the system's theme until a theme is chosen from the theme menu.`);
            });
        readSystemTheme();
        systemDark.addEventListener("change", readSystemTheme);
        window.ziggy.onConfigChanged(onConfigChanged);
        return () => {
            isMounted = false;
            systemDark.removeEventListener("change", readSystemTheme);
            window.ziggy.removeConfigChangedListener(onConfigChanged);
        };
    }, [systemDark]);
    return [setting, setSetting, isSystemDark];
}

//
// Marks the page's root element with the mode, so Tailwind's dark: classes apply in dark mode
// (see main.css) and the browser draws its own controls and scrollbars to match.
//
function applyModeToPage(mode: ThemeMode): void {
    const root = document.documentElement;
    root.classList.toggle("dark", mode === "dark");
    root.style.colorScheme = mode;
}

//
// Draws its children in the theme the setting picks, and gives them the setting through
// useThemeSetting. The setting is kept in Graft's config file, so it lasts from one run to the next.
//
export function AppTheme({ systemDark, children }: IAppThemeProps): JSX.Element {
    const [setting, setSetting, isSystemDark] = useSavedTheme(systemDark);
    const mode = themeMode(setting, isSystemDark);

    useEffect(() => applyModeToPage(mode), [mode]);

    const muiTheme = useMemo(() => createTheme({
        palette: mode === "dark"
            ? {
                mode,
                background: {
                    default: darkBackground,
                    paper: darkBackground,
                },
            }
            : {
                mode,
            },
    }), [mode]);

    const context = useMemo<IThemeSettingContext>(() => ({
        setting,
        onChooseSetting: (chosen: ThemeSetting) => {
            setSetting(chosen);
            window.ziggy.setConfig(themeConfigKey, chosen).catch(error => {
                console.error(`Graft could not save the theme setting ${chosen} in its config file: ${String(error)}. Graft shows the ${chosen} theme until it closes, and the next run starts on the setting the file holds.`);
            });
        },
    }), [setting, setSetting]);

    return (
        <ThemeSettingContext.Provider value={context}>
            <ThemeProvider theme={muiTheme}>
                {children}
            </ThemeProvider>
        </ThemeSettingContext.Provider>
    );
}
