//
// Tests how the frontend starts: loading main.tsx draws the app into the test's document, where the
// router opens on the About page in the layout's main content area and its links change between the
// About page and the commits page. The Help page is on the router, with the trail following each
// page and its drop-down opening the About page again. The smoke tests' commands are answered only
// in test mode. The bridge to the backend is a fake made of Jest mocks.
//

import { act, screen, waitFor } from "@testing-library/react";
import { ITestCommand } from "../lib/test-commands";
import { createAppRouter, listenForTestCommands, TestCommandBridge } from "../main";
import type { ITestCommandEvent } from "ziggy";

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
// Makes a fake bridge whose sendTestResult settles the way the test asks.
//
function makeBridge(sendTestResult: jest.Mock): TestCommandBridge {
    return {
        onTestCommand: jest.fn(),
        sendTestResult,
        testUiReady: jest.fn(),
    };
}

//
// The callback listenForTestCommands registered with the bridge.
//
function registeredCallback(bridge: TestCommandBridge): (event: ITestCommandEvent<ITestCommand>) => void {
    const onTestCommand = bridge.onTestCommand as jest.Mock;
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

    test("the links change from the About page to the commits page and back", async () => {
        const ziggy = {
            addTask: jest.fn(),
            onTaskCompleted: jest.fn(),
            removeTaskCompletedListener: jest.fn(),
        };
        Object.defineProperty(window, "ziggy", {
            value: ziggy,
            configurable: true,
        });
        await screen.findByText("About Graft");
        act(() => {
            elementWithDataId("about-commits-link")?.click();
        });
        expect((await screen.findByText("Loading the commits.")).getAttribute("data-id")).toBe("commits-loading");
        expect(elementWithDataId("main-content")?.contains(elementWithDataId("commits-page") ?? null)).toBe(true);
        expect(ziggy.addTask).toHaveBeenCalledWith(expect.objectContaining({
            taskType: "commits",
            data: {
                repoPath: "/tmp/graft/test-repo",
                pageSize: 50,
            },
        }));
        act(() => {
            elementWithDataId("commits-about-link")?.click();
        });
        expect((await screen.findByText("About Graft")).getAttribute("data-id")).toBe("about-heading");
    });

    test("the Help page is on the router and the trail starts with the repo Graft reads and names each page", async () => {
        await screen.findByText("About Graft");
        expect(elementWithDataId("breadcrumb-repo")?.textContent).toBe("test-repo");
        expect(elementWithDataId("breadcrumb-repo")?.getAttribute("title")).toBe("/tmp/graft/test-repo");
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
        const bridge = makeBridge(jest.fn());
        listenForTestCommands(bridge, "", document);
        listenForTestCommands(bridge, "?testMode=0", document);
        expect(bridge.onTestCommand).not.toHaveBeenCalled();
        expect(bridge.testUiReady).not.toHaveBeenCalled();
    });

    test("in test mode, says it is ready and answers a command from the page", async () => {
        const bridge = makeBridge(jest.fn().mockResolvedValue(undefined));
        listenForTestCommands(bridge, "?testMode=1", document);
        expect(bridge.testUiReady).toHaveBeenCalledTimes(1);
        await screen.findByText("About Graft");
        registeredCallback(bridge)({
            requestId: 7,
            command: {
                command: "get-text",
                dataId: "about-heading",
            },
        });
        expect(bridge.sendTestResult).toHaveBeenCalledWith(7, {
            ok: true,
            value: "About Graft",
        });
    });

    test("in test mode, a command on an element the page does not have fails", () => {
        const bridge = makeBridge(jest.fn().mockResolvedValue(undefined));
        listenForTestCommands(bridge, "?testMode=1", document);
        registeredCallback(bridge)({
            requestId: 8,
            command: {
                command: "click",
                dataId: "missing",
            },
        });
        expect(bridge.sendTestResult).toHaveBeenCalledWith(8, {
            ok: false,
            error: "No element has the data-id missing.",
        });
    });

    test("reports a result it could not send", async () => {
        const consoleError = jest.spyOn(console, "error").mockImplementation(() => {
        });
        const bridge = makeBridge(jest.fn().mockRejectedValue(new Error("the connection closed")));
        listenForTestCommands(bridge, "?testMode=1", document);
        registeredCallback(bridge)({
            requestId: 9,
            command: {
                command: "ready",
            },
        });
        await waitFor(() => {
            expect(consoleError).toHaveBeenCalledWith("Graft could not send the smoke tests the result of the ready command: Error: the connection closed. The smoke test that sent it gets no answer and fails, so look for why the test control connection failed.");
        });
        consoleError.mockRestore();
    });
});
