//
// A fake of what AppTheme needs of window.ziggy, which a test puts on window.ziggy: Graft's config
// file holds the theme setting the test gives, and the system's theme is the one the test sets. A test can make each call fail, and
// changes a config value from outside Graft with changeConfig, which tells every listener the way
// Ziggy's core does.
//

import type { IConfigChangedEvent, IJsonValue, IZiggyBridge } from "ziggy";
import { installFakeZiggy } from "./fake-ziggy";

//
// How the fake starts: what the config file holds, the system's theme and the calls that fail.
//
export interface IFakeThemeZiggyOptions {
    // The theme setting the config file holds, or undefined when it holds none.
    savedSetting?: IJsonValue;

    // The system's theme.
    systemTheme: "light" | "dark";

    // When given, getConfig fails with it.
    getConfigError?: Error;

    // When given, getSystemTheme fails with it.
    getSystemThemeError?: Error;

    // When given, setConfig fails with it.
    setConfigError?: Error;
}

//
// The calls of window.ziggy AppTheme makes, which a test controls.
//
export interface IFakeThemeZiggy extends Pick<IZiggyBridge, "getConfig" | "setConfig" | "getSystemTheme" | "onConfigChanged" | "removeConfigChangedListener"> {
    // Every value setConfig was asked to write, as [key path, value], in order.
    writes: [string, IJsonValue | undefined][];

    // Changes the system's theme the fake answers with.
    setSystemTheme(systemTheme: "light" | "dark"): void;

    // Writes a config value from outside Graft and tells every config listener.
    changeConfig(path: string, value: IJsonValue): void;

    // How many config listeners are listening.
    configListenerCount(): number;
}

//
// Makes a fake that starts as the options say, without putting it on window.ziggy.
//
export function makeFakeThemeZiggy(options: IFakeThemeZiggyOptions): IFakeThemeZiggy {
    const listeners = new Set<(event: IConfigChangedEvent) => void>();
    let systemTheme = options.systemTheme;
    const fake: IFakeThemeZiggy = {
        writes: [],
        getConfig<TValue extends IJsonValue>(path: string): Promise<TValue | undefined> {
            expect(path).toBe("theme");
            if (options.getConfigError !== undefined) {
                return Promise.reject(options.getConfigError);
            }
            return Promise.resolve(options.savedSetting as TValue | undefined);
        },
        setConfig(path: string, value: IJsonValue | undefined): Promise<void> {
            fake.writes.push([path, value]);
            if (options.setConfigError !== undefined) {
                return Promise.reject(options.setConfigError);
            }
            return Promise.resolve();
        },
        getSystemTheme(): Promise<"light" | "dark"> {
            if (options.getSystemThemeError !== undefined) {
                return Promise.reject(options.getSystemThemeError);
            }
            return Promise.resolve(systemTheme);
        },
        onConfigChanged(callback: (event: IConfigChangedEvent) => void): void {
            listeners.add(callback);
        },
        removeConfigChangedListener(callback: (event: IConfigChangedEvent) => void): void {
            listeners.delete(callback);
        },
        setSystemTheme(newSystemTheme: "light" | "dark"): void {
            systemTheme = newSystemTheme;
        },
        changeConfig(path: string, value: IJsonValue): void {
            for (const listener of listeners) {
                listener({ path, value });
            }
        },
        configListenerCount(): number {
            return listeners.size;
        },
    };
    return fake;
}

//
// Makes a fake that starts as the options say, puts it on window.ziggy and returns it.
//
export function installFakeThemeZiggy(options: IFakeThemeZiggyOptions): IFakeThemeZiggy {
    return installFakeZiggy(makeFakeThemeZiggy(options));
}
