//
// Tests how the frontend starts: loading main.tsx draws the app into the test's document, where
// the router opens on the About page, and the smoke tests' commands are answered only in test
// mode. The bridge to the backend is a fake made of Jest mocks.
//

import { screen, waitFor } from "@testing-library/react";
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
    test("the app opens on the About page", async () => {
        const heading = await screen.findByText("About Graft");
        expect(heading.getAttribute("data-id")).toBe("about-heading");
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
