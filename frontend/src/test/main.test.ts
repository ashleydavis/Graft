//
// Tests how the frontend starts: loading main.tsx draws the app into the test's document, where the
// router opens on the About page in the layout's main content area with no repo open. The open-repo
// action opens a repo on the commits page and the links then change between the About page and the
// commits page. The Help page is on the router, with the trail following each page and its
// drop-down opening the About page again. The smoke tests' commands are performed only in test
// mode. The splash screen covers the page until the native app reports the page is in sight.
// Each test puts a fake made of Jest mocks on window.ziggy, where the frontend reaches the backend.
//

import { act, screen, waitFor } from "@testing-library/react";
import { installedZiggy } from "./install-app-window";
import { ITestCommand } from "../lib/test-commands";
import { createAppRouter, listenForTestCommands, showSplashScreen } from "../main";
import { installFakeZiggy } from "./fake-ziggy";
import type { ITestCommandEvent, IZiggyBridge } from "ziggy";

//
// The router scrolls the window to the top when it shows a page. jsdom reports window.scrollTo as
// an error, so the tests replace it with a function that returns at once.
//
jest.spyOn(window, "scrollTo").mockImplementation(() => {
});

//
// The element with the data-id. The page links are found by data-id, because the left sidebar
// links to the same pages with the same names.
//
function elementWithDataId(dataId: string): HTMLElement | undefined {
    const element = document.querySelector<HTMLElement>(`[data-id="${dataId}"]`) ?? undefined;
    expect(element).not.toBeUndefined();
    return element;
}

//
// The calls of window.ziggy listenForTestCommands makes.
//
type TestCommandZiggy = Pick<IZiggyBridge, "onTestCommand" | "sendTestResult" | "testUiReady">;

//
// The calls of window.ziggy showSplashScreen makes.
//
type SplashZiggy = Pick<IZiggyBridge, "onEvent" | "frontendReady">;

//
// Puts a fake on window.ziggy whose sendTestResult settles the way the test asks, and returns it.
//
function installTestCommandZiggy(sendTestResult: jest.Mock): TestCommandZiggy {
    return installFakeZiggy({
        onTestCommand: jest.fn(),
        sendTestResult,
        testUiReady: jest.fn(),
    });
}

//
// Puts a fake on window.ziggy for the splash screen, and returns it.
//
function installSplashZiggy(): SplashZiggy {
    return installFakeZiggy({
        onEvent: jest.fn(),
        frontendReady: jest.fn(),
    });
}

//
// The callback listenForTestCommands registered with window.ziggy.
//
function registeredCallback(ziggy: TestCommandZiggy): (event: ITestCommandEvent<ITestCommand>) => void {
    const onTestCommand = ziggy.onTestCommand as jest.Mock;
    expect(onTestCommand).toHaveBeenCalledTimes(1);
    return onTestCommand.mock.calls[0][0];
}

describe("main", () => {
    test("the app opens on the About page, in the layout's main content area", async () => {
        const heading = await screen.findByText("About Graft");
        expect(heading.getAttribute("data-id")).toBe("about-heading");
        expect(elementWithDataId("main-content")?.contains(heading)).toBe(true);
        expect(elementWithDataId("app-layout")?.contains(elementWithDataId("main-content") ?? null)).toBe(true);
    });

    test("the app starts with no repo open: the trail starts with the page and no link reaches the commits page", async () => {
        await screen.findByText("About Graft");
        expect(document.querySelector("[data-id=\"about-commits-link\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"left-sidebar-commits-link\"]")).toBeNull();
        expect(document.querySelector("[data-id=\"breadcrumb-repo\"]")).toBeNull();
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("About");
    });

    test("the open-repo action opens the folder picked on the commits page, and the links change back to the About page and on again", async () => {
        await screen.findByText("About Graft");
        const registerAction = installedZiggy.registerAction;
        expect(registerAction).toHaveBeenCalledWith("open-repo", expect.any(Function));
        const openRepoHandler = registerAction.mock.calls[registerAction.mock.calls.length - 1][1];
        const ziggy = {
            invoke: jest.fn().mockResolvedValue("/repos/graft"),
            addTask: jest.fn(),
            onTaskCompleted: jest.fn(),
            removeTaskCompletedListener: jest.fn(),
        };
        Object.defineProperty(window, "ziggy", {
            value: ziggy,
            configurable: true,
        });
        await act(async () => {
            await openRepoHandler();
        });
        expect(ziggy.invoke).toHaveBeenCalledWith("pick-repo-folder", null);
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(elementWithDataId("main-content")?.contains(elementWithDataId("commits-page") ?? null)).toBe(true);
        expect(ziggy.addTask).toHaveBeenCalledWith(expect.objectContaining({
            taskType: "commits",
            data: {
                repoPath: "/repos/graft",
                pageSize: 50,
            },
        }));
        expect(elementWithDataId("breadcrumb-repo")?.textContent).toBe("graft");
        expect(elementWithDataId("breadcrumb-repo")?.getAttribute("title")).toBe("/repos/graft");
        act(() => {
            elementWithDataId("commits-about-link")?.click();
        });
        expect((await screen.findByText("About Graft")).getAttribute("data-id")).toBe("about-heading");
        expect(elementWithDataId("breadcrumb-repo")?.textContent).toBe("graft");
        act(() => {
            elementWithDataId("about-commits-link")?.click();
        });
        expect((await screen.findByText("Commits", {
            selector: "h1",
        })).getAttribute("data-id")).toBe("commits-heading");
        act(() => {
            elementWithDataId("left-sidebar-about-link")?.click();
        });
        expect((await screen.findByText("About Graft")).getAttribute("data-id")).toBe("about-heading");
    });

    test("the Help page is on the router and the trail names each page", async () => {
        await screen.findByText("About Graft");
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("About");
        act(() => {
            elementWithDataId("left-sidebar-help-link")?.click();
        });
        expect((await screen.findByText("Help", {
            selector: "h1",
        })).getAttribute("data-id")).toBe("help-heading");
        expect(elementWithDataId("main-content")?.contains(elementWithDataId("help-page") ?? null)).toBe(true);
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("Help");
        act(() => {
            elementWithDataId("breadcrumb-page")?.click();
        });
        act(() => {
            elementWithDataId("breadcrumb-option-about")?.click();
        });
        expect((await screen.findByText("About Graft")).getAttribute("data-id")).toBe("about-heading");
        expect(elementWithDataId("breadcrumb-page")?.textContent).toBe("About");
    });
});

