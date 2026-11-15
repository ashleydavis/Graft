//
// Gives jsdom what main.tsx reads from the window as it loads: a window.matchMedia that returns
// a fake media query that does not match, so the app draws in light colours, and a window.ziggy
// with the calls the theme, the splash screen and the layout's open-repo action make, whose config
// file holds no theme setting and whose system's theme is light. A test imports this before
// main.tsx, because main.tsx draws the app as it loads. A test that needs more of window.ziggy
// replaces it.
//

import { makeFakeMediaQuery } from "./fake-media-query";
import { makeFakeThemeZiggy } from "./fake-theme-ziggy";

window.matchMedia = (query: string): MediaQueryList => makeFakeMediaQuery(query, false);

//
// The window.ziggy main.tsx loads with, kept so a test can check the calls main.tsx made after
// another test has replaced it.
//
export const installedZiggy = {
    ...makeFakeThemeZiggy({
        systemTheme: "light",
    }),
    onEvent: jest.fn(),
    frontendReady: jest.fn(),
    registerAction: jest.fn(),
    removeAction: jest.fn(),
};

Object.defineProperty(window, "ziggy", {
    value: installedZiggy,
    configurable: true,
});