describe("createAppRouter", () => {
    test("starts at the About page's path", () => {
        expect(createAppRouter().state.location.pathname).toBe("/");
    });
});

describe("listenForTestCommands", () => {
    test("does nothing outside test mode", () => {
        const ziggy = installTestCommandZiggy(jest.fn());
        listenForTestCommands("", document);
        listenForTestCommands("?testMode=0", document);
        expect(ziggy.onTestCommand).not.toHaveBeenCalled();
        expect(ziggy.testUiReady).not.toHaveBeenCalled();
    });

    test("in test mode, says it is ready and answers a command from the page", async () => {
        const ziggy = installTestCommandZiggy(jest.fn().mockResolvedValue(undefined));
        listenForTestCommands("?testMode=1", document);
        expect(ziggy.testUiReady).toHaveBeenCalledTimes(1);
        await screen.findByText("About Graft");
        registeredCallback(ziggy)({
            requestId: 7,
            command: {
                command: "get-text",
                dataId: "about-heading",
            },
        });
        expect(ziggy.sendTestResult).toHaveBeenCalledWith(7, {
            ok: true,
            value: "About Graft",
        });
    });

    test("in test mode, a command on an element the page does not have fails", () => {
        const ziggy = installTestCommandZiggy(jest.fn().mockResolvedValue(undefined));
        listenForTestCommands("?testMode=1", document);
        registeredCallback(ziggy)({
            requestId: 8,
            command: {
                command: "click",
                dataId: "missing",
            },
        });
        expect(ziggy.sendTestResult).toHaveBeenCalledWith(8, {
            ok: false,
            error: "No element has the data-id missing.",
        });
    });

    test("reports a result it could not send", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const ziggy = installTestCommandZiggy(jest.fn().mockRejectedValue(new Error("the connection closed")));
        listenForTestCommands("?testMode=1", document);
        registeredCallback(ziggy)({
            requestId: 9,
            command: {
                command: "ready",
            },
        });
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith("Graft could not send the smoke tests the result of the ready command: Error: the connection closed. The smoke test that sent it gets no answer and fails, so look for why the remote control connection failed.");
        });
        consoleError.mockRestore();
    });
});

describe("showSplashScreen", () => {
    //
    // The splash overlays on the page, the one main.tsx showed as it loaded included.
    //
    function splashOverlays(): HTMLElement[] {
        return Array.from(document.querySelectorAll<HTMLElement>("[data-id=\"ziggy-splash\"]"));
    }

    afterEach(() => {
        jest.useRealTimers();
    });

    test("main.tsx covers the page with the splash screen and says the frontend is ready", () => {
        expect(splashOverlays().length).toBeGreaterThan(0);
        expect(installedZiggy.frontendReady).toHaveBeenCalledTimes(1);
    });

    test("covers the page in the splash's colour and art, and says the frontend is ready", () => {
        const ziggy = installSplashZiggy();
        const before = splashOverlays().length;
        showSplashScreen(document);
        const overlays = splashOverlays();
        expect(overlays.length).toBe(before + 1);
        const overlay = overlays[overlays.length - 1];
        expect(overlay.style.background).toBe("rgb(255, 255, 255)");
        expect(overlay.querySelector("img")?.getAttribute("src")).toBe("/ziggy-splash-portrait.png");
        expect(ziggy.frontendReady).toHaveBeenCalledTimes(1);
        overlay.remove();
    });

    test("fades the splash out once the page is in sight, and not for any other event", () => {
        jest.useFakeTimers();
        const ziggy = installSplashZiggy();
        showSplashScreen(document);
        const overlays = splashOverlays();
        const overlay = overlays[overlays.length - 1];
        const onEvent = (ziggy.onEvent as jest.Mock).mock.calls[0][0];
        onEvent(null);
        onEvent({
            type: "menu",
        });
        jest.advanceTimersByTime(10000);
        expect(overlay.isConnected).toBe(true);
        onEvent({
            type: "frontend-visible",
        });
        jest.advanceTimersByTime(400);
        expect(overlay.isConnected).toBe(true);
        jest.advanceTimersByTime(200);
        expect(overlay.isConnected).toBe(false);
    });

    test("holds the splash for half a second after it goes up, then fades it out over half a second", () => {
        jest.useFakeTimers();
        installSplashZiggy();
        showSplashScreen(document);
        const overlays = splashOverlays();
        const overlay = overlays[overlays.length - 1];
        const onEvent = ((window.ziggy as unknown as SplashZiggy).onEvent as jest.Mock).mock.calls[0][0];
        onEvent({
            type: "frontend-visible",
        });
        jest.advanceTimersByTime(499);
        expect(overlay.style.opacity).toBe("");
        jest.advanceTimersByTime(400);
        expect(overlay.isConnected).toBe(true);
        jest.advanceTimersByTime(200);
        expect(overlay.isConnected).toBe(false);
    });
});
